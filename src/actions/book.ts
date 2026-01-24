import { getBrowser } from "../browser/getBrowser.js";

export async function bookAction(payload: any) {
  const { siteUrl, form } = payload;

  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.goto(siteUrl, { waitUntil: "networkidle" });

  for (const field of form.fields) {
    await page.fill(field.selector, field.value);
  }

  await Promise.all([
    page.click(form.submitSelector),
    page.waitForNavigation({ waitUntil: "networkidle" })
  ]);

  const content = await page.content();

  return {
    success: true,
    confirmationHtml: content
  };
}
