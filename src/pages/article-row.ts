import { expect, type Locator, type Page } from '@playwright/test';
import { NewestPage } from './newest-page.ts';

type ArticleDetails = { id: number; postedAt: Date };

const formatTime = (date: Date): string => date.toISOString().replace('.000Z', 'Z');

export class ArticleRow extends NewestPage {
  readonly position: number;
  readonly row: Locator;
  readonly rankLabel: Locator;
  readonly rankLabelAbove: Locator;
  readonly age: Locator;

  private details?: ArticleDetails;

  constructor(
    page: Page,
    readonly rank: number
  ) {
    super(page);
    this.position = (rank - 1) % this.articlesPerPage;
    this.row = this.articleRows.nth(this.position);
    this.rankLabel = this.row.locator('.rank');
    this.rankLabelAbove = this.row
      .locator('xpath=preceding-sibling::tr[contains(@class, "athing")][1]')
      .locator('.rank');
    // INFO: The posted time is in the subtext row below the article, e.g. <span class="age" title="2026-10-28T09:12:55">
    this.age = this.row.locator('xpath=following-sibling::tr[1]').locator('.age');
  }

  get isTopOfPage(): boolean {
    return this.position === 0;
  }

  /**
   * Also records the article's ID and posted time, so it can still be compared with the next article after moving to the next page.
   */
  async shouldBeInPosition(): Promise<void> {
    const message = `#${this.rank} should be article ${this.position + 1} on the page`;
    await expect(this.rankLabel, message).toHaveText(`${this.rank}.`);
    this.details = { id: await this.getId(), postedAt: await this.getPostedAt() };
  }

  async shouldBeBottomArticle(): Promise<void> {
    const bottomRankLabel = this.articleRows.last().locator('.rank');
    await expect(bottomRankLabel, `#${this.rank} should be the bottom article on the page`).toHaveText(`${this.rank}.`);
  }

  async shouldBeDirectlyBelow(articleAbove: ArticleRow): Promise<void> {
    if (this.isTopOfPage) {
      // INFO: The article above was checked to be the bottom article of the previous page, so this page should start at this article
      const { id } = this.recordedDetails;
      await expect(this.page, `URL should start the page at #${this.rank} (id ${id})`).toHaveURL(
        `/newest?next=${id}&n=${this.rank}`
      );
    } else {
      const message = `#${articleAbove.rank} should be directly above #${this.rank}`;
      await expect(this.rankLabelAbove, message).toHaveText(`${articleAbove.rank}.`);
    }
  }

  /**
   * Soft assertion, so every out-of-order article is reported. Articles posted in the same second are ordered by ID, as IDs increase with every submission.
   */
  async shouldBeOlderThan(articleAbove: ArticleRow): Promise<void> {
    const above = articleAbove.recordedDetails;
    const { id, postedAt } = this.recordedDetails;
    const [timeAbove, time] = [formatTime(above.postedAt), formatTime(postedAt)];

    if (above.postedAt.getTime() === postedAt.getTime()) {
      const message = `#${articleAbove.rank} and #${this.rank} were both posted at ${time}, so #${articleAbove.rank} should have the higher ID`;
      expect.soft(above.id, message).toBeGreaterThan(id);
    } else {
      const message = `#${articleAbove.rank} (${timeAbove}) should be posted later than #${this.rank} (${time})`;
      expect.soft(above.postedAt.getTime(), message).toBeGreaterThan(postedAt.getTime());
    }
  }

  private get recordedDetails(): ArticleDetails {
    if (!this.details) {
      throw new Error(`#${this.rank} has to be checked with shouldBeInPosition() before it can be compared`);
    }

    return this.details;
  }

  private async getId(): Promise<number> {
    const id = await this.row.getAttribute('id');

    if (!id) {
      throw new Error('Unable to find the article id');
    }

    return Number(id);
  }

  private async getPostedAt(): Promise<Date> {
    const timestamp = await this.age.getAttribute('title');
    // INFO: HN timestamps are UTC without an offset, so 'Z' is appended to avoid parsing them in the local timezone
    const postedAt = new Date(`${timestamp?.split(' ')[0]}Z`);

    if (Number.isNaN(postedAt.getTime())) {
      throw new Error(`Unable to parse article posted time from "${timestamp}"`);
    }

    return postedAt;
  }
}
