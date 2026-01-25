import { Page } from "playwright";

interface BookingParams {
  url: string;
  submitSelector: string;
  successSelector: string;
}

export async function book(
  page: Page,
  params: BookingParams
) {
  const { url, submitSelector, successSelector } = params;

  await page.goto(url, { waitUntil: "networkidle" });
  await page.click(submitSelector);

  try {
    await page.waitForSelector(successSelector, { timeout: 10000 });
    return { success: true };
  } catch {
    return { success: false };
  }
}
