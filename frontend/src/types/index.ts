/**
 * なぜなぜ分析ツールの型定義
 */

// ノードのタイプ
export type NodeType = 'problem' | 'why' | 'action';

// 分析ノード
export interface AnalysisNode {
  id: string;
  parentId: string | null;
  content: string;
  level: number;
  type: NodeType;
  children: AnalysisNode[];
  // アクション用
  assignee?: string;
  dueDate?: string;
}

// スプレッドシート用のフラットなノード
export interface FlatNode {
  id: string;
  parentId: string;
  content: string;
  level: number;
  type: string;
  assignee?: string;
  dueDate?: string;
}

// 分析セッション
export interface AnalysisSession {
  id: string;
  title: string;
  rootNode: AnalysisNode;
  createdAt: string;
  updatedAt: string;
}

// 分析一覧のアイテム
export interface AnalysisListItem {
  id: string;
  title: string;
  updatedAt: string;
}

// GAS通信結果
export interface GasResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

// React Flowのノード用データ
export interface FlowNodeData {
  label: string;
  level: number;
  type: NodeType;
  assignee?: string;
  dueDate?: string;
}

// Google Apps Script のグローバル型定義
declare global {
  interface Window {
    google?: {
      script: {
        run: {
          withSuccessHandler: <T>(callback: (result: T) => void) => {
            withFailureHandler: (callback: (error: Error) => void) => {
              saveAnalysis: (data: unknown) => void;
              loadAnalysis: (id: string) => void;
              getAnalysisList: () => void;
              deleteAnalysis: (id: string) => void;
              createPdf: (data: unknown) => void;
              getShareUrl: (id: string) => void;
              suggestNextWhy: (data: unknown) => void;
              suggestAction: (data: unknown) => void;
            };
          };
        };
      };
    };
  }
}

export {};
