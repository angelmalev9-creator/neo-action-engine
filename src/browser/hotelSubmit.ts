import { Page } from "playwright";

export async function hotelOptimizedSubmit(
  page: Page,
  data: { name: string; email: string }
): Promise<{ submitted: boolean; reason?: string }> {
  // 1) fill inputs
  const filled = await page.evaluate(({ name, email }) => {
    let ok = false;

    const inputs = Array.from(document.querySelectorAll("input"));

    for (const input of inputs) {
      const n = input.getAttribute("name") || "";
      const p = input.getAttribute("placeholder") || "";

      if (/name|full.?name/i.test(n + p)) {
        input.value = name;
        ok = true;
      }

      if (/email/i.test(n + p)) {
        input.value = email;
        ok = true;
      }
    }

    return ok;
  }, data);

  if (!filled) {
    return { submitted: false, reason: "form_fields_not_found" };
  }

  // 2) find submit button
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll("button, input[type='submit']")
    );

    const btn = buttons.find(b =>
      /book|reserve|confirm|submit/i.test(b.textContent || "")
    ) as HTMLElement | undefined;

    if (!btn) return false;

    btn.click();
    return true;
  });

  if (!clicked) {
    return { submitted: false, reason: "submit_not_found" };
  }

  return { submitted: true };
}
