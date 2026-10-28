import { expect, type Locator, type Page } from '@playwright/test';

export class NewestPage {
  readonly url = '/newest';
  readonly articlesPerPage = 30;

  readonly articleRows: Locator;
  readonly moreLink: Locator;

  constructor(protected readonly page: Page) {
    this.articleRows = page.locator('tr.athing.submission');
    this.moreLink = page.locator('a.morelink');
  }

  async open(): Promise<void> {
    await this.page.goto(this.url);
    await expect(this.articleRows.first()).toBeVisible();
  }

  async openNextPage(): Promise<void> {
    const currentUrl = this.page.url();
    await this.moreLink.click();
    await this.page.waitForURL(url => url.href !== currentUrl);
  }
}
