import { Page } from "playwright";

export async function observe(page: Page, timeout = 3000) {
  const before = await page.content();

  await page.waitForTimeout(timeout);

  const after = await page.content();

  return {
    changed: before !== after
  };
}

