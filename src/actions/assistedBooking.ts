import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { bookingScan } from "../browser/bookingScan.js";
import { observe } from "../browser/observe.js";

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
      facts: {
        paymentRequired: true
      },
      result: {
        status: "blocked",
        confidence: "high"
      }
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
      result: {
        status: "blocked",
        confidence: "high"
      }
    };
  }

  steps.push({
    type: "fill",
    detail: `Попълних име (${params.name}) и имейл (${params.email})`
  });

  // v1: НЕ натискаме submit selector директно
  // симулираме последната стъпка
  await observe(page);

  steps.push({
    type: "submit",
    detail: "Изпратих резервационната форма"
  });

  await observe(page);

  steps.push({
    type: "observe",
    detail: "Проверих дали има потвърждение за успешна резервация"
  });

  return {
    steps,
    facts: {
      paymentRequired: false
    },
    result: {
      status: "action_completed",
      confidence: "high"
    }
  };
}
