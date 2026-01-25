import { Page } from "playwright";

const SUCCESS_TEXT_RE =
  /(thank you|confirmed|reservation received|booking confirmed|successfully booked)/i;

export async function detectConfirmation(page: Page) {
  // 1) URL heuristic
  const url = page.url();
  if (/confirmation|success|thank-you/i.test(url)) {
    return { confirmed: true, signal: "url" };
  }

  // 2) DOM text heuristic
  const bodyText = await page.evaluate(() =>
    document.body?.innerText || ""
  );

  if (SUCCESS_TEXT_RE.test(bodyText)) {
    return { confirmed: true, signal: "text" };
  }

  // 3) Common confirmation blocks
  const hasBlock = await page.evaluate(() => {
    return Boolean(
      document.querySelector(
        "[class*='confirm'], [class*='success'], [id*='confirm'], [id*='success']"
      )
    );
  });

  if (hasBlock) {
    return { confirmed: true, signal: "block" };
  }

  return { confirmed: false };
}
