import type { Dictionary } from "@/i18n/get-dictionary";
import { ChronicleNodeButton } from "@/components/canvas/chronicle-node";
import { childrenByParent } from "@/lib/canvas/graph-queries";
import type { ChronicleSelectHandler } from "@/lib/canvas/selection";
import type { NarrativeGraph, NarrativeNode } from "@/types/narrative-graph";

export function MobileChronicleTree({
  graph,
  dictionary,
  selectedId,
  relatedNodeIds,
  onSelect,
  registerNode,
}: {
  graph: NarrativeGraph;
  dictionary: Dictionary;
  selectedId: string | null;
  relatedNodeIds: Set<string>;
  onSelect: ChronicleSelectHandler;
  registerNode: (nodeId: string, element: HTMLButtonElement | null) => void;
}) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const children = childrenByParent(graph);
  const root = nodeById.get(graph.rootNodeId);
  if (!root) {
    return null;
  }

  return (
    <div className="chronicle-tree">
      <TreeBranch
        node={root}
        nodeById={nodeById}
        childrenMap={children}
        dictionary={dictionary}
        selectedId={selectedId}
        relatedNodeIds={relatedNodeIds}
        onSelect={onSelect}
        registerNode={registerNode}
        isRoot
      />
    </div>
  );
}

function TreeBranch({
  node,
  nodeById,
  childrenMap,
  dictionary,
  selectedId,
  relatedNodeIds,
  onSelect,
  registerNode,
  isRoot = false,
}: {
  node: NarrativeNode;
  nodeById: Map<string, NarrativeNode>;
  childrenMap: Map<string, string[]>;
  dictionary: Dictionary;
  selectedId: string | null;
  relatedNodeIds: Set<string>;
  onSelect: ChronicleSelectHandler;
  registerNode: (nodeId: string, element: HTMLButtonElement | null) => void;
  isRoot?: boolean;
}) {
  const childIds = childrenMap.get(node.id) ?? [];
  const selected = selectedId === node.id;
  const related = relatedNodeIds.has(node.id);

  return (
    <div className={isRoot ? undefined : "chronicle-branch"}>
      <ChronicleNodeButton
        node={node}
        dictionary={dictionary}
        selected={selected}
        related={Boolean(selectedId) && related}
        dimmed={Boolean(selectedId) && !related}
        variant="tree"
        onSelect={onSelect}
        buttonRef={(element) => registerNode(node.id, element)}
      />
      {childIds.length > 0 ? (
        <div className="grid gap-3">
          {childIds.map((childId) => {
            const child = nodeById.get(childId);
            if (!child) {
              return null;
            }
            return (
              <TreeBranch
                key={child.id}
                node={child}
                nodeById={nodeById}
                childrenMap={childrenMap}
                dictionary={dictionary}
                selectedId={selectedId}
                relatedNodeIds={relatedNodeIds}
                onSelect={onSelect}
                registerNode={registerNode}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
