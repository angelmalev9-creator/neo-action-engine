import { bookAction } from "./book.js";

export async function executeAction(action: any) {
  switch (action.type) {
    case "booking":
      return bookAction(action.payload);

    // case "add_to_cart":
    // case "availability":

    default:
      throw new Error("Unsupported action");
  }
}
