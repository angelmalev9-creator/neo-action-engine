import { Page } from "playwright";

interface AvailabilityParams {
  url: string;
  calendarSelector: string;
  slotSelector: string;
}

export async function checkAvailability(
  page: Page,
  params: AvailabilityParams
) {
  const { url, calendarSelector, slotSelector } = params;

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(calendarSelector, { timeout: 15000 });

  const slots = await page.$$eval(
    slotSelector,
    els =>
      els
        .filter(e => {
          const disabled =
            e.classList.contains("disabled") ||
            e.getAttribute("aria-disabled") === "true";
          return !disabled;
        })
        .map(e => e.textContent?.trim())
        .filter(Boolean)
  );

  return {
    success: slots.length > 0,
    slots,
  };
}
