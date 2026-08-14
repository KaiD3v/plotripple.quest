import type { Locale } from "@/i18n/config";
import type { Intensity, Setting, Tone } from "@/types/generator";

export const chronicleSchemaVersions = [1] as const;
export const chronicleNodeTypes = [
  "origin",
  "decision",
  "consequence",
  "follow_up",
] as const;
export const chronicleNodeStatuses = [
  "pending",
  "active",
  "resolved",
  "dismissed",
] as const;
export const chronicleErrorCodes = [
  "CHRONICLE_EMPTY",
  "CHRONICLE_INVALID",
  "CHRONICLE_UNAVAILABLE",
  "CHRONICLE_NODE_MISSING",
  "CHRONICLE_CANNOT_EXPAND",
  "CHRONICLE_ALREADY_EXPANDED",
  "CHRONICLE_MAX_DEPTH",
  "CHRONICLE_NODE_LIMIT",
  "CHRONICLE_DUPLICATE",
  "CHRONICLE_LIBRARY_UNAVAILABLE",
  "CHRONICLE_LIBRARY_FULL",
  "CHRONICLE_NOT_FOUND",
  "CHRONICLE_STATUS_UNEDITABLE",
] as const;

export type ChronicleSchemaVersion = (typeof chronicleSchemaVersions)[number];
export type ChronicleNodeType = (typeof chronicleNodeTypes)[number];
export type ChronicleNodeStatus = (typeof chronicleNodeStatuses)[number];
export type ChronicleErrorCode = (typeof chronicleErrorCodes)[number];

export type ChronicleNarrativeContext = {
  tone?: Tone;
  intensity?: Intensity;
  setting?: Setting;
  locale?: Locale;
};

export type ChronicleNode = {
  id: string;
  type: ChronicleNodeType;
  title: string;
  description: string;
  parentId: string | null;
  depth: number;
  timeframe?: "immediate" | "next_session" | "long_term";
  category?:
    | "social"
    | "political"
    | "economic"
    | "personal"
    | "supernatural"
    | "environmental";
  trigger?: string;
  affectedParties?: string[];
  status?: ChronicleNodeStatus;
};

export type ChronicleGraph = {
  version: 1;
  id?: string;
  title: string;
  nodes: ChronicleNode[];
  context?: ChronicleNarrativeContext;
};

export type ChronicleMapResult =
  | { ok: true; graph: ChronicleGraph }
  | { ok: false; code: ChronicleErrorCode };
