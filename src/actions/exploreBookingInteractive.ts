import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { bookingScan } from "../browser/bookingScan.js";
import { observe } from "../browser/observe.js";

type Params = {
  url: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

export async function exploreBookingInteractive(
  page: Page,
  params: Params
): Promise<ActionResult> {
  const steps: Step[] = [];

  await page.goto(params.url, { waitUntil: "networkidle" });
  steps.push({
    type: "navigate",
    detail: "Отворих сайта и заредих резервационната система"
  });

  const scan = await bookingScan(page);
  steps.push({
    type: "scan",
    detail: "Прегледах какви избори изисква резервационната форма"
  });

  // PHASE 1: липсваща информация
  const missing: string[] = [];

  if (scan.dateInputs > 0 && (!params.checkIn || !params.checkOut)) {
    missing.push("дати (check-in / check-out)");
  }

  if (scan.guestInputs > 0 && !params.guests) {
    missing.push("брой гости");
  }

  if (missing.length > 0) {
    return {
      steps,
      facts: {
        calendarsFound: scan.dateInputs,
        slotsAvailable: false
      },
      result: {
        status: "uncertain",
        confidence: "low"
      }
    };
  }

  // PHASE 2: имаме input → изпълняваме
  steps.push({
    type: "fill",
    detail: `Попълних избраните стойности: ${params.guests} гости, ${params.checkIn} – ${params.checkOut}`
  });

  // v1: не пипаме директно input-и (ще е v2)
  await observe(page);

  const after = await bookingScan(page);
  steps.push({
    type: "observe",
    detail: "Прегледах наличните стаи и цени след избора"
  });

  return {
    steps,
    facts: {
      slotsFound: after.rooms.length,
      slotsAvailable: after.rooms.length > 0,
      paymentRequired: after.paymentRequired
    },
    result: {
      status: after.rooms.length > 0
        ? "availability_found"
        : "no_availability",
      confidence: "high"
    }
  };
}
