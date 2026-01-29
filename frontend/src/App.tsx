/**
 * なぜなぜ分析ツール メインアプリケーション
 */

import React, { useState } from 'react';
import { useAnalysis } from './hooks/useAnalysis';
import { Header } from './components/Header';
import { NodeInput } from './components/NodeInput';
import { TreeView } from './components/TreeView';

type ViewMode = 'split' | 'editor' | 'tree';

const App: React.FC = () => {
  const {
    analysisId,
    rootNode,
    isSaving,
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
  } = useAnalysis();

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const counts = getNodeCounts();

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ヘッダー */}
      <Header
        analysisId={analysisId}
        rootNode={rootNode}
        isSaving={isSaving}
        onSave={handleSave}
        onNew={handleNew}
        onLoad={handleLoad}
        message={message}
        setMessage={setMessage}
      />

      {/* ビュー切り替えバー */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            なぜ: <span className="font-semibold text-blue-600">{counts.why}</span>
          </span>
          <span className="text-sm text-gray-600">
            対策: <span className="font-semibold text-green-600">{counts.action}</span>
          </span>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('editor')}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === 'editor'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            エディタ
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === 'split'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            分割
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === 'tree'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ツリー
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* エディタエリア */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div
            className={`${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            } overflow-y-auto p-4 bg-white border-r`}
          >
            <div className="max-w-2xl mx-auto">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  分析エディタ
                </h2>
                <p className="text-sm text-gray-500">
                  問題を入力し、「なぜ？」を繰り返して真因を特定しましょう。
                  AIの提案機能も活用できます。
                </p>
              </div>
              <NodeInput
                node={rootNode}
                rootNode={rootNode}
                onUpdateContent={updateNodeContent}
                onUpdateAction={updateNodeAction}
                onAddChild={addChildNode}
                onAddAction={addActionNode}
                onRemove={removeNode}
                onAddChildWithContent={addChildNodeWithContent}
                onAddActionWithContent={addActionNodeWithContent}
              />
            </div>
          </div>
        )}

        {/* ツリービューエリア */}
        {(viewMode === 'split' || viewMode === 'tree') && (
          <div
            className={`${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            } overflow-hidden`}
          >
            <TreeView rootNode={rootNode} />
          </div>
        )}
      </div>

      {/* フッター */}
      <footer className="bg-gray-800 text-gray-400 text-center py-2 text-sm">
        なぜなぜ分析ツール v1.0 | Powered by Groq AI
      </footer>
    </div>
  );
};

export default App;
