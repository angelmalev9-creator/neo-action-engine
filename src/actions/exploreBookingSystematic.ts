import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { bookingScan } from "../browser/bookingScan.js";
import { observe } from "../browser/observe.js";

type Scenario = {
  label: string;
  guests: number;
  nights: number;
};

const SCENARIOS: Scenario[] = [
  { label: "2 guests / 1 night", guests: 2, nights: 1 },
  { label: "2 guests / 2 nights", guests: 2, nights: 2 },
  { label: "3 guests / 2 nights", guests: 3, nights: 2 }
];

export async function exploreBookingSystematic(
  page: Page,
  params: { url: string }
): Promise<ActionResult> {
  const steps: Step[] = [];
  const results: any[] = [];

  await page.goto(params.url, { waitUntil: "networkidle" });
  steps.push({
    type: "navigate",
    detail: "Отворих сайта и влязох в резервационната система"
  });

  for (const scenario of SCENARIOS) {
    steps.push({
      type: "scan",
      detail: `Проверявам сценарий: ${scenario.label}`
    });

    /**
     * v1: НЕ пипаме конкретни input-и
     * Това ще стане във v2
     * Засега само наблюдаваме резултатите
     */
    await observe(page);

    const scan = await bookingScan(page);

    results.push({
      scenario: scenario.label,
      roomsFound: scan.rooms.length,
      paymentRequired: scan.paymentRequired,
      sampleRooms: scan.rooms
    });
  }

  const anyAvailability = results.some(r => r.roomsFound > 0);

  return {
    steps,
    facts: {
      slotsAvailable: anyAvailability,
      paymentRequired: results.some(r => r.paymentRequired)
    },
    result: {
      status: anyAvailability
        ? "availability_found"
        : "no_availability",
      confidence: "medium"
    }
  };
}
