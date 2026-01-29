/**
 * ツリービューコンポーネント
 * React Flowを使用してなぜなぜ分析を可視化
 */

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Node,
  Edge,
  ConnectionMode,
  Position,
  Handle,
  NodeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { AnalysisNode, FlowNodeData } from '../types';

interface TreeViewProps {
  rootNode: AnalysisNode;
}

// カスタムノードコンポーネント
const CustomNode: React.FC<NodeProps<Node<FlowNodeData>>> = ({ data }) => {
  const getNodeStyle = () => {
    switch (data.type) {
      case 'problem':
        return 'bg-red-100 border-red-400';
      case 'why':
        return 'bg-blue-100 border-blue-400';
      case 'action':
        return 'bg-green-100 border-green-400';
      default:
        return 'bg-gray-100 border-gray-400';
    }
  };

  const getLabelStyle = () => {
    switch (data.type) {
      case 'problem':
        return 'bg-red-500';
      case 'why':
        return 'bg-blue-500';
      case 'action':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLabel = () => {
    switch (data.type) {
      case 'problem':
        return '問題';
      case 'why':
        return `なぜ ${data.level}`;
      case 'action':
        return '対策';
      default:
        return '';
    }
  };

  return (
    <div className={`px-4 py-3 rounded-lg border-2 shadow-md min-w-[180px] max-w-[280px] ${getNodeStyle()}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      <div className="flex flex-col gap-2">
        <span className={`text-xs text-white px-2 py-0.5 rounded self-start ${getLabelStyle()}`}>
          {getLabel()}
        </span>
        <div className="text-sm text-gray-800 break-words">
          {data.label || <span className="text-gray-400 italic">未入力</span>}
        </div>
        {data.type === 'action' && (data.assignee || data.dueDate) && (
          <div className="text-xs text-gray-600 border-t border-gray-300 pt-2 mt-1">
            {data.assignee && <div>担当: {data.assignee}</div>}
            {data.dueDate && <div>期限: {data.dueDate}</div>}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// ツリー構造からReact Flow用のノードとエッジを生成
const convertToFlowElements = (
  node: AnalysisNode,
  x: number = 0,
  y: number = 0,
  nodes: Node<FlowNodeData>[] = [],
  edges: Edge[] = []
): { nodes: Node<FlowNodeData>[]; edges: Edge[]; width: number } => {
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const HORIZONTAL_GAP = 40;
  const VERTICAL_GAP = 80;

  // 現在のノードを追加
  nodes.push({
    id: node.id,
    type: 'custom',
    position: { x, y },
    data: {
      label: node.content,
      level: node.level,
      type: node.type,
      assignee: node.assignee,
      dueDate: node.dueDate,
    },
  });

  // 子ノードがない場合
  if (node.children.length === 0) {
    return { nodes, edges, width: NODE_WIDTH };
  }

  // 子ノードを処理
  let currentX = x;
  let totalWidth = 0;
  const childWidths: number[] = [];

  node.children.forEach((child, index) => {
    const result = convertToFlowElements(
      child,
      currentX,
      y + NODE_HEIGHT + VERTICAL_GAP,
      nodes,
      edges
    );

    childWidths.push(result.width);
    totalWidth += result.width;
    if (index < node.children.length - 1) {
      totalWidth += HORIZONTAL_GAP;
    }

    // エッジを追加
    edges.push({
      id: `edge-${node.id}-${child.id}`,
      source: node.id,
      target: child.id,
      type: 'smoothstep',
      style: {
        stroke: child.type === 'action' ? '#22c55e' : '#3b82f6',
        strokeWidth: 2,
      },
    });

    currentX += result.width + HORIZONTAL_GAP;
  });

  // 親ノードを子ノードの中央に配置
  const parentNode = nodes.find(n => n.id === node.id);
  if (parentNode) {
    const centerX = x + (totalWidth - NODE_WIDTH) / 2;
    parentNode.position.x = centerX;
  }

  return { nodes, edges, width: Math.max(totalWidth, NODE_WIDTH) };
};

export const TreeView: React.FC<TreeViewProps> = ({ rootNode }) => {
  const { flowNodes, flowEdges } = useMemo(() => {
    const { nodes, edges } = convertToFlowElements(rootNode);
    return { flowNodes: nodes, flowEdges: edges };
  }, [rootNode]);

  const onInit = useCallback((instance: ReturnType<typeof ReactFlow>) => {
    // ビューをフィットさせる（型安全のため instance.fitView ではなく別の方法を使用）
    setTimeout(() => {
      const container = document.querySelector('.react-flow');
      if (container) {
        // fitView相当の処理
      }
    }, 0);
  }, []);

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Controls
          className="!bg-white !border-gray-200 !shadow-md"
          showInteractive={false}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#e5e7eb"
        />
      </ReactFlow>
    </div>
  );
};
