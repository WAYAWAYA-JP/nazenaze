/**
 * Google Apps Script APIとの通信ユーティリティ
 */

import type { FlatNode, AnalysisListItem, AnalysisNode } from '../types';

// GAS環境かどうかの判定
export const isGasEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !!window.google?.script;
};

// ツリー構造をフラット化
export const flattenTree = (node: AnalysisNode, result: FlatNode[] = []): FlatNode[] => {
  result.push({
    id: node.id,
    parentId: node.parentId || '',
    content: node.content,
    level: node.level,
    type: node.type,
    assignee: node.assignee,
    dueDate: node.dueDate,
  });

  node.children.forEach(child => {
    flattenTree(child, result);
  });

  return result;
};

// フラットデータをツリー構造に変換
export const buildTree = (nodes: FlatNode[]): AnalysisNode | null => {
  if (nodes.length === 0) return null;

  const nodeMap = new Map<string, AnalysisNode>();
  let rootNode: AnalysisNode | null = null;

  // まず全ノードをマップに登録
  nodes.forEach(node => {
    nodeMap.set(node.id, {
      id: node.id,
      parentId: node.parentId || null,
      content: node.content,
      level: node.level,
      type: node.type as AnalysisNode['type'],
      children: [],
      assignee: node.assignee,
      dueDate: node.dueDate,
    });
  });

  // 親子関係を構築
  nodeMap.forEach(node => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else if (node.level === 0) {
      rootNode = node;
    }
  });

  return rootNode;
};

// 分析を保存
export const saveAnalysis = (
  analysisId: string | null,
  nodes: FlatNode[]
): Promise<{ success: boolean; analysisId?: string; error?: string }> => {
  return new Promise((resolve) => {
    if (isGasEnvironment()) {
      window.google!.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error: Error) => {
          resolve({ success: false, error: error.message });
        })
        .saveAnalysis({ analysisId, nodes });
    } else {
      // ローカル開発用モック
      const id = analysisId || `local-${Date.now()}`;
      localStorage.setItem(`analysis-${id}`, JSON.stringify(nodes));
      resolve({ success: true, analysisId: id });
    }
  });
};

// 分析を読み込み
export const loadAnalysis = (
  analysisId: string
): Promise<{ success: boolean; nodes?: FlatNode[]; error?: string }> => {
  return new Promise((resolve) => {
    if (isGasEnvironment()) {
      window.google!.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error: Error) => {
          resolve({ success: false, error: error.message });
        })
        .loadAnalysis(analysisId);
    } else {
      // ローカル開発用モック
      const data = localStorage.getItem(`analysis-${analysisId}`);
      if (data) {
        resolve({ success: true, nodes: JSON.parse(data) });
      } else {
        resolve({ success: false, error: '分析が見つかりません' });
      }
    }
  });
};

// 分析一覧を取得
export const getAnalysisList = (): Promise<{
  success: boolean;
  analyses?: AnalysisListItem[];
  error?: string;
}> => {
  return new Promise((resolve) => {
    if (isGasEnvironment()) {
      window.google!.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error: Error) => {
          resolve({ success: false, error: error.message });
        })
        .getAnalysisList();
    } else {
      // ローカル開発用モック
      const analyses: AnalysisListItem[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('analysis-')) {
          const id = key.replace('analysis-', '');
          const data = JSON.parse(localStorage.getItem(key)!);
          const rootNode = data.find((n: FlatNode) => n.level === 0);
          analyses.push({
            id,
            title: rootNode?.content || '無題',
            updatedAt: new Date().toISOString(),
          });
        }
      }
      resolve({ success: true, analyses });
    }
  });
};

// 分析を削除
export const deleteAnalysis = (
  analysisId: string
): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (isGasEnvironment()) {
      window.google!.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error: Error) => {
          resolve({ success: false, error: error.message });
        })
        .deleteAnalysis(analysisId);
    } else {
      localStorage.removeItem(`analysis-${analysisId}`);
      resolve({ success: true });
    }
  });
};

// PDFを生成
export const createPdf = (
  analysisId: string,
  nodes: FlatNode[],
  title: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  return new Promise((resolve) => {
    if (isGasEnvironment()) {
      window.google!.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error: Error) => {
          resolve({ success: false, error: error.message });
        })
        .createPdf({ analysisId, nodes, title });
    } else {
      // ローカルでは非対応
      resolve({ success: false, error: 'PDF出力はGAS環境でのみ利用可能です' });
    }
  });
};

// 共有URLを取得
export const getShareUrl = (
  analysisId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  return new Promise((resolve) => {
    if (isGasEnvironment()) {
      window.google!.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error: Error) => {
          resolve({ success: false, error: error.message });
        })
        .getShareUrl(analysisId);
    } else {
      resolve({
        success: true,
        url: `${window.location.origin}?id=${analysisId}`,
      });
    }
  });
};

// AIによる「なぜ」の候補を取得
export const suggestNextWhy = (
  nodes: FlatNode[],
  targetNodeContent: string
): Promise<{ success: boolean; suggestions?: string[]; rawResponse?: string; error?: string }> => {
  return new Promise((resolve) => {
    if (isGasEnvironment()) {
      window.google!.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error: Error) => {
          resolve({ success: false, error: error.message });
        })
        .suggestNextWhy({ nodes, targetNodeContent });
    } else {
      // ローカル開発用モック
      resolve({
        success: true,
        suggestions: [
          'モック候補1: 手順書が更新されていなかった',
          'モック候補2: トレーニングが不十分だった',
          'モック候補3: チェック体制が機能していなかった',
        ],
        rawResponse: 'これはローカル開発用のモックレスポンスです。',
      });
    }
  });
};

// AIによる対策提案を取得
export const suggestAction = (
  nodes: FlatNode[],
  targetNodeContent: string
): Promise<{ success: boolean; suggestions?: string[]; rawResponse?: string; error?: string }> => {
  return new Promise((resolve) => {
    if (isGasEnvironment()) {
      window.google!.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler((error: Error) => {
          resolve({ success: false, error: error.message });
        })
        .suggestAction({ nodes, targetNodeContent });
    } else {
      // ローカル開発用モック
      resolve({
        success: true,
        suggestions: [
          'モック対策1: 手順書の定期レビュー体制を構築する',
          'モック対策2: 新人教育プログラムを見直す',
          'モック対策3: ダブルチェック体制を導入する',
        ],
        rawResponse: 'これはローカル開発用のモックレスポンスです。',
      });
    }
  });
};
