import type { Locale } from "@/i18n/config";
import type { Category, ConsequenceTimeframe } from "@/types/generator";
import {
  chronicleNodeStatuses,
  type ChronicleNodeStatus,
} from "@/types/chronicle";

export const narrativeSchemaVersions = [1] as const;
/** Narrative status mirrors ChronicleNodeStatus — single domain contract. */
export const narrativeStatuses = chronicleNodeStatuses;
export const narrativeNodeKinds = [
  "decision",
  "consequence",
  "follow_up",
] as const;

export type NarrativeSchemaVersion = (typeof narrativeSchemaVersions)[number];
export type NarrativeStatus = ChronicleNodeStatus;
export type NarrativeNodeKind = (typeof narrativeNodeKinds)[number];
export type NarrativeTimeframe = ConsequenceTimeframe;

export type DecisionNode = {
  id: string;
  kind: "decision";
  label: string;
  summary?: string;
};

export type ConsequenceNode = {
  id: string;
  kind: "consequence";
  title: string;
  description: string;
  timeframe: NarrativeTimeframe;
  category: Category;
  trigger: string;
  affectedParties: string[];
  status: NarrativeStatus;
};

export type FollowUpNode = {
  id: string;
  kind: "follow_up";
  title: string;
  note: string;
  status: NarrativeStatus;
  timeframe?: NarrativeTimeframe;
};

export type NarrativeNode = DecisionNode | ConsequenceNode | FollowUpNode;

export type NarrativeEdge = {
  id: string;
  source: string;
  target: string;
};

export type NarrativeGraph = {
  id: string;
  version: NarrativeSchemaVersion;
  locale: Locale;
  title: string;
  createdAt: string;
  updatedAt: string;
  rootNodeId: string;
  nodes: NarrativeNode[];
  edges: NarrativeEdge[];
};
