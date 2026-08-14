import type { Dictionary } from "@/i18n/get-dictionary";
import { childrenByParent, nodeTitle } from "@/lib/canvas/graph-queries";
import { nodeKindLabel, type ChronicleSelectHandler } from "@/lib/canvas/selection";
import type { NarrativeGraph, NarrativeNode } from "@/types/narrative-graph";

export function ChronicleOutline({
  graph,
  dictionary,
  selectedId,
  onSelect,
}: {
  graph: NarrativeGraph;
  dictionary: Dictionary;
  selectedId: string | null;
  onSelect: ChronicleSelectHandler;
}) {
  const children = childrenByParent(graph);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const root = nodeById.get(graph.rootNodeId);
  if (!root) {
    return null;
  }

  return (
    <details className="chronicle-outline mt-4 border border-forest/50 bg-elevated/40 px-3 py-2">
      <summary className="min-h-11 font-sans text-sm text-lichen">
        {dictionary.canvas.outlineSummary}
      </summary>
      <nav className="pb-2 pt-1" aria-label={dictionary.canvas.outlineTitle}>
        <OutlineList
          node={root}
          childrenMap={children}
          nodeById={nodeById}
          dictionary={dictionary}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </nav>
    </details>
  );
}

function OutlineList({
  node,
  childrenMap,
  nodeById,
  dictionary,
  selectedId,
  onSelect,
}: {
  node: NarrativeNode;
  childrenMap: Map<string, string[]>;
  nodeById: Map<string, NarrativeNode>;
  dictionary: Dictionary;
  selectedId: string | null;
  onSelect: ChronicleSelectHandler;
}) {
  const childIds = childrenMap.get(node.id) ?? [];
  const selected = selectedId === node.id;

  return (
    <ul className="mt-2 space-y-1">
      <li>
        <button
          type="button"
          className={`inline-flex min-h-11 w-full items-start break-words text-left text-sm ${
            selected ? "text-gold" : "text-bone hover:text-gold"
          }`}
          aria-pressed={selected}
          onClick={(event) => onSelect(node.id, event.currentTarget)}
        >
          {nodeKindLabel(node, dictionary)}: {nodeTitle(node)}
          {node.kind !== "decision" ? (
            <span className="ml-2 text-lichen">
              · {dictionary.canvas.statuses[node.status]}
            </span>
          ) : null}
        </button>
        {childIds.length > 0 ? (
          <div className="ml-3 border-l border-bronze/35 pl-3">
            {childIds.map((childId) => {
              const child = nodeById.get(childId);
              if (!child) {
                return null;
              }
              return (
                <OutlineList
                  key={child.id}
                  node={child}
                  childrenMap={childrenMap}
                  nodeById={nodeById}
                  dictionary={dictionary}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        ) : null}
      </li>
    </ul>
  );
}
