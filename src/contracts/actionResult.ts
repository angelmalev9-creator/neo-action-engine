export type Step = {
  type:
    | "navigate"
    | "scan"
    | "observe"
    | "click"
    | "fill"
    | "submit"
    | "wait"
    | "stop";
  detail: string;
};

export type ResultStatus =
  | "availability_found"
  | "no_availability"
  | "blocked"
  | "uncertain"
  | "ready_to_submit"
  | "action_completed";

export type Confidence =
  | "low"
  | "medium"
  | "high"
  | "very_high";

export type Facts = {
  // availability / booking
  slotsAvailable?: boolean;
  slotsFound?: number;

  // booking specifics
  paymentRequired?: boolean;
  confirmed?: boolean;
  confirmationSignal?: string | null;

  // extensible
  [key: string]: any;
};

export type ActionResult = {
  steps: Step[];
  facts: Facts;
  result: {
    status: ResultStatus;
    confidence: Confidence;
  };
};
