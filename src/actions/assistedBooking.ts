import { Page } from "playwright";
import type { ActionResult, Step } from "../contracts/actionResult.js";
import { bookingScan } from "../browser/bookingScan.js";
import { observe } from "../browser/observe.js";
import { detectConfirmation } from "../browser/confirmDetection.js";
import { hotelOptimizedSubmit } from "../browser/hotelSubmit.js";
import { memoryAwareSubmit } from "../browser/memoryAwareSubmit.js";
import { saveSiteMemory } from "../memory/siteMemory.js";
import { sendBookingEmails } from "../email/sendBookingEmails.js";
import { iframeScan } from "../browser/iframeScan.js";

type Params = {
  url: string;
  mode: "preview" | "execute";
  executionMode?: "demo" | "real";
  name?: string;
  email?: string;
};

export async function assistedBooking(
  page: Page,
  params: Params
): Promise<ActionResult> {
  const steps: Step[] = [];
  const executionMode = params.executionMode ?? "demo";

  // 1️⃣ NAVIGATE
  await page.goto(params.url, { waitUntil: "networkidle" });
  steps.push({
    type: "navigate",
    detail: "Отворих сайта и стигнах до резервационната форма"
  });

  // 2️⃣ IFRAME SCAN
  const iframeInfo = await iframeScan(page);
  steps.push({
    type: "scan",
    detail: `Iframe detected=${iframeInfo.hasIframe}, blocked=${iframeInfo.blocked}`
  });

  // ❌ HARD STOP — BLOCKED IFRAME
  if (iframeInfo.blocked) {
    steps.push({
      type: "stop",
      detail: "Резервационната система е външна и не позволява автоматично изпълнение"
    });

    return {
      steps,
      facts: {
        iframeDetected: true,
        iframeBlocked: true,
        provider: iframeInfo.providerHint
      },
      result: {
        status: "no_availability",
        confidence: "high"
      }
    };
  }

  // 3️⃣ BOOKING SCAN
  const scan = await bookingScan(page);

  // SAFETY: PAYMENT
  if (scan.paymentRequired) {
    steps.push({
      type: "stop",
      detail: "Системата изисква плащане – спирам резервацията"
    });

    return {
      steps,
      facts: {
        paymentRequired: true,
        iframeDetected: iframeInfo.hasIframe
      },
      result: {
        status: "no_availability",
        confidence: "high"
      }
    };
  }

  // 4️⃣ PREVIEW MODE
  if (params.mode === "preview") {
    steps.push({
      type: "scan",
      detail: iframeInfo.hasIframe
        ? "Външна система – възможен е само преглед"
        : "Резервацията може да се направи безплатно"
    });

    steps.push({
      type: "wait",
      detail: "Готов съм да продължа след потвърждение"
    });

    return {
      steps,
      facts: {
        paymentRequired: false,
        iframeDetected: iframeInfo.hasIframe,
        readOnly: iframeInfo.mode === "cross-origin-readable",
        slotsAvailable: scan.rooms.length > 0
      },
      result: {
        status: "availability_found",
        confidence: iframeInfo.hasIframe ? "medium" : "high"
      }
    };
  }

  // 5️⃣ EXECUTE MODE — BLOCK IF READ-ONLY
  if (iframeInfo.mode === "cross-origin-readable") {
    steps.push({
      type: "stop",
      detail: "Външната система позволява преглед, но не и автоматично изпълнение"
    });

    return {
      steps,
      facts: {
        iframeDetected: true,
        readOnly: true,
        provider: iframeInfo.providerHint
      },
      result: {
        status: "no_availability",
        confidence: "high"
      }
    };
  }

  // 6️⃣ VALIDATE INPUT
  if (!params.name || !params.email) {
    steps.push({
      type: "stop",
      detail: "Липсва име или имейл – не мога да завърша резервацията"
    });

    return {
      steps,
      facts: {},
      result: {
        status: "no_availability",
        confidence: "high"
      }
    };
  }

  steps.push({
    type: "fill",
    detail: "Попълвам данните за резервация"
  });

  // 7️⃣ SUBMIT (MEMORY FIRST)
  const memorySubmit = await memoryAwareSubmit(page, params.url);

  if (memorySubmit.submitted) {
    steps.push({
      type: "submit",
      detail: "Използвах запомнен submit бутон за този сайт"
    });
  } else {
    const submitResult = await hotelOptimizedSubmit(page, {
      name: params.name,
      email: params.email
    });

    if (!submitResult.submitted) {
      steps.push({
        type: "stop",
        detail: `Не открих безопасен submit бутон (${submitResult.reason})`
      });

      return {
        steps,
        facts: { submitted: false },
        result: {
          status: "no_availability",
          confidence: "high"
        }
      };
    }

    steps.push({
      type: "submit",
      detail: "Изпратих резервационната форма"
    });
  }

  // 8️⃣ OBSERVE + CONFIRMATION
  await observe(page);

  const confirmation = await detectConfirmation(page);
  steps.push({
    type: "observe",
    detail: confirmation.confirmed
      ? "Открих потвърждение за успешна резервация"
      : "Не открих ясен сигнал за потвърждение"
  });

  // 9️⃣ SAVE MEMORY + EMAIL
  if (confirmation.confirmed) {
    saveSiteMemory(params.url, {
      confirmationSignal: confirmation.signal
    });

    await sendBookingEmails({
      siteUrl: params.url,
      customer: {
        name: params.name,
        email: params.email
      },
      execution: {
        mode: executionMode
      }
    });
  }

  return {
    steps,
    facts: {
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
