import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { bookingScan } from "../browser/bookingScan.js";
import { observe } from "../browser/observe.js";
import { detectConfirmation } from "../browser/confirmDetection.js";
import { hotelOptimizedSubmit } from "../browser/hotelSubmit.js";
import { memoryAwareSubmit } from "../browser/memoryAwareSubmit.js";
import { saveSiteMemory } from "../memory/siteMemory.js";

type Params = {
  url: string;
  mode: "preview" | "execute";
  name?: string;
  email?: string;
};

export async function assistedBooking(
  page: Page,
  params: Params
): Promise<ActionResult> {
  const steps: Step[] = [];

  await page.goto(params.url, { waitUntil: "networkidle" });
  steps.push({
    type: "navigate",
    detail: "Отворих сайта и стигнах до резервационната форма"
  });

  const scan = await bookingScan(page);

  // SAFETY CHECK
  if (scan.paymentRequired) {
    steps.push({
      type: "stop",
      detail: "Системата изисква плащане – спирам резервацията"
    });

    return {
      steps,
      facts: { paymentRequired: true },
      result: { status: "blocked", confidence: "high" }
    };
  }

  // PREVIEW MODE
  if (params.mode === "preview") {
    steps.push({
      type: "scan",
      detail: "Проверих дали резервацията може да се направи безплатно"
    });

    steps.push({
      type: "wait",
      detail: "Готов съм да направя резервацията след ваше потвърждение"
    });

    return {
      steps,
      facts: {
        paymentRequired: false,
        slotsAvailable: scan.rooms.length > 0
      },
      result: {
        status: "ready_to_submit",
        confidence: "high"
      }
    };
  }

  // EXECUTE MODE
  if (!params.name || !params.email) {
    steps.push({
      type: "stop",
      detail: "Липсва име или имейл – не мога да завърша резервацията"
    });

    return {
      steps,
      facts: {},
      result: { status: "blocked", confidence: "high" }
    };
  }

  steps.push({
    type: "fill",
    detail: "Попълвам данните за резервация"
  });

  // 1️⃣ ОПИТ С MEMORY
  const memorySubmit = await memoryAwareSubmit(page, params.url);

  if (memorySubmit.submitted) {
    steps.push({
      type: "submit",
      detail: "Използвах запомнен submit бутон за този сайт"
    });
  } else {
    // 2️⃣ FALLBACK → HEURISTICS
    const submitResult = await hotelOptimizedSubmit(page, {
      name: params.name,
      email: params.email
    });

    if (!submitResult.submitted) {
      steps.push({
        type: "stop",
        detail: `Не успях да намеря безопасен submit бутон (${submitResult.reason})`
      });

      return {
        steps,
        facts: { paymentRequired: false, submitted: false },
        result: { status: "blocked", confidence: "high" }
      };
    }

    steps.push({
      type: "submit",
      detail: "Изпратих резервационната форма"
    });
  }

  // изчакваме реакцията
  await observe(page);

  // CONFIRMATION DETECTION
  const confirmation = await detectConfirmation(page);

  steps.push({
    type: "observe",
    detail: confirmation.confirmed
      ? "Открих потвърждение за успешна резервация"
      : "Не открих ясен сигнал за потвърждение"
  });

  // SAVE MEMORY ПРИ УСПЕХ
  if (confirmation.confirmed) {
    saveSiteMemory(params.url, {
      confirmationSignal: confirmation.signal
    });
  }

  return {
    steps,
    facts: {
      paymentRequired: false,
      confirmed: confirmation.confirmed,
      confirmationSignal: confirmation.signal || null
    },
    result: {
      status: confirmation.confirmed
        ? "action_completed"
        : "uncertain",
      confidence: confirmation.confirmed
        ? "very_high"
        : "medium"
    }
  };
}
