import type { Dictionary } from "@/i18n/get-dictionary";
import type { ChronicleErrorCode } from "@/types/chronicle";
import type { ApiErrorCode } from "@/types/generator";

export type ExploreMessageCode =
  | ChronicleErrorCode
  | ApiErrorCode
  | "network";

export function exploreRippleMessage(
  code: ExploreMessageCode,
  dictionary: Dictionary,
): string {
  switch (code) {
    case "CHRONICLE_ALREADY_EXPANDED":
      return dictionary.canvas.branchExplored;
    case "CHRONICLE_MAX_DEPTH":
      return dictionary.canvas.maxDepthReached;
    case "CHRONICLE_NODE_LIMIT":
      return dictionary.canvas.nodeLimitReached;
    case "CHRONICLE_CANNOT_EXPAND":
    case "CHRONICLE_NODE_MISSING":
      return dictionary.canvas.cannotExpand;
    case "CHRONICLE_DUPLICATE":
    case "INVALID_AI_RESPONSE":
      return dictionary.canvas.expandInvalidResponse;
    case "AI_UNAVAILABLE":
      return dictionary.canvas.expandUnavailable;
    case "RATE_LIMITED":
      return dictionary.errors.RATE_LIMITED;
    case "CHRONICLE_STATUS_UNEDITABLE":
      return dictionary.canvas.statusUneditable;
    case "CHRONICLE_UNAVAILABLE":
      return dictionary.errors.CHRONICLE_UNAVAILABLE;
    case "VALIDATION_ERROR":
      return dictionary.canvas.expandPrepareFailed;
    case "network":
      return dictionary.errors.network;
    default:
      return dictionary.errors.INTERNAL_ERROR;
  }
}
