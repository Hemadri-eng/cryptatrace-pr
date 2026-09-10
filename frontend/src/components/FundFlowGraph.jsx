import { useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background, Controls, MarkerType, Handle, Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { X } from "lucide-react";
import { truncateAddr, formatDate } from "../utils/format";

const NODE_STYLES = {
  victim: { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d" },
  intermediate: { bg: "#e0f2fe", border: "#0ea5e9", text: "#0c4a6e" },
  unknown: { bg: "#f1f5f9", border: "#94a3b8", text: "#334155" },
  exchange: { bg: "#dcfce7", border: "#22c55e", text: "#14532d" },
  unknown_vasp: { bg: "#fef3c7", border: "#f59e0b", text: "#78350f" },
  mixer: { bg: "#fecaca", border: "#dc2626", text: "#7f1d1d" },
  suspicious_service: { bg: "#fecaca", border: "#dc2626", text: "#7f1d1d" },
};

function CustomNode({ data }) {
  const style = NODE_STYLES[data.type] || NODE_STYLES.unknown;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs font-medium shadow-sm border-2 min-w-[130px] text-center cursor-pointer"
      style={{ background: style.bg, borderColor: style.border, color: style.text }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="font-semibold">{data.label}</div>
      <div className="text-[10px] opacity-70 mt-0.5 font-mono">{truncateAddr(data.id, 5)}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function layoutGraph(nodes, edges) {
  // BFS layering from victim node(s) for a left-to-right investigation graph
  const idToNode = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const outgoing = {};
  edges.forEach((e) => {
    outgoing[e.source] = outgoing[e.source] || [];
    outgoing[e.source].push(e.target);
  });

  const depth = {};
  const victims = nodes.filter((n) => n.type === "victim").map((n) => n.id);
  const queue = victims.length ? [...victims] : [nodes[0]?.id];
  queue.forEach((id) => (depth[id] = 0));

  while (queue.length) {
    const cur = queue.shift();
    const d = depth[cur];
    (outgoing[cur] || []).forEach((next) => {
      if (depth[next] === undefined || depth[next] < d + 1) {
        depth[next] = d + 1;
        queue.push(next);
      }
    });
  }
  nodes.forEach((n) => { if (depth[n.id] === undefined) depth[n.id] = 0; });

  const byDepth = {};
  nodes.forEach((n) => {
    const d = depth[n.id];
    byDepth[d] = byDepth[d] || [];
    byDepth[d].push(n);
  });

  const positioned = [];
  Object.entries(byDepth).forEach(([d, group]) => {
    group.forEach((n, i) => {
      positioned.push({
        id: n.id,
        type: "custom",
        position: { x: Number(d) * 230, y: i * 110 },
        data: { ...n },
      });
    });
  });
  return positioned;
}

export default function FundFlowGraph({ graphData }) {
  const [selected, setSelected] = useState(null); // { kind: 'node'|'edge', data }

  const rfNodes = useMemo(() => layoutGraph(graphData.nodes, graphData.edges), [graphData]);
  const rfEdges = useMemo(
    () =>
      graphData.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: `${e.amount} ${e.token}`,
        labelStyle: { fontSize: 10, fill: "#334155" },
        labelBgStyle: { fill: "#f8fafc" },
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8", width: 16, height: 16 },
        data: e,
      })),
    [graphData]
  );

  const onNodeClick = useCallback((_, node) => setSelected({ kind: "node", data: node.data }), []);
  const onEdgeClick = useCallback((_, edge) => setSelected({ kind: "edge", data: edge.data }), []);

  return (
    <div className="relative bg-white rounded-lg border border-slate-200 h-[480px] overflow-hidden">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {selected && (
        <div className="absolute top-3 right-3 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-xs space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-ink-900 text-sm">
              {selected.kind === "node" ? "Wallet Details" : "Transaction Details"}
            </h3>
            <button onClick={() => setSelected(null)} className="text-ink-600/50 hover:text-ink-900">
              <X size={15} />
            </button>
          </div>
          {selected.kind === "node" ? (
            <>
              <Row label="Address" value={selected.data.id} mono />
              <Row label="Entity type" value={selected.data.type?.replace("_", " ")} />
              <Row label="Risk" value={selected.data.risk} />
              <Row label="Balance" value={selected.data.balance != null ? `${selected.data.balance} ETH` : "—"} />
              <Row label="Tx count" value={selected.data.tx_count ?? "—"} />
              <Row label="First seen" value={formatDate(selected.data.first_seen)} />
              <Row label="Last seen" value={formatDate(selected.data.last_seen)} />
            </>
          ) : (
            <>
              <Row label="Tx hash" value={selected.data.hash} mono />
              <Row label="Amount" value={`${selected.data.amount} ${selected.data.token}`} />
              <Row label="Network" value={selected.data.network} />
              <Row label="Timestamp" value={formatDate(selected.data.timestamp)} />
              <Row label="Source" value={selected.data.source} mono />
              <Row label="Destination" value={selected.data.target} mono />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div>
      <div className="text-ink-600/50">{label}</div>
      <div className={`text-ink-900 break-all ${mono ? "font-mono text-[11px]" : ""}`}>{value}</div>
    </div>
  );
}
