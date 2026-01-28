import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { domScan } from "../browser/domScan.js";
import { scoreButtons } from "../browser/scoreElements.js";
import { observe } from "../browser/observe.js";
import { compareScans } from "../browser/compareScans.js";
import { iframeScan } from "../browser/iframeScan.js";

export async function autoAvailability(
  page: Page,
  params: { url: string; dates?: { from: string; to: string }; guests?: number; room?: string }
): Promise<ActionResult & { success: boolean; available: boolean }> {

  const steps: Step[] = [];
  console.log(`[autoAvailability] Starting for URL: ${params.url}`);

  // 1) NAVIGATE
  try {
    await page.goto(params.url, { waitUntil: "networkidle", timeout: 30000 });
    steps.push({
      type: "navigate",
      detail: "Отворих сайта и изчаках страницата да се зареди"
    });
    console.log(`[autoAvailability] ✅ Page loaded`);
  } catch (navError) {
    console.log(`[autoAvailability] ❌ Navigation failed:`, navError);
    return {
      success: false,
      available: false,
      steps: [{ type: "navigate", detail: "Грешка при зареждане на сайта" }],
      facts: { error: "navigation_failed" },
      result: { status: "error", confidence: "low" }
    };
  }

  // 2) IFRAME SCAN
  const iframeInfo = await iframeScan(page);
  steps.push({
    type: "scan",
    detail: `Iframe detected=${iframeInfo.hasIframe}, blocked=${iframeInfo.blocked}`
  });
  console.log(`[autoAvailability] Iframe info:`, JSON.stringify(iframeInfo));

  // 3) SCAN BEFORE
  const scanBefore = await domScan(page);
  steps.push({
    type: "scan",
    detail: `Намерих ${scanBefore.buttons.length} бутона, ${scanBefore.dateInputs.length} полета за дати`
  });
  console.log(`[autoAvailability] Found ${scanBefore.buttons.length} buttons`);

  // 4) DECIDE + CLICK on booking button
  let actionTaken = false;
  let clickedButton = "";
  const scoredButtons = scoreButtons(scanBefore.buttons);
  const topButton = scoredButtons[0];

  console.log(`[autoAvailability] Top button:`, topButton ? `${topButton.text} (score: ${topButton.score})` : "none");

  if (
    !iframeInfo.blocked &&
    topButton &&
    topButton.score > 30 &&
    topButton.selector
  ) {
    try {
      console.log(`[autoAvailability] Clicking: ${topButton.selector} (${topButton.text})`);
      await page.click(topButton.selector, { timeout: 5000 });
      actionTaken = true;
      clickedButton = topButton.text;
      steps.push({
        type: "click",
        detail: `Натиснах бутон „${topButton.text}"`
      });

      await observe(page);
      steps.push({
        type: "observe",
        detail: "Изчаках страницата да се обнови"
      });
      console.log(`[autoAvailability] ✅ Button clicked successfully`);
    } catch (clickError) {
      console.log(`[autoAvailability] ⚠️ Click failed:`, clickError);
      steps.push({
        type: "observe",
        detail: "Бутонът не реагира на клик"
      });
    }
  } else {
    console.log(`[autoAvailability] ⚠️ No suitable button found or iframe blocked`);
  }

  // 5) SCAN AFTER
  const scanAfter = await domScan(page);
  const comparison = compareScans(scanBefore, scanAfter);

  // Look for room/price elements
  const priceElements = await page.$$eval(
    "[class*='price'], [class*='rate'], [class*='cost'], [class*='цена'], [class*='лв'], [class*='EUR'], [class*='BGN']",
    els => els.map(el => el.textContent?.trim() || "").filter(t => t.length > 0)
  ).catch(() => []);

  const roomElements = await page.$$eval(
    "[class*='room'], [class*='стая'], [class*='accommodation'], [class*='настаняване']",
    els => els.map(el => el.textContent?.trim() || "").filter(t => t.length > 0)
  ).catch(() => []);

  console.log(`[autoAvailability] Found prices:`, priceElements.slice(0, 3));
  console.log(`[autoAvailability] Found rooms:`, roomElements.slice(0, 3));

  const availableSlots = (scanAfter.possibleSlots || []).filter(
    (s: any) => !s.disabled
  );

  // Determine availability based on multiple signals
  const hasAvailability = 
    availableSlots.length > 0 || 
    priceElements.length > 0 || 
    roomElements.length > 0 ||
    comparison.changed;

  const facts = {
    iframeDetected: iframeInfo.hasIframe,
    iframeBlocked: iframeInfo.blocked,
    iframeMode: iframeInfo.mode,
    provider: iframeInfo.providerHint,
    buttonsFound: scanBefore.buttons.length,
    buttonClicked: clickedButton,
    slotsFound: scanAfter.possibleSlots?.length || 0,
    slotsAvailable: availableSlots.length,
    pricesFound: priceElements.length,
    roomsFound: roomElements.length,
    pageChangedAfterAction: comparison.changed,
    actionTaken
  };

  const confidence = iframeInfo.blocked
    ? "low"
    : (comparison.changed || priceElements.length > 0)
    ? "high"
    : "medium";

  const result = {
    status: hasAvailability ? "availability_found" : "no_availability",
    confidence
  };

  console.log(`[autoAvailability] ✅ Complete. Available: ${hasAvailability}, Confidence: ${confidence}`);

  // ═══════════════════════════════════════════════════════════════
  // RETURN FORMAT THAT NEO EXPECTS: { success, available, ... }
  // ═══════════════════════════════════════════════════════════════
  return {
    success: true,
    available: hasAvailability,
    steps,
    facts,
    result
  };
}
