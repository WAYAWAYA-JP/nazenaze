/**
 * ノード入力コンポーネント
 * 階層化された入力フォームの各ノードを表示
 */

import React, { useState } from 'react';
import type { AnalysisNode, FlatNode } from '../types';
import { suggestNextWhy, suggestAction, flattenTree } from '../utils/gasApi';

interface NodeInputProps {
  node: AnalysisNode;
  rootNode: AnalysisNode;
  onUpdateContent: (nodeId: string, content: string) => void;
  onUpdateAction: (nodeId: string, assignee: string, dueDate: string) => void;
  onAddChild: (parentId: string, parentLevel: number) => void;
  onAddAction: (parentId: string, parentLevel: number) => void;
  onRemove: (nodeId: string) => void;
  onAddChildWithContent: (parentId: string, parentLevel: number, content: string) => void;
  onAddActionWithContent: (parentId: string, parentLevel: number, content: string) => void;
}

export const NodeInput: React.FC<NodeInputProps> = ({
  node,
  rootNode,
  onUpdateContent,
  onUpdateAction,
  onAddChild,
  onAddAction,
  onRemove,
  onAddChildWithContent,
  onAddActionWithContent,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState<'why' | 'action'>('why');

  // ノードタイプに応じたスタイル
  const getNodeStyle = () => {
    switch (node.type) {
      case 'problem':
        return 'border-red-400 bg-red-50';
      case 'why':
        return 'border-blue-400 bg-blue-50';
      case 'action':
        return 'border-green-400 bg-green-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  // ラベルを取得
  const getLabel = () => {
    switch (node.type) {
      case 'problem':
        return '問題';
      case 'why':
        return `なぜ ${node.level}`;
      case 'action':
        return '対策';
      default:
        return '';
    }
  };

  // プレースホルダーを取得
  const getPlaceholder = () => {
    switch (node.type) {
      case 'problem':
        return '発生している問題を入力してください...';
      case 'why':
        return 'なぜその問題が起きたのか？';
      case 'action':
        return '具体的な対策を入力してください...';
      default:
        return '';
    }
  };

  // AIによる「なぜ」の提案を取得
  const handleAiSuggestWhy = async () => {
    if (!node.content.trim()) {
      alert('先に内容を入力してください');
      return;
    }

    setIsLoadingAi(true);
    setSuggestionType('why');
    setShowSuggestions(false);

    const nodes: FlatNode[] = flattenTree(rootNode);
    const result = await suggestNextWhy(nodes, node.content);

    if (result.success && result.suggestions) {
      setAiSuggestions(result.suggestions);
      setShowSuggestions(true);
    } else {
      alert(result.error || 'AI提案の取得に失敗しました');
    }

    setIsLoadingAi(false);
  };

  // AIによる対策の提案を取得
  const handleAiSuggestAction = async () => {
    if (!node.content.trim()) {
      alert('先に内容を入力してください');
      return;
    }

    setIsLoadingAi(true);
    setSuggestionType('action');
    setShowSuggestions(false);

    const nodes: FlatNode[] = flattenTree(rootNode);
    const result = await suggestAction(nodes, node.content);

    if (result.success && result.suggestions) {
      setAiSuggestions(result.suggestions);
      setShowSuggestions(true);
    } else {
      alert(result.error || 'AI提案の取得に失敗しました');
    }

    setIsLoadingAi(false);
  };

  // 提案を選択して追加
  const handleSelectSuggestion = (suggestion: string) => {
    if (suggestionType === 'why') {
      onAddChildWithContent(node.id, node.level, suggestion);
    } else {
      onAddActionWithContent(node.id, node.level, suggestion);
    }
    setShowSuggestions(false);
    setAiSuggestions([]);
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 mb-3 ${getNodeStyle()}`}>
      <div className="flex items-start gap-3">
        {/* 展開/折りたたみボタン（子要素がある場合のみ） */}
        {node.children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div className="flex-1">
          {/* ラベル */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-sm font-semibold px-2 py-0.5 rounded ${
                node.type === 'problem'
                  ? 'bg-red-200 text-red-800'
                  : node.type === 'action'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-blue-200 text-blue-800'
              }`}
            >
              {getLabel()}
            </span>

            {/* 削除ボタン（ルートノード以外） */}
            {node.type !== 'problem' && (
              <button
                onClick={() => onRemove(node.id)}
                className="ml-auto text-gray-400 hover:text-red-500 focus:outline-none"
                title="削除"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* コンテンツ入力 */}
          <textarea
            value={node.content}
            onChange={(e) => onUpdateContent(node.id, e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />

          {/* アクションノードの場合、担当者と期限の入力 */}
          {node.type === 'action' && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">担当者</label>
                <input
                  type="text"
                  value={node.assignee || ''}
                  onChange={(e) => onUpdateAction(node.id, e.target.value, node.dueDate || '')}
                  placeholder="誰が？"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">期限</label>
                <input
                  type="date"
                  value={node.dueDate || ''}
                  onChange={(e) => onUpdateAction(node.id, node.assignee || '', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* アクションボタン */}
          {node.type !== 'action' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => onAddChild(node.id, node.level)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                なぜ？を追加
              </button>
              <button
                onClick={() => onAddAction(node.id, node.level)}
                className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                対策を追加
              </button>

              {/* AI提案ボタン */}
              <button
                onClick={handleAiSuggestWhy}
                disabled={isLoadingAi}
                className="inline-flex items-center px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                {isLoadingAi && suggestionType === 'why' ? (
                  <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                AI提案(なぜ)
              </button>
              <button
                onClick={handleAiSuggestAction}
                disabled={isLoadingAi}
                className="inline-flex items-center px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {isLoadingAi && suggestionType === 'action' ? (
                  <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                AI提案(対策)
              </button>
            </div>
          )}

          {/* AI提案の表示 */}
          {showSuggestions && aiSuggestions.length > 0 && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-800">
                  AI提案 ({suggestionType === 'why' ? 'なぜ' : '対策'})
                </span>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-purple-400 hover:text-purple-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left p-2 text-sm bg-white border border-purple-200 rounded hover:bg-purple-100 hover:border-purple-400 transition-colors"
                  >
                    <span className="text-purple-600 font-medium mr-2">{index + 1}.</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 子ノード */}
      {isExpanded && node.children.length > 0 && (
        <div className="mt-4 ml-8 border-l-2 border-gray-200 pl-4">
          {node.children.map(child => (
            <NodeInput
              key={child.id}
              node={child}
              rootNode={rootNode}
              onUpdateContent={onUpdateContent}
              onUpdateAction={onUpdateAction}
              onAddChild={onAddChild}
              onAddAction={onAddAction}
              onRemove={onRemove}
              onAddChildWithContent={onAddChildWithContent}
              onAddActionWithContent={onAddActionWithContent}
            />
          ))}
        </div>
      )}
    </div>
  );
};
