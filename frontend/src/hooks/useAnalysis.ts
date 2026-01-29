/**
 * なぜなぜ分析の状態管理フック
 */

import { useState, useCallback, useEffect } from 'react';
import type { AnalysisNode, FlatNode } from '../types';
import { flattenTree, buildTree, saveAnalysis, loadAnalysis } from '../utils/gasApi';

// 新しいノードを生成
const createNode = (
  parentId: string | null,
  level: number,
  type: AnalysisNode['type'] = 'why'
): AnalysisNode => ({
  id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  parentId,
  content: '',
  level,
  type,
  children: [],
});

// 初期状態を生成
const createInitialState = (): AnalysisNode => ({
  id: `node-${Date.now()}`,
  parentId: null,
  content: '',
  level: 0,
  type: 'problem',
  children: [],
});

export const useAnalysis = () => {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [rootNode, setRootNode] = useState<AnalysisNode>(createInitialState);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // URLパラメータから分析IDを取得
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      handleLoad(id);
    }
  }, []);

  // ノードを更新する再帰関数
  const updateNodeInTree = useCallback(
    (
      node: AnalysisNode,
      targetId: string,
      updater: (node: AnalysisNode) => AnalysisNode
    ): AnalysisNode => {
      if (node.id === targetId) {
        return updater(node);
      }
      return {
        ...node,
        children: node.children.map(child => updateNodeInTree(child, targetId, updater)),
      };
    },
    []
  );

  // ノードを削除する再帰関数
  const removeNodeFromTree = useCallback(
    (node: AnalysisNode, targetId: string): AnalysisNode => {
      return {
        ...node,
        children: node.children
          .filter(child => child.id !== targetId)
          .map(child => removeNodeFromTree(child, targetId)),
      };
    },
    []
  );

  // ノードのコンテンツを更新
  const updateNodeContent = useCallback(
    (nodeId: string, content: string) => {
      setRootNode(prev => updateNodeInTree(prev, nodeId, node => ({ ...node, content })));
    },
    [updateNodeInTree]
  );

  // ノードのアクション情報を更新
  const updateNodeAction = useCallback(
    (nodeId: string, assignee: string, dueDate: string) => {
      setRootNode(prev =>
        updateNodeInTree(prev, nodeId, node => ({ ...node, assignee, dueDate }))
      );
    },
    [updateNodeInTree]
  );

  // 子ノード（なぜ）を追加
  const addChildNode = useCallback(
    (parentId: string, parentLevel: number) => {
      const newNode = createNode(parentId, parentLevel + 1, 'why');
      setRootNode(prev =>
        updateNodeInTree(prev, parentId, node => ({
          ...node,
          children: [...node.children, newNode],
        }))
      );
      return newNode.id;
    },
    [updateNodeInTree]
  );

  // アクションノードを追加
  const addActionNode = useCallback(
    (parentId: string, parentLevel: number) => {
      const newNode = createNode(parentId, parentLevel + 1, 'action');
      setRootNode(prev =>
        updateNodeInTree(prev, parentId, node => ({
          ...node,
          children: [...node.children, newNode],
        }))
      );
      return newNode.id;
    },
    [updateNodeInTree]
  );

  // 子ノード（なぜ）を内容付きで追加（AI提案用）
  const addChildNodeWithContent = useCallback(
    (parentId: string, parentLevel: number, content: string) => {
      const newNode = createNode(parentId, parentLevel + 1, 'why');
      newNode.content = content;
      setRootNode(prev =>
        updateNodeInTree(prev, parentId, node => ({
          ...node,
          children: [...node.children, newNode],
        }))
      );
      return newNode.id;
    },
    [updateNodeInTree]
  );

  // アクションノードを内容付きで追加（AI提案用）
  const addActionNodeWithContent = useCallback(
    (parentId: string, parentLevel: number, content: string) => {
      const newNode = createNode(parentId, parentLevel + 1, 'action');
      newNode.content = content;
      setRootNode(prev =>
        updateNodeInTree(prev, parentId, node => ({
          ...node,
          children: [...node.children, newNode],
        }))
      );
      return newNode.id;
    },
    [updateNodeInTree]
  );

  // ノードを削除
  const removeNode = useCallback(
    (nodeId: string) => {
      setRootNode(prev => removeNodeFromTree(prev, nodeId));
    },
    [removeNodeFromTree]
  );

  // 分析を保存
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const nodes = flattenTree(rootNode);
      const result = await saveAnalysis(analysisId, nodes);

      if (result.success) {
        if (result.analysisId) {
          setAnalysisId(result.analysisId);
        }
        setMessage({ type: 'success', text: '保存しました' });
      } else {
        setMessage({ type: 'error', text: result.error || '保存に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存中にエラーが発生しました' });
    }

    setIsSaving(false);
  }, [analysisId, rootNode]);

  // 分析を読み込み
  const handleLoad = useCallback(async (id: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await loadAnalysis(id);

      if (result.success && result.nodes) {
        const tree = buildTree(result.nodes as FlatNode[]);
        if (tree) {
          setRootNode(tree);
          setAnalysisId(id);
          setMessage({ type: 'success', text: '読み込みました' });
        }
      } else {
        setMessage({ type: 'error', text: result.error || '読み込みに失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '読み込み中にエラーが発生しました' });
    }

    setIsLoading(false);
  }, []);

  // 新規分析を開始
  const handleNew = useCallback(() => {
    setAnalysisId(null);
    setRootNode(createInitialState());
    setMessage(null);
    // URLからパラメータを削除
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  // ノードをタイプ別にカウント
  const getNodeCounts = useCallback(() => {
    const countNodes = (node: AnalysisNode): { why: number; action: number } => {
      const childCounts = node.children.reduce(
        (acc, child) => {
          const counts = countNodes(child);
          return { why: acc.why + counts.why, action: acc.action + counts.action };
        },
        { why: 0, action: 0 }
      );

      if (node.type === 'why') {
        return { ...childCounts, why: childCounts.why + 1 };
      } else if (node.type === 'action') {
        return { ...childCounts, action: childCounts.action + 1 };
      }
      return childCounts;
    };

    return countNodes(rootNode);
  }, [rootNode]);

  return {
    analysisId,
    rootNode,
    isSaving,
    isLoading,
    message,
    updateNodeContent,
    updateNodeAction,
    addChildNode,
    addActionNode,
    addChildNodeWithContent,
    addActionNodeWithContent,
    removeNode,
    handleSave,
    handleLoad,
    handleNew,
    getNodeCounts,
    setMessage,
  };
};
