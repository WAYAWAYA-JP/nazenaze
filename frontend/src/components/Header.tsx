/**
 * ヘッダーコンポーネント
 */

import React, { useState } from 'react';
import type { AnalysisListItem } from '../types';
import { getAnalysisList, deleteAnalysis, getShareUrl, createPdf } from '../utils/gasApi';
import { flattenTree } from '../utils/gasApi';
import type { AnalysisNode } from '../types';

interface HeaderProps {
  analysisId: string | null;
  rootNode: AnalysisNode;
  isSaving: boolean;
  onSave: () => void;
  onNew: () => void;
  onLoad: (id: string) => void;
  message: { type: 'success' | 'error'; text: string } | null;
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  analysisId,
  rootNode,
  isSaving,
  onSave,
  onNew,
  onLoad,
  message,
  setMessage,
}) => {
  const [showList, setShowList] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // 分析一覧を取得
  const handleShowList = async () => {
    setIsLoadingList(true);
    const result = await getAnalysisList();
    if (result.success && result.analyses) {
      setAnalyses(result.analyses);
    }
    setShowList(true);
    setIsLoadingList(false);
  };

  // 分析を削除
  const handleDelete = async (id: string) => {
    if (!confirm('この分析を削除しますか？')) return;

    const result = await deleteAnalysis(id);
    if (result.success) {
      setAnalyses(prev => prev.filter(a => a.id !== id));
      setMessage({ type: 'success', text: '削除しました' });
    } else {
      setMessage({ type: 'error', text: result.error || '削除に失敗しました' });
    }
  };

  // 共有URLを取得
  const handleShare = async () => {
    if (!analysisId) {
      setMessage({ type: 'error', text: '先に保存してください' });
      return;
    }

    const result = await getShareUrl(analysisId);
    if (result.success && result.url) {
      await navigator.clipboard.writeText(result.url);
      setMessage({ type: 'success', text: '共有URLをコピーしました' });
    } else {
      setMessage({ type: 'error', text: result.error || 'URL取得に失敗しました' });
    }
  };

  // PDFを生成
  const handleExportPdf = async () => {
    if (!analysisId) {
      setMessage({ type: 'error', text: '先に保存してください' });
      return;
    }

    setMessage({ type: 'success', text: 'PDF生成中...' });
    const nodes = flattenTree(rootNode);
    const result = await createPdf(analysisId, nodes, rootNode.content || 'なぜなぜ分析');

    if (result.success && result.url) {
      window.open(result.url, '_blank');
      setMessage({ type: 'success', text: 'PDFを生成しました' });
    } else {
      setMessage({ type: 'error', text: result.error || 'PDF生成に失敗しました' });
    }
  };

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* ロゴ・タイトル */}
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">なぜなぜ分析ツール</h1>
                <p className="text-sm text-blue-200">Why-Why Analysis Tool</p>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              <button
                onClick={onNew}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                新規作成
              </button>

              <button
                onClick={handleShowList}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                一覧
              </button>

              <button
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg transition-colors"
              >
                {isSaving ? (
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                )}
                保存
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                共有
              </button>

              <button
                onClick={handleExportPdf}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                PDF
              </button>
            </div>
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div
              className={`mt-3 px-4 py-2 rounded-lg ${
                message.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </header>

      {/* 分析一覧モーダル */}
      {showList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">保存済みの分析</h2>
              <button
                onClick={() => setShowList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {isLoadingList ? (
                <div className="text-center py-8 text-gray-500">読み込み中...</div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  保存された分析がありません
                </div>
              ) : (
                <div className="space-y-3">
                  {analyses.map(analysis => (
                    <div
                      key={analysis.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {analysis.title || '無題の分析'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(analysis.updatedAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onLoad(analysis.id);
                            setShowList(false);
                          }}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          開く
                        </button>
                        <button
                          onClick={() => handleDelete(analysis.id)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
