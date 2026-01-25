import { Page } from "playwright";
import { domScan } from "../browser/domScan.js";
import { scoreButtons } from "../browser/scoreElements.js";
import { observe } from "../browser/observe.js";

export async function autoAvailability(page: Page, params: { url: string }) {
  await page.goto(params.url, { waitUntil: "networkidle" });

  const scan = await domScan(page);
  const scoredButtons = scoreButtons(scan.buttons);

  const topButton = scoredButtons[0];

  if (topButton && topButton.score > 30) {
    try {
      await page.click(`text=${topButton.text}`);
      const obs = await observe(page);

      return {
        success: true,
        message: "Clicked probable booking button",
        observation: obs,
        slots: scan.possibleSlots.filter(s => !s.disabled)
      };
    } catch {
      // fail silently – observation only
    }
  }

  return {
    success: true,
    message: "Observed page without interaction",
    slots: scan.possibleSlots.filter(s => !s.disabled)
  };
}

