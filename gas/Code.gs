/**
 * なぜなぜ分析ツール - Google Apps Script バックエンド
 * Why-Why Analysis Tool Backend
 */

// スプレッドシートの設定
const SHEET_NAME = 'NazenazeData';
const HEADERS = ['analysis_id', 'parent_id', 'content', 'level', 'type', 'updated_at', 'assignee', 'due_date'];

/**
 * Webアプリケーションのエントリーポイント
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('なぜなぜ分析ツール')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * HTMLファイルをインクルードするためのヘルパー関数
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * スプレッドシートを初期化（ヘッダー行がなければ作成）
 */
function initializeSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('なぜなぜ分析データ');
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }

  return sheet;
}

/**
 * 分析データを保存
 * @param {Object} data - 保存するデータ
 * @returns {Object} 保存結果
 */
function saveAnalysis(data) {
  try {
    const sheet = initializeSheet();
    const analysisId = data.analysisId || generateUUID();
    const now = new Date().toISOString();

    // 既存のデータを削除（同じanalysis_idのもの）
    if (data.analysisId) {
      deleteAnalysisByIdInternal(sheet, data.analysisId);
    }

    // ノードデータを保存
    const nodes = data.nodes || [];
    nodes.forEach(node => {
      const row = [
        analysisId,
        node.parentId || '',
        node.content,
        node.level,
        node.type,
        now,
        node.assignee || '',
        node.dueDate || ''
      ];
      sheet.appendRow(row);
    });

    return { success: true, analysisId: analysisId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * 分析データを読み込み
 * @param {string} analysisId - 分析ID
 * @returns {Object} 読み込んだデータ
 */
function loadAnalysis(analysisId) {
  try {
    const sheet = initializeSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return { success: true, nodes: [] };
    }

    const nodes = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === analysisId) {
        nodes.push({
          id: `node-${i}`,
          analysisId: data[i][0],
          parentId: data[i][1],
          content: data[i][2],
          level: data[i][3],
          type: data[i][4],
          updatedAt: data[i][5],
          assignee: data[i][6],
          dueDate: data[i][7]
        });
      }
    }

    return { success: true, nodes: nodes };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * 全ての分析一覧を取得
 * @returns {Object} 分析一覧
 */
function getAnalysisList() {
  try {
    const sheet = initializeSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return { success: true, analyses: [] };
    }

    const analysisMap = new Map();
    for (let i = 1; i < data.length; i++) {
      const analysisId = data[i][0];
      if (!analysisMap.has(analysisId)) {
        // レベル0（問題）のノードを探す
        if (data[i][3] === 0) {
          analysisMap.set(analysisId, {
            id: analysisId,
            title: data[i][2],
            updatedAt: data[i][5]
          });
        }
      }
    }

    return { success: true, analyses: Array.from(analysisMap.values()) };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * 分析を削除
 * @param {string} analysisId - 削除する分析ID
 * @returns {Object} 削除結果
 */
function deleteAnalysis(analysisId) {
  try {
    const sheet = initializeSheet();
    deleteAnalysisByIdInternal(sheet, analysisId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * 内部用: 指定IDの分析を削除
 */
function deleteAnalysisByIdInternal(sheet, analysisId) {
  const data = sheet.getDataRange().getValues();
  const rowsToDelete = [];

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === analysisId) {
      rowsToDelete.push(i + 1);
    }
  }

  // 下から削除（行番号がずれないように）
  rowsToDelete.forEach(row => {
    sheet.deleteRow(row);
  });
}

/**
 * UUID生成
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * PDF出力用のHTML生成
 * @param {Object} data - 分析データ
 * @returns {string} PDF用HTML
 */
function generatePdfHtml(data) {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>なぜなぜ分析 - ${data.title || '分析結果'}</title>
      <style>
        body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 20px; }
        h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
        .node { margin: 10px 0; padding: 10px; border-left: 3px solid #3182ce; background: #ebf8ff; }
        .node.action { border-left-color: #38a169; background: #f0fff4; }
        .level { color: #718096; font-size: 0.9em; }
        .content { font-size: 1.1em; margin: 5px 0; }
        .meta { color: #718096; font-size: 0.85em; }
      </style>
    </head>
    <body>
      <h1>なぜなぜ分析レポート</h1>
      <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
  `;

  if (data.nodes) {
    data.nodes.forEach(node => {
      const levelLabel = node.level === 0 ? '問題' : `なぜ ${node.level}`;
      const typeClass = node.type === 'action' ? 'action' : '';
      html += `
        <div class="node ${typeClass}" style="margin-left: ${node.level * 20}px;">
          <div class="level">${node.type === 'action' ? '対策' : levelLabel}</div>
          <div class="content">${node.content}</div>
          ${node.assignee ? `<div class="meta">担当: ${node.assignee}</div>` : ''}
          ${node.dueDate ? `<div class="meta">期限: ${node.dueDate}</div>` : ''}
        </div>
      `;
    });
  }

  html += '</body></html>';
  return html;
}

/**
 * PDFを生成してURLを返す
 * @param {Object} data - 分析データ
 * @returns {Object} PDF URL
 */
function createPdf(data) {
  try {
    const html = generatePdfHtml(data);
    const blob = Utilities.newBlob(html, 'text/html', 'analysis.html');
    const pdf = blob.getAs('application/pdf');
    pdf.setName(`nazenaze_${data.analysisId || 'analysis'}_${Date.now()}.pdf`);

    const folder = DriveApp.getRootFolder();
    const file = folder.createFile(pdf);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { success: true, url: file.getUrl() };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * 共有URLを生成
 * @param {string} analysisId - 分析ID
 * @returns {Object} 共有URL
 */
function getShareUrl(analysisId) {
  try {
    const scriptUrl = ScriptApp.getService().getUrl();
    const shareUrl = `${scriptUrl}?id=${analysisId}`;
    return { success: true, url: shareUrl };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Groq APIを使用してAIによる「なぜ」の候補を生成
 * @param {Object} analysisData - 現在の分析状況（JSON形式）
 * @returns {Object} AI生成の候補
 */
function suggestNextWhy(analysisData) {
  try {
    // PropertiesServiceからAPIキーを取得
    const apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');

    if (!apiKey) {
      return {
        success: false,
        error: 'GROQ_API_KEYが設定されていません。スクリプトプロパティに設定してください。'
      };
    }

    // 分析状況をテキストに変換
    const analysisContext = buildAnalysisContext(analysisData);

    // Groq APIリクエスト
    const response = callGroqApi(apiKey, analysisContext, analysisData.targetNodeContent);

    return response;
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * 分析状況をコンテキストテキストに変換
 * @param {Object} data - 分析データ
 * @returns {string} コンテキストテキスト
 */
function buildAnalysisContext(data) {
  const nodes = data.nodes || [];
  let context = '【現在の分析状況】\n\n';

  // ノードを階層的に表示
  nodes.forEach(node => {
    const indent = '  '.repeat(node.level);
    const label = node.level === 0 ? '問題' :
                  node.type === 'action' ? '対策' :
                  `なぜ${node.level}`;
    context += `${indent}[${label}] ${node.content}\n`;
  });

  return context;
}

/**
 * Groq APIを呼び出す
 * @param {string} apiKey - Groq APIキー
 * @param {string} context - 分析コンテキスト
 * @param {string} targetContent - 対象ノードの内容
 * @returns {Object} APIレスポンス
 */
function callGroqApi(apiKey, context, targetContent) {
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const systemPrompt = `あなたは「なぜなぜ分析」の専門家です。
製造業やIT業界での根本原因分析（RCA: Root Cause Analysis）に精通しています。

以下のルールに従って、論理的で漏れのない「なぜ」の候補を提案してください：

1. 真の原因に迫るため、表面的な答えではなく、より深い原因を探る
2. 複数の可能性がある場合は、2〜3個の候補を提案する
3. 各候補は具体的で検証可能なものにする
4. MECE（Mutually Exclusive, Collectively Exhaustive）の原則を意識し、論理的な漏れがないようにする
5. 「〜がなかった」「〜が不足していた」などの否定形も活用する
6. 回答は日本語で、簡潔に箇条書きで提示する`;

  const userPrompt = `${context}

【分析対象】
「${targetContent}」に対して、次の「なぜ？」の候補を提案してください。

真因に迫るため、複数の視点から2〜3個の候補を挙げてください。`;

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1024
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    const errorData = JSON.parse(responseText);
    return {
      success: false,
      error: `Groq API Error: ${errorData.error?.message || responseText}`
    };
  }

  const result = JSON.parse(responseText);
  const aiResponse = result.choices[0]?.message?.content;

  if (!aiResponse) {
    return { success: false, error: 'AIからの応答が空でした' };
  }

  // 候補をパースして配列に変換
  const suggestions = parseAiSuggestions(aiResponse);

  return {
    success: true,
    suggestions: suggestions,
    rawResponse: aiResponse
  };
}

/**
 * AIの応答から候補リストをパース
 * @param {string} response - AIの応答テキスト
 * @returns {Array} 候補の配列
 */
function parseAiSuggestions(response) {
  const lines = response.split('\n');
  const suggestions = [];

  lines.forEach(line => {
    // 箇条書きのパターンをマッチ
    const cleaned = line
      .replace(/^[\s]*[-*•]\s*/, '')  // 先頭の記号を除去
      .replace(/^[\s]*\d+[.)]\s*/, '') // 番号を除去
      .replace(/^\*\*|\*\*$/g, '')     // 太字マークを除去
      .trim();

    if (cleaned && cleaned.length > 2 && !cleaned.startsWith('#')) {
      suggestions.push(cleaned);
    }
  });

  // 最大5個まで
  return suggestions.slice(0, 5);
}

/**
 * AIによる対策提案を生成
 * @param {Object} analysisData - 分析データ
 * @returns {Object} 対策提案
 */
function suggestAction(analysisData) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');

    if (!apiKey) {
      return {
        success: false,
        error: 'GROQ_API_KEYが設定されていません'
      };
    }

    const context = buildAnalysisContext(analysisData);

    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const systemPrompt = `あなたは改善活動の専門家です。
なぜなぜ分析で特定された真因に対して、効果的な対策を提案してください。

対策提案のルール：
1. 具体的で実行可能なアクションを提案する
2. 再発防止と未然防止の両方の観点を含める
3. 各対策には「誰が」「何を」「いつまでに」を意識する
4. コスト効果の高い対策を優先する
5. 回答は日本語で、簡潔に箇条書きで提示する`;

    const userPrompt = `${context}

【対策提案依頼】
特定された真因「${analysisData.targetNodeContent}」に対する具体的な対策を2〜3個提案してください。`;

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(endpoint, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      const errorData = JSON.parse(responseText);
      return {
        success: false,
        error: `Groq API Error: ${errorData.error?.message || responseText}`
      };
    }

    const result = JSON.parse(responseText);
    const aiResponse = result.choices[0]?.message?.content;

    const suggestions = parseAiSuggestions(aiResponse);

    return {
      success: true,
      suggestions: suggestions,
      rawResponse: aiResponse
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
