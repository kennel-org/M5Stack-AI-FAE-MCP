/**
 * ログ関連のユーティリティ
 * 
 * テスト実行時のログを保存するための関数群
 */
const fs = require('fs');
const path = require('path');

// ログ保存用のディレクトリパス
const logsDir = path.join(__dirname, '..', 'logs');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * テキストファイルを保存する
 * @param {string} data - 保存するテキストデータ
 * @param {string} filename - ファイル名のプレフィックス
 * @param {string} timestamp - タイムスタンプ
 * @returns {string} 保存したファイルのパス
 */
function saveTextFile(data, filename, timestamp) {
  const filePath = path.join(logsDir, `${filename}_${timestamp}.txt`);
  fs.writeFileSync(filePath, data, 'utf8');
  console.log(`テキストファイルを保存しました: ${filePath}`);
  return filePath;
}

/**
 * HTMLファイルを保存する
 * @param {string} data - 保存するHTMLデータ
 * @param {string} filename - ファイル名のプレフィックス
 * @param {string} timestamp - タイムスタンプ
 * @returns {string} 保存したファイルのパス
 */
function saveHtmlFile(data, filename, timestamp) {
  const filePath = path.join(logsDir, `${filename}_${timestamp}.html`);
  fs.writeFileSync(filePath, data, 'utf8');
  console.log(`HTMLファイルを保存しました: ${filePath}`);
  return filePath;
}

/**
 * JSONファイルを保存する
 * @param {object} data - 保存するJSONデータ
 * @param {string} filename - ファイル名のプレフィックス
 * @param {string} timestamp - タイムスタンプ
 * @returns {string} 保存したファイルのパス
 */
function saveJsonFile(data, filename, timestamp) {
  const filePath = path.join(logsDir, `${filename}_${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`JSONファイルを保存しました: ${filePath}`);
  return filePath;
}

/**
 * 質問と回答をまとめてテキストファイルに保存する
 * @param {string} question - 質問テキスト
 * @param {string} answer - 回答テキスト
 * @param {string} timestamp - タイムスタンプ
 * @returns {string} 保存したファイルのパス
 */
function saveQandAFile(question, answer, timestamp) {
  const content = `# 質問\n\n${question}\n\n# 回答\n\n${answer}`;
  const filePath = path.join(logsDir, `m5ai_q_and_a_${timestamp}.txt`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`質問と回答をファイルに保存しました: ${filePath}`);
  return filePath;
}

module.exports = {
  logsDir,
  saveTextFile,
  saveHtmlFile,
  saveJsonFile,
  saveQandAFile
};
