import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { domScan } from "../browser/domScan.js";
import { scoreButtons } from "../browser/scoreElements.js";
import { observe } from "../browser/observe.js";
import { compareScans } from "../browser/compareScans.js";



export async function autoAvailability(
  page: Page,
  params: { url: string }
): Promise<ActionResult> {

  const steps: Step[] = [];

  // 1) NAVIGATE
  await page.goto(params.url, { waitUntil: "networkidle" });
  steps.push({
    type: "navigate",
    detail: "Отворих сайта и изчаках страницата да се зареди"
  });

  // 2) SCAN BEFORE
  const scanBefore = await domScan(page);
  steps.push({
    type: "scan",
    detail: "Прегледах страницата за бутони, календари и слотове"
  });

  // 3) DECIDE + CLICK (SAFE)
  const scoredButtons = scoreButtons(scanBefore.buttons);
  const topButton = scoredButtons[0];

  let actionTaken = false;

  if (topButton && topButton.score > 30 && topButton.text) {
    try {
      await page.click(`text=${topButton.text}`, { timeout: 3000 });
      actionTaken = true;
      steps.push({
        type: "click",
        detail: `Натиснах бутон „${topButton.text}“`
      });

      await observe(page);
      steps.push({
        type: "observe",
        detail: "Наблюдавах дали страницата се промени след действието"
      });
    } catch {
      // тих fail – само наблюдение
    }
  }

  // 4) SCAN AFTER
  const scanAfter = await domScan(page);
  const comparison = compareScans(scanBefore, scanAfter);

  // FACTS (обективни)
  const availableSlots = (scanAfter.possibleSlots || []).filter(
    (s: any) => !s.disabled
  );

  const facts = {
    buttonsFound: scanAfter.buttons?.length || 0,
    bookingButtonsFound: scoredButtons.filter(b => b.score > 30).length,
    slotsFound: scanAfter.possibleSlots?.length || 0,
    slotsAvailable: availableSlots.length > 0,
    pageChangedAfterAction: comparison.changed
  };

  // RESULT (ограничен)
 const result: ActionResult["result"] = {
  status: facts.slotsAvailable
    ? "availability_found"
    : "no_availability",
  confidence: comparison.changed ? "high" : "low"
};


 const response: ActionResult = {
  steps,
  facts,
  result
};

return response;

}
