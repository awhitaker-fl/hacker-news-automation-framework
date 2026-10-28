import { test } from '@playwright/test';
import { ArticleRow } from '../pages/article-row.ts';
import { NewestPage } from '../pages/newest-page.ts';

const ARTICLE_COUNT = 100;

test.describe('Hacker News - Newest', () => {
  test(`should sort the first ${ARTICLE_COUNT} articles from newest to oldest`, async ({ page }) => {
    const newestPage = new NewestPage(page);
    await newestPage.open();

    let articleAbove: ArticleRow | undefined;

    for (let rank = 1; rank <= ARTICLE_COUNT; rank++) {
      await test.step(`Rank ${rank}`, async () => {
        const article = new ArticleRow(page, rank);

        if (articleAbove && article.isTopOfPage) {
          await articleAbove.shouldBeBottomArticle();
          await newestPage.openNextPage();
        }

        await article.shouldBeInPosition();

        if (articleAbove) {
          await article.shouldBeDirectlyBelow(articleAbove);
          await article.shouldBeOlderThan(articleAbove);
        }

        articleAbove = article;
      });
    }
  });
});
