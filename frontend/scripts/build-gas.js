/**
 * ViteビルドをGAS用に変換するスクリプト
 * ビルド後のindex.htmlをGASのbundle.htmlに変換
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../dist/index.html');
const gasPath = path.join(__dirname, '../../gas/bundle.html');

try {
  // ビルドされたHTMLを読み込み
  let html = fs.readFileSync(distPath, 'utf-8');

  // <script type="module">を<script>に変換（GASでは type="module" が使えない場合があるため）
  html = html.replace(/<script type="module"/g, '<script');

  // <!DOCTYPE html> と <html>, <head>, <body> タグを除去
  // GASのテンプレートに埋め込むためのスクリプトとスタイルのみを抽出
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);

  let bundleContent = '';

  // スタイルを追加
  if (styleMatch) {
    bundleContent += styleMatch.join('\n');
  }

  // スクリプトを追加
  if (scriptMatch) {
    bundleContent += '\n' + scriptMatch.join('\n');
  }

  // GASディレクトリに保存
  fs.writeFileSync(gasPath, bundleContent, 'utf-8');

  console.log('✅ GAS用バンドルを生成しました: gas/bundle.html');
  console.log(`   サイズ: ${(fs.statSync(gasPath).size / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ エラーが発生しました:', error.message);
  process.exit(1);
}
