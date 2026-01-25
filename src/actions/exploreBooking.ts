import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { bookingScan } from "../browser/bookingScan.js";
import { observe } from "../browser/observe.js";

export async function exploreBooking(
  page: Page,
  params: { url: string }
): Promise<ActionResult> {
  const steps: Step[] = [];

  await page.goto(params.url, { waitUntil: "networkidle" });
  steps.push({
    type: "navigate",
    detail: "Отворих сайта и заредих резервационната система"
  });

  const initial = await bookingScan(page);
  steps.push({
    type: "scan",
    detail: "Открих какви избори изисква резервационната форма"
  });

  if (!initial.hasSearchButton) {
    return {
      steps,
      facts: {
        blockedByLogin: false
      },
      result: {
        status: "blocked",
        confidence: "low"
      }
    };
  }

  // Наблюдаваме дали при стандартен сценарий се появяват резултати
  await observe(page);

  const after = await bookingScan(page);

  steps.push({
    type: "observe",
    detail: "Прегледах наличните стаи и цени след стандартна проверка"
  });

  return {
    steps,
    facts: {
      calendarsFound: initial.dateInputs,
      slotsFound: after.rooms.length,
      slotsAvailable: after.rooms.length > 0,
      paymentRequired: after.paymentRequired
    },
    result: {
      status: after.rooms.length > 0
        ? "availability_found"
        : "no_availability",
      confidence: "medium"
    }
  };
}

