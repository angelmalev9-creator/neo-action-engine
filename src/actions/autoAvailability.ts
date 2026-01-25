import { Page } from "playwright";
import { domScan } from "../browser/domScan.js";
import { scoreButtons } from "../browser/scoreElements.js";
import { observe } from "../browser/observe.js";
import { compareScans } from "../browser/compareScans.js";

export async function autoAvailability(
  page: Page,
  params: { url: string }
) {
  await page.goto(params.url, { waitUntil: "networkidle" });

  // SCAN 0
  const scanBefore = await domScan(page);

  const scoredButtons = scoreButtons(scanBefore.buttons);
  const topButton = scoredButtons[0];

  let actionTaken = false;

  if (topButton && topButton.score > 30 && topButton.text) {
    try {
      await page.click(`text=${topButton.text}`, { timeout: 3000 });
      actionTaken = true;
      await observe(page);
    } catch {
      // ignore click failure
    }
  }

  // SCAN 1
  const scanAfter = await domScan(page);

  const comparison = compareScans(scanBefore, scanAfter);

  return {
    success: true,
    actionTaken,
    confidence: comparison.changed ? "high" : "low",
    summary: comparison.changed
      ? "Page state changed after interaction"
      : "No significant change detected",
    slots: scanAfter.possibleSlots.filter((s: any) => !s.disabled),
    debug: {
      before: scanBefore.possibleSlots.length,
      after: scanAfter.possibleSlots.length
    }
  };
}
