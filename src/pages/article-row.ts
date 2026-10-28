import type { Locator, Page } from '@playwright/test';
import { NewestPage } from './newest-page.ts';

export class ArticleRow extends NewestPage {
  readonly row: Locator;
  readonly rank: Locator;
  readonly rankAbove: Locator;
  readonly age: Locator;

  /**
   * @param position - Position of the article on the page, starting at 0 for the top article. Negative positions count up from the bottom, e.g. -1 is the bottom article.
   */
  constructor(page: Page, position: number) {
    super(page);
    this.row = this.articleRows.nth(position);
    this.rank = this.row.locator('.rank');
    this.rankAbove = this.row.locator('xpath=preceding-sibling::tr[contains(@class, "athing")][1]').locator('.rank');
    // INFO: The posted time is in the subtext row below the article, e.g. <span class="age" title="2026-10-28T09:12:55">
    this.age = this.row.locator('xpath=following-sibling::tr[1]').locator('.age');
  }

  async getId(): Promise<number> {
    const id = await this.row.getAttribute('id');

    if (!id) {
      throw new Error('Unable to find the article id');
    }

    return Number(id);
  }

  async getPostedAt(): Promise<Date> {
    const timestamp = await this.age.getAttribute('title');
    // INFO: HN timestamps are UTC without an offset, so 'Z' is appended to avoid parsing them in the local timezone
    const postedAt = new Date(`${timestamp?.split(' ')[0]}Z`);

    if (Number.isNaN(postedAt.getTime())) {
      throw new Error(`Unable to parse article posted time from "${timestamp}"`);
    }

    return postedAt;
  }
}
