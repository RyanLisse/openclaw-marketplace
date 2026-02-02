'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Connection,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

interface IntentNodeData extends Record<string, unknown> {
  label: string;
  intentType: string;
  agentId: string;
  skills: string[];
  online: boolean;
}

interface MatchEdgeData extends Record<string, unknown> {
  matchScore: number;
  status: string;
  animated: boolean;
}

function useCanvasData() {
  const intents = useQuery(api.intents.list, { status: 'open' });
  const presence = useQuery(api.presence.list);

  return useMemo(() => {
    const safeIntents = intents ?? [];
    const safePresence = presence ?? [];
    const agentIds = new Set(safePresence.map((p) => p.agentId));
    const nodes: Node<IntentNodeData>[] = [];
    const edges: Edge<MatchEdgeData>[] = [];

    safeIntents.forEach((intent, i) => {
      const isOffer = intent.type === 'offer';
      const nodeId = String(intent._id);
      const x = 100 + (i % 4) * 220;
      const y = 100 + Math.floor(i / 4) * 200;

      nodes.push({
        id: nodeId,
        type: 'default',
        position: { x, y },
        data: {
          label: `${isOffer ? '🤖' : '💼'} ${intent.title}`,
          intentType: intent.type,
          agentId: intent.agentId,
          skills: intent.skills,
          online: agentIds.has(intent.agentId),
        },
        style: {
          background: isOffer ? '#10b981' : '#3b82f6',
          color: 'white',
          border: `2px solid ${isOffer ? '#059669' : '#2563eb'}`,
        },
      });
    });

    const needIntents = safeIntents.filter((i) => i.type === 'need');
    const offerIntents = safeIntents.filter((i) => i.type === 'offer');

    needIntents.forEach((need) => {
      offerIntents.forEach((offer) => {
        const shared = need.skills.filter((s) =>
          offer.skills.some((os) => os.toLowerCase() === s.toLowerCase())
        );
        const score = shared.length
          ? Math.min(100, (shared.length / need.skills.length) * 100)
          : 0;
        if (score >= 50) {
          edges.push({
            id: `match-${need._id}-${offer._id}`,
            source: String(need._id),
            target: String(offer._id),
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 },
            data: {
              matchScore: Math.round(score),
              status: 'proposed',
              animated: true,
            },
            label: `🔥 ${Math.round(score)}%`,
          });
        }
      });
    });

    return {
      nodes,
      edges,
      connectedAgents: safePresence.length,
      intentCount: safeIntents.length,
    };
  }, [intents, presence]);
}

export function AgentCanvas() {
  const { nodes: dataNodes, edges: dataEdges, connectedAgents, intentCount } =
    useCanvasData();

  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<IntentNodeData>>(dataNodes);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<Edge<MatchEdgeData>>(dataEdges);

  useEffect(() => {
    setNodes(dataNodes);
    setEdges(dataEdges);
  }, [dataNodes, dataEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const displayNodes = nodes.length > 0 ? nodes : dataNodes;
  const displayEdges = edges.length > 0 ? edges : dataEdges;

  return (
    <div className="h-screen w-full bg-[#1a1a1a]">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#404040" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as IntentNodeData;
            return d.intentType === 'offer' ? '#10b981' : '#3b82f6';
          }}
          maskColor="rgba(0, 0, 0, 0.5)"
        />

        <Panel
          position="top-left"
          className="bg-gray-900/90 p-4 rounded-lg border border-gray-700"
        >
          <div className="text-white space-y-2">
            <h2 className="text-lg font-bold">🌐 Agent Activity</h2>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-green-400">●</span> Online: {connectedAgents}
              </div>
              <div>Open Intents: {intentCount}</div>
              <div className="text-xs text-gray-400 mt-2">
                Real-time Convex subscriptions
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          position="top-right"
          className="bg-gray-900/90 p-4 rounded-lg border border-gray-700"
        >
          <div className="text-white space-y-2">
            <h3 className="font-semibold">Legend</h3>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-green-400">●</span> Offer Intent
              </div>
              <div>
                <span className="text-blue-400">●</span> Need Intent
              </div>
              <div>
                <span className="text-purple-400">~</span> Match (skill overlap)
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
