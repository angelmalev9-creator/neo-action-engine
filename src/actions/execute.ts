import { bookAction } from "./book.js";
import { checkAvailability } from "./availability.js";

export async function executeAction(action: any) {
  switch (action.type) {
    case "availability":
      return checkAvailability(action.payload);

    case "booking":
      return bookAction(action.payload);

    default:
      throw new Error("Unsupported action type");
  }
}
