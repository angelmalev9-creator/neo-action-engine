import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { domScan } from "../browser/domScan.js";
import { scoreButtons } from "../browser/scoreElements.js";
import { observe } from "../browser/observe.js";
import { compareScans } from "../browser/compareScans.js";
import { iframeScan } from "../browser/iframeScan.js";

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

  // 2) IFRAME SCAN (като scan)
  const iframeInfo = await iframeScan(page);
  steps.push({
    type: "scan",
    detail: `Iframe detected=${iframeInfo.hasIframe}, blocked=${iframeInfo.blocked}`
  });

  // 3) SCAN BEFORE
  const scanBefore = await domScan(page);
  steps.push({
    type: "scan",
    detail: "Прегледах страницата за бутони, календари и слотове"
  });

  // 4) DECIDE + CLICK
  let actionTaken = false;
  const scoredButtons = scoreButtons(scanBefore.buttons);
  const topButton = scoredButtons[0];

  if (
    !iframeInfo.blocked &&
    topButton &&
    topButton.score > 30 &&
    topButton.selector
  ) {
    try {
      await page.click(topButton.selector, { timeout: 3000 });
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
      steps.push({
        type: "observe",
        detail: "Опит за клик, но без ефект"
      });
    }
  }

  // 5) SCAN AFTER
  const scanAfter = await domScan(page);
  const comparison = compareScans(scanBefore, scanAfter);

  const availableSlots = (scanAfter.possibleSlots || []).filter(
    (s: any) => !s.disabled
  );

  const facts = {
    iframeDetected: iframeInfo.hasIframe,
    iframeBlocked: iframeInfo.blocked,
    iframeMode: iframeInfo.mode,
    provider: iframeInfo.providerHint,
    slotsFound: scanAfter.possibleSlots?.length || 0,
    slotsAvailable: availableSlots.length > 0,
    pageChangedAfterAction: comparison.changed,
    actionTaken
  };

  const result: ActionResult["result"] = {
    status: facts.slotsAvailable ? "availability_found" : "no_availability",
    confidence: iframeInfo.blocked
      ? "low"
      : comparison.changed
      ? "high"
      : "medium"
  };

  return {
    steps,
    facts,
    result
  };
}
