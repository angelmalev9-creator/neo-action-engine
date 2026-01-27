import { Page } from "playwright";

export async function domScan(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

 const buttons = Array.from(
      document.querySelectorAll("button, a, [role='button'], input[type='submit'], input[type='button']")
    )
      .filter((el): el is Element => el instanceof Element && visible(el))
      .map((el: Element, idx: number) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || (el as HTMLInputElement).value || "",
        disabled:
          (el as HTMLButtonElement).disabled ||
          el.getAttribute("aria-disabled") === "true",
        selector: el.id ? `#${el.id}` : 
                  el.className ? `${el.tagName.toLowerCase()}.${el.className.split(' ')[0]}` :
                  `${el.tagName.toLowerCase()}:nth-of-type(${idx + 1})`
      }));

    const dateInputs = Array.from(
      document.querySelectorAll(
        "input[type='date'], input[placeholder*='date']"
      )
    )
      .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement)
      .map((el: HTMLInputElement) => ({
        tag: el.tagName.toLowerCase(),
        placeholder: el.placeholder,
        selector: "input"
      }));

    const possibleSlots = Array.from(
      document.querySelectorAll("[class*='slot'], [class*='time']")
    )
      .filter((el): el is Element => el instanceof Element && visible(el))
      .map((el: Element) => ({
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
