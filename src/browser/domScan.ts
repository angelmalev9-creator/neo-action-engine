import { Page } from "playwright";

export async function domScan(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const buttons = Array.from(
      document.querySelectorAll("button, a, [role='button']")
    )
      .filter(visible)
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || "",
        disabled:
          (el as any).disabled ||
          el.getAttribute("aria-disabled") === "true",
        selector: el.tagName.toLowerCase()
      }));

    const dateInputs = Array.from(
      document.querySelectorAll("input[type='date'], input[placeholder*='date']")
    )
      .filter(visible)
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        placeholder: (el as HTMLInputElement).placeholder,
        selector: "input"
      }));

    const possibleSlots = Array.from(
      document.querySelectorAll("[class*='slot'], [class*='time']")
    )
      .filter(visible)
      .map(el => ({
        text: el.textContent?.trim() || "",
        disabled:
          el.classList.contains("disabled") ||
          el.getAttribute("aria-disabled") === "true"
      }));

    return {
      buttons,
      dateInputs,
      possibleSlots
    };
  });
}

