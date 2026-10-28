import { expect, test } from '@playwright/test';
import { ArticleRow } from '../pages/article-row.ts';
import { NewestPage } from '../pages/newest-page.ts';

const ARTICLE_COUNT = 100;

const formatTime = (date: Date): string => date.toISOString().replace('.000Z', 'Z');

test.describe('Hacker News - Newest', () => {
  test(`should sort the first ${ARTICLE_COUNT} articles from newest to oldest`, async ({ page }) => {
    const newestPage = new NewestPage(page);
    await newestPage.open();

    const articlesPerPage = await newestPage.articleRows.count();
    let articleAbove: { id: number; postedAt: Date } | undefined;

    for (let rank = 1; rank <= ARTICLE_COUNT; rank++) {
      const position = (rank - 1) % articlesPerPage;

      await test.step(`Rank ${rank}`, async () => {
        if (position === 0 && rank > 1) {
          const bottomArticle = new ArticleRow(page, -1);
          const bottomMessage = `#${rank - 1} should be the bottom article on the page`;
          await expect(bottomArticle.rank, bottomMessage).toHaveText(`${rank - 1}.`);
          await newestPage.openNextPage();
        }

        const article = new ArticleRow(page, position);
        await expect(article.rank, `#${rank} should be article ${position + 1} on the page`).toHaveText(`${rank}.`);

        const id = await article.getId();
        const postedAt = await article.getPostedAt();

        if (position > 0) {
          const aboveMessage = `#${rank - 1} should be directly above #${rank}`;
          await expect(article.rankAbove, aboveMessage).toHaveText(`${rank - 1}.`);
        } else if (rank > 1) {
          const urlMessage = `URL should start the page at #${rank} (id ${id})`;
          await expect(page, urlMessage).toHaveURL(`/newest?next=${id + 1}&n=${rank}`);
        }

        if (articleAbove) {
          const [timeAbove, time] = [formatTime(articleAbove.postedAt), formatTime(postedAt)];

          if (articleAbove.postedAt.getTime() === postedAt.getTime()) {
            const tieMessage = `#${rank - 1} and #${rank} were both posted at ${time}, so #${rank - 1} should have the higher ID`;
            expect.soft(articleAbove.id, tieMessage).toBeGreaterThan(id);
          } else {
            const timeMessage = `#${rank - 1} (${timeAbove}) should be posted later than #${rank} (${time})`;
            expect.soft(articleAbove.postedAt.getTime(), timeMessage).toBeGreaterThan(postedAt.getTime());
          }
        }

        articleAbove = { id, postedAt };
      });
    }
  });
});
