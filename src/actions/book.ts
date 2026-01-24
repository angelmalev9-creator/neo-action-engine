import { getBrowser } from "../browser/getBrowser";

export async function bookAction(payload: any) {
  const { siteUrl, form, customer } = payload;

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

