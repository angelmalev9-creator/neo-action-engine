import { chromium, Page, Browser } from "playwright";

export async function withBrowser<T>(
  fn: (page: Page) => Promise<T>
): Promise<T> {
  const browser: Browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    return await fn(page);
  } finally {
    await browser.close();
  }
}
