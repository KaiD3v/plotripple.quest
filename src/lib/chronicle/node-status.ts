import {
  chronicleNodeStatuses,
  type ChronicleNodeStatus,
} from "@/types/chronicle";

const STATUS_SET = new Set<string>(chronicleNodeStatuses);

/** Normalize persisted or legacy status values at storage boundaries. */
export function normalizeChronicleNodeStatus(
  value: unknown,
): ChronicleNodeStatus | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (value === "occurred") {
    return "resolved";
  }
  if (typeof value === "string" && STATUS_SET.has(value)) {
    return value as ChronicleNodeStatus;
  }
  return "pending";
}

export function resolveChronicleNodeStatus(
  value: ChronicleNodeStatus | undefined,
): ChronicleNodeStatus {
  return value ?? "pending";
}

export function isChronicleNodeStatus(value: unknown): value is ChronicleNodeStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}
