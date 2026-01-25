export type StepType =
  | "navigate"
  | "scan"
  | "click"
  | "observe"
  | "fill"
  | "submit"
  | "wait"
  | "stop";

export type Step = {
  type: StepType;
  detail: string;
};

export type Facts = {
  buttonsFound?: number;
  bookingButtonsFound?: number;
  calendarsFound?: number;
  slotsFound?: number;
  slotsAvailable?: boolean;
  pageChangedAfterAction?: boolean;
  blockedByLogin?: boolean;
  blockedByCaptcha?: boolean;
};

export type ResultStatus =
  | "availability_found"
  | "no_availability"
  | "action_completed"
  | "blocked"
  | "uncertain";

export type Result = {
  status: ResultStatus;
  confidence: "high" | "medium" | "low";
};

export type ActionResult = {
  steps: Step[];
  facts: Facts;
  result: Result;
};
