'use client';

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start: Check Transaction' },
    position: { x: 250, y: 0 },
    style: { background: '#6366f1', color: 'white', padding: 10 }
  },
  {
    id: '2',
    data: { label: 'Condition: Currency = EUR?' },
    position: { x: 250, y: 100 },
    style: { background: '#f59e0b', color: 'white', padding: 10 }
  },
  {
    id: '3',
    data: { label: 'Condition: Amount > 10000?' },
    position: { x: 250, y: 200 },
    style: { background: '#f59e0b', color: 'white', padding: 10 }
  },
  {
    id: '4',
    data: { label: 'Action: Set Payment Term = 30' },
    position: { x: 250, y: 300 },
    style: { background: '#10b981', color: 'white', padding: 10 }
  },
  {
    id: '5',
    type: 'output',
    data: { label: 'End: Apply Rules' },
    position: { x: 250, y: 400 },
    style: { background: '#6366f1', color: 'white', padding: 10 }
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-3', source: '2', target: '3', label: 'Yes', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-4', source: '3', target: '4', label: 'Yes', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e4-5', source: '4', target: '5', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function VisualFlowDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addConditionNode = () => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      data: { label: 'New Condition' },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      style: { background: '#f59e0b', color: 'white', padding: 10 }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addActionNode = () => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      data: { label: 'New Action' },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      style: { background: '#10b981', color: 'white', padding: 10 }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const exportToJSON = () => {
    const ruleFlow = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.data.label,
        position: n.position
      })),
      edges: edges.map(e => ({
        from: e.source,
        to: e.target,
        label: e.label
      }))
    };

    const blob = new Blob([JSON.stringify(ruleFlow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rule-flow.json';
    a.click();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visual Flow Designer</h1>
            <p className="text-sm text-gray-600">Drag-and-drop rule builder</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addConditionNode}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
            >
              + Condition
            </button>
            <button
              onClick={addActionNode}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
            >
              + Action
            </button>
            <button
              onClick={exportToJSON}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 bg-white border-l p-6 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Node Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node ID
                </label>
                <input
                  type="text"
                  value={selectedNode.id}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label as string}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, label: e.target.value } }
                          : node
                      )
                    );
                    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value } });
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={selectedNode.type || 'default'}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, type: e.target.value }
                          : node
                      )
                    );
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="default">Default</option>
                  <option value="input">Input</option>
                  <option value="output">Output</option>
                </select>
              </div>
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
                    setSelectedNode(null);
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete Node
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t p-3">
        <div className="max-w-7xl mx-auto flex justify-between text-sm text-gray-600">
          <div>Nodes: {nodes.length} | Edges: {edges.length}</div>
          <div>Click nodes to edit properties | Drag to connect</div>
        </div>
      </div>
    </div>
  );
}
