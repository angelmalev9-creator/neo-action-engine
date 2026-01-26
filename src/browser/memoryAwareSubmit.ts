import { Page } from "playwright";
import { getSiteMemory } from "../memory/siteMemory.js";

export async function memoryAwareSubmit(
  page: Page,
  url: string
): Promise<{ submitted: boolean; selector?: string }> {
  const mem = getSiteMemory(url);
  if (!mem?.submitSelector) {
    return { submitted: false };
  }

  const success = await page.evaluate((selector) => {
    const btn = document.querySelector(selector) as HTMLElement | null;
    if (!btn) return false;
    btn.click();
    return true;
  }, mem.submitSelector);

  return success
    ? { submitted: true, selector: mem.submitSelector }
    : { submitted: false };
}
