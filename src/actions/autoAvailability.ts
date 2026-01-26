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

  // 2) IFRAME SCAN
  const iframeInfo = await iframeScan(page);
  steps.push({
    type: "iframe-scan",
    detail: `Iframe scan: mode=${iframeInfo.mode}, count=${iframeInfo.iframeCount}`
  });

  // ❌ HARD BLOCK
  if (iframeInfo.mode === "cross-origin-blocked") {
    return {
      steps,
      facts: {
        iframeDetected: true,
        iframeMode: iframeInfo.mode,
        provider: iframeInfo.providerHint
      },
      result: {
        status: "availability_external_blocked",
        confidence: "high"
      }
    };
  }

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

  const allowClick =
    topButton &&
    topButton.score > 30 &&
    topButton.selector &&
    iframeInfo.mode !== "cross-origin-blocked";

  if (allowClick) {
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
        type: "click-failed",
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
    iframeMode: iframeInfo.mode,
    provider: iframeInfo.providerHint,
    buttonsFound: scanAfter.buttons?.length || 0,
    bookingButtonsFound: scoredButtons.filter(b => b.score > 30).length,
    slotsFound: scanAfter.possibleSlots?.length || 0,
    slotsAvailable: availableSlots.length > 0,
    pageChangedAfterAction: comparison.changed,
    actionTaken,
    readOnly: iframeInfo.mode === "cross-origin-readable"
  };

  // 6) RESULT LOGIC (FIXED)
  let status: ActionResult["result"]["status"];
  let confidence: ActionResult["result"]["confidence"];

  if (facts.slotsAvailable) {
    status = "availability_found";
    confidence = "high";
  } else if (iframeInfo.mode === "cross-origin-readable") {
    status = "availability_external_readonly";
    confidence = "medium";
  } else {
    status = "no_availability";
    confidence = comparison.changed ? "medium" : "low";
  }

  return {
    steps,
    facts,
    result: { status, confidence }
  };
}
