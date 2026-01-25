import { Page } from "playwright";
import { withBrowser } from "../browser/session";
import { checkAvailability } from "./availability";
import { book } from "./book";

export async function executeAction(
  action: string,
  params: any
) {
  return withBrowser(async (page: Page) => {
    switch (action) {
      case "availability":
        return checkAvailability(page, params);
      case "book":
        return book(page, params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  });
}
