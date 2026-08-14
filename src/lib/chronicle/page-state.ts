import type { ChronicleGraph } from "@/types/chronicle";

export type ChroniclePageState = "loading" | "empty" | "ready";

export function subscribeHydration() {
  return () => {};
}

export function getClientHydrationSnapshot() {
  return true;
}

export function getServerHydrationSnapshot() {
  return false;
}

export function resolveChroniclePageState(
  hydrated: boolean,
  graph: ChronicleGraph | null,
): ChroniclePageState {
  if (!hydrated) {
    return "loading";
  }
  return graph ? "ready" : "empty";
}
