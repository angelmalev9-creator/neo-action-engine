import { Page } from "playwright";
import { withBrowser } from "../browser/session.js";

import { checkAvailability } from "./availability.js";
import { autoAvailability } from "./autoAvailability.js";
import { exploreBooking } from "./exploreBooking.js";
import { exploreBookingSystematic } from "./exploreBookingSystematic.js";
import { exploreBookingInteractive } from "./exploreBookingInteractive.js";
import { book } from "./book.js";

export async function executeAction(
  action: string,
  params: any
) {
  return withBrowser(async (page: Page) => {
    switch (action) {
      case "availability": {
        // ако има selectors → manual mode
        if (
          params?.calendarSelector ||
          params?.slotSelector
        ) {
          return checkAvailability(page, params);
        }

        // иначе → AUTO selector discovery
        return autoAvailability(page, params);
      }

      case "explore_booking":
        return exploreBooking(page, params);

      case "explore_booking_systematic":
        return exploreBookingSystematic(page, params);

      case "explore_booking_interactive":
        return exploreBookingInteractive(page, params);

      case "book":
        return book(page, params);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  });
}
