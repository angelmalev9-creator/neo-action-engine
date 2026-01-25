import { Page } from "playwright";

export async function bookingScan(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const dateInputs = Array.from(
      document.querySelectorAll("input[type='date']")
    ).filter(visible);

    const guestInputs = Array.from(
      document.querySelectorAll(
        "select[name*='guest'], select[name*='adult'], input[name*='guest']"
      )
    ).filter(visible);

    const searchButtons = Array.from(
      document.querySelectorAll(
        "button, input[type='submit'], [role='button']"
      )
    )
      .filter(visible)
      .filter(el =>
        /search|check|availability|find/i.test(el.textContent || "")
      );

    const roomCards = Array.from(
      document.querySelectorAll(
        "[class*='room'], [class*='accommodation'], [class*='rate']"
      )
    )
      .filter(visible)
      .map(el => ({
        text: el.textContent?.trim() || ""
      }));

    const paymentHints = Array.from(
      document.querySelectorAll(
        "input[name*='card'], [class*='payment'], [class*='checkout']"
      )
    );

    return {
      dateInputs: dateInputs.length,
      guestInputs: guestInputs.length,
      hasSearchButton: searchButtons.length > 0,
      rooms: roomCards.slice(0, 5),
      paymentRequired: paymentHints.length > 0
    };
  });
}

