import { getBrowser } from "../browser/getBrowser.js";

type AvailabilityPayload = {
  siteUrl: string;
  room: {
    selector: string;
    name: string;
  };
  dates: {
    from: string;
    to: string;
  };
};

export async function checkAvailability(payload: AvailabilityPayload) {
  const { siteUrl, room } = payload;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(siteUrl, { waitUntil: "networkidle" });

    // опит да намерим стаята
    const roomEl = await page.$(room.selector);

    if (!roomEl) {
      return {
        available: false,
        reason: "ROOM_NOT_FOUND"
      };
    }

    // търсим индикатори за липса
    const soldOutText = await page.evaluate(el => {
      return el.textContent?.toLowerCase() || "";
    }, roomEl);

    if (
      soldOutText.includes("sold") ||
      soldOutText.includes("unavailable") ||
      soldOutText.includes("no availability")
    ) {
      return {
        available: false,
        room: room.name
      };
    }

    // опит за цена
    const price = await page.evaluate(el => {
      const match = el.textContent?.match(/(\d+[\.,]?\d*)\s?(€|eur|лв)/i);
      return match ? match[0] : null;
    }, roomEl);

    return {
      available: true,
      room: room.name,
      price: price || "unknown"
    };
  } catch (e) {
    return {
      available: false,
      error: e instanceof Error ? e.message : String(e)
    };
  } finally {
    await page.close();
  }
}
