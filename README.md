# なぜなぜ分析ツール (Why-Why Analysis Tool)

問題の真因を特定するための「なぜなぜ分析」を、直感的かつスムーズに行えるWebアプリケーションです。

## 機能

- **動的ななぜなぜ入力**: 「なぜ」を入力すると次の「なぜ」が自動で現れるUI
- **複数分岐対応**: 1つの「なぜ」から複数の原因が派生するツリー構造をサポート
- **リアルタイム図解**: 入力内容を即座にツリーマップとして可視化（React Flow使用）
- **AI提案機能**: Groq APIを活用した「なぜ」と「対策」の候補提案
- **改善策の登録**: 特定した真因に対するアクションプラン（担当者、期限）を入力
- **データの永続化**: Googleスプレッドシートへの保存・読み込み
- **出力機能**: 分析シートのPDF化、共有用URLの発行

## システム構成

### フロントエンド
- React (Vite + TypeScript)
- Tailwind CSS
- React Flow

### バックエンド
- Google Apps Script (GAS)
- Googleスプレッドシート（データベース）
- Groq API（AI機能）

## セットアップ

### 1. フロントエンドの開発

```bash
cd frontend
npm install
npm run dev
```

### 2. GASへのデプロイ

1. [Google Apps Script](https://script.google.com/) で新しいプロジェクトを作成
2. `gas/` ディレクトリ内のファイルをプロジェクトにコピー
3. Groq APIキーを設定（以下のいずれかの方法）:

**方法A: セットアップ関数を使用**
1. `Code.gs` の `setupGroqApiKey()` 関数内の `'YOUR_GROQ_API_KEY'` を実際のAPIキーに置き換え
2. GASエディタで `setupGroqApiKey` を選択して実行

**方法B: スクリプトプロパティで直接設定**
1. GASエディタ左側の歯車アイコン（プロジェクトの設定）をクリック
2. 「スクリプト プロパティ」セクションで「スクリプト プロパティを追加」
3. プロパティ: `GROQ_API_KEY`、値: あなたのGroq APIキー

### 3. ビルドとデプロイ

```bash
cd frontend
npm run build
node scripts/build-gas.js
```

生成された `gas/bundle.html` をGASプロジェクトに追加し、Webアプリとしてデプロイ。

## 使い方

1. 「問題」欄に発生している問題を入力
2. 「なぜ？を追加」ボタンで原因を深堀り
3. AI提案ボタンでAIからの提案を取得
4. 真因が特定できたら「対策を追加」で改善策を登録
5. 「保存」ボタンでスプレッドシートに保存
6. 「共有」ボタンで共有URLを取得

## ライセンス

MIT
