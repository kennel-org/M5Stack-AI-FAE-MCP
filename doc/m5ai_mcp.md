# M5 AI FAEとの対話自動化ガイド

このドキュメントでは、Playwrightフレームワークを使用してM5 AI FAE（Field Application Engineer）と自動的に対話し、M5Stack製品に関する技術情報を取得する方法について説明します。

## 基本情報

- **M5 AI URL**: https://chat.m5stack.com/
- **インターフェース**: Webベースのチャットインターフェース
- **目的**: M5Stack製品に関する技術的な質問への回答取得
- **注意**: ウェブサイトのUIは更新される可能性があるため、セレクタが変更されている場合があります

## プロジェクト構成

### ディレクトリ構造

```
M5Stack_AI_FAE_MCP/
├── doc/                    # ドキュメント
│   ├── m5ai_mcp.md         # このファイル
│   └── requirements_ja.md  # 要件仕様
├── test/                   # テストコード
│   ├── fixtures/           # テスト用の共通フィクスチャ
│   │   └── m5ai-fixture.js # 日本語ブラウザ設定などの共通フィクスチャ
│   ├── logs/               # テスト実行時のログファイル保存先
│   ├── reports/            # テストレポート出力先
│   │   ├── html-report/    # HTML形式のレポート
│   │   └── test-results/   # テスト結果（スクリーンショットなど）
│   ├── specs/              # テスト仕様ファイル
│   │   └── m5ai.spec.js    # M5 AI FAEとの対話テスト
│   └── utils/              # 共通ユーティリティ
│       ├── logger.js       # ログ関連のユーティリティ
│       └── m5ai-helper.js  # M5 AI FAE対話用ヘルパー関数
├── package.json            # プロジェクト設定
├── playwright.config.js    # Playwright設定
└── README.md               # 概要ファイル
```

### セットアップ手順

1. **依存関係のインストール**:
   ```bash
   npm install
   ```

2. **Playwrightブラウザのインストール**:
   ```bash
   npm run playwright:install
   ```

3. **Playwrightシステム依存関係のインストール**:
   ```bash
   npm run playwright:install-deps
   ```

### 実行方法

#### 1. Playwrightテストとして実行（従来通り）
```bash
npm test
```

#### 2. MCPサーバ（APIサーバ）として利用

`mcp-server.js` を起動することで、外部からHTTP経由でm5stack chatbotに質問し、AI回答を取得できます。

**サーバ起動（ローカル）:**
```bash
node mcp-server.js
```

**サーバ起動（Docker）:**
```bash
docker build -t m5ai-mcp .
docker run -p 3000:3000 m5ai-mcp
```

**APIエンドポイント:**
- `POST /ask`  
  リクエストボディ：`{ "question": "質問内容" }`
  
  レスポンス例：
  ```json
  {
    "question": "AtomS3 LiteにGPSモジュールを接続する方法を教えてください",
    "answer": "（AIの回答テキスト）",
    "html": "（回答HTML）"
  }
  ```

**curl例:**
```bash
curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"question": "AtomS3 LiteにGPSモジュールを接続する方法を教えてください"}'
```

#### APIサーバの仕組み
- ExpressベースのサーバがHTTPリクエストを受け付け
- Playwrightでm5stack chatbotに実際にアクセス・質問を送信
- 回答が完全に表示されるまで「考え中...」インジケータを監視し、AI回答を取得
- 結果をJSONで返却

ブラウザを表示してテスト実行（明示的に指定）:
```bash
npm run test:headed
```

デバッグモードでテスト実行:
```bash
npm run test:debug
```

テストレポートを表示:
```bash
npm run report
```

## Playwrightを使用したM5 AIとの対話手順

### 1. ブラウザセッションの管理

```javascript
// 既存のブラウザセッションを閉じる関数（必要に応じて）
async function closeExistingBrowsers() {
  try {
    const browsers = await chromium.connectToBrowser();
    if (browsers && browsers.length > 0) {
      console.log('既存のブラウザセッションを閉じています...');
      for (const browser of browsers) {
        await browser.close();
      }
    }
  } catch (error) {
    console.log('既存のブラウザセッションはありませんでした');
  }
}
```

### 2. M5 AIのWebサイトにアクセス

```javascript
// M5 AIのチャットページにアクセス
await page.goto('https://chat.m5stack.com/');

// ページが完全に読み込まれるまで待機
await page.waitForLoadState('networkidle');
```

### 3. 質問の入力と送信

```javascript
// 質問内容の定義
const question = 'AtomS3 LiteにGPSモジュールを接続する方法を教えてください';

// テキストエリアに質問を入力（複数のセレクタを試行）
const textareaSelectors = [
  'textarea[placeholder="Enterキーで送信（Shift+Enterで改行）"]', // 日本語版
  'textarea[placeholder="Send a message"]', // 英語版
  '.chat-input textarea', // 汎用1
  'textarea' // 最も汎用的
];

// セレクタを順番に試行
for (const selector of textareaSelectors) {
  try {
    await page.fill(selector, question);
    console.log(`セレクタ "${selector}" で入力成功`);
    break;
  } catch (error) {
    console.log(`セレクタ "${selector}" での入力に失敗しました`);
  }
}

// 送信ボタンをクリック（複数のセレクタを試行）
const buttonSelectors = [
  'textarea[placeholder="Enterキーで送信（Shift+Enterで改行）"] + button', // 日本語版
  'button[aria-label="Send message"]', // 英語版
  'form button', // 汎用1
  'button' // 最も汎用的
];

// セレクタを順番に試行
for (const selector of buttonSelectors) {
  try {
    await page.click(selector);
    console.log(`セレクタ "${selector}" でクリック成功`);
    break;
  } catch (error) {
    console.log(`セレクタ "${selector}" でのクリックに失敗しました`);
  }
}
```

### 4. 回答の待機

```javascript
// 「考え中...」インジケータが表示されるのを待機
try {
  await page.waitForSelector('.thinking-bar', { timeout: 5000 });
  console.log('「考え中...」が表示されました');
} catch (error) {
  console.log('「考え中...」の表示を検出できませんでした');
}

// 「考え中...」インジケータが消えるのを待機（最大60秒）
try {
  await page.waitForFunction(() => {
    const thinkingBar = document.querySelector('.thinking-bar');
    return thinkingBar && thinkingBar.style.display === 'none';
  }, { timeout: 60000 });
  console.log('「考え中...」が消えました - 回答が表示されています');
} catch (error) {
  console.log('「考え中...」の非表示を検出できませんでした - タイムアウト');
}

// 回答が完全に表示されるまで追加で待機
await page.waitForTimeout(30000);
```

### 5. 回答の取得と保存

```javascript
// 回答テキストを取得する関数
async function getLatestAIResponse(page) {
  try {
    // 最も効果的なセレクタで試行
    const responseText = await page.textContent('.message.bot-message:last-child .message-text');
    
    // HTMLコンテンツも取得
    const responseHTML = await page.evaluate(selector => {
      const element = document.querySelector(selector);
      return element ? element.innerHTML : '';
    }, '.message.bot-message:last-child .message-text');
    
    return {
      text: responseText.trim(),
      html: responseHTML
    };
  } catch (error) {
    console.error('回答テキストの取得中にエラーが発生しました:', error);
    
    // 代替セレクタのリストを使用して再試行
    const selectors = [
      '.message.bot-message:last-child .message-text',
      '.message.bot-message:nth-last-child(1) .message-text',
      '.message.bot-message:nth-last-child(2) .message-text',
      '.message.bot-message .message-text',
      '.message-text',
      '.generated-content',
      '.message',
      '.chat-message',
      '.chat-message-content',
      '.response',
      '.ai-response',
      '.chat-response'
    ];
    
    // すべてのセレクタを試行
    for (const selector of selectors) {
      try {
        const text = await page.textContent(selector);
        if (text && text.trim() !== '' && text.length > 100) {
          console.log(`セレクタ "${selector}" で回答テキストを取得しました`);
          
          const html = await page.evaluate(sel => {
            const element = document.querySelector(sel);
            return element ? element.innerHTML : '';
          }, selector);
          
          return { text: text.trim(), html: html };
        }
      } catch (selectorError) {
        console.log(`セレクタ "${selector}" での取得に失敗しました`);
      }
    }
    
    // 最終手段：ボットメッセージの詳細情報を取得
    try {
      const botMessages = await page.evaluate(() => {
        const messages = Array.from(document.querySelectorAll('.message.bot-message'));
        return messages.map(msg => {
          const id = msg.id;
          const text = msg.querySelector('.message-text')?.textContent || '';
          const html = msg.querySelector('.message-text')?.innerHTML || '';
          return { id, text, html };
        });
      });
      
      if (botMessages.length > 0) {
        const lastMessage = botMessages[botMessages.length - 1];
        return { text: lastMessage.text, html: lastMessage.html };
      }
    } catch (secondError) {
      console.error('2回目の試行でもエラーが発生しました:', secondError);
    }
    
    return { text: '', html: '' };
  }
}

// 回答の取得と保存
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const response = await getLatestAIResponse(page);

// 回答テキストを表示
console.log('=== 回答テキスト ===');
console.log(response.text);
console.log('===================');

// 回答をファイルに保存
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'logs');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// テキストとHTMLを保存
fs.writeFileSync(path.join(logsDir, `m5ai_response_${timestamp}.txt`), response.text, 'utf8');
fs.writeFileSync(path.join(logsDir, `m5ai_response_html_${timestamp}.html`), response.html, 'utf8');
```

### 6. 提案された質問のフォローアップ（オプション）

```javascript
// 提案された質問をクリックして追加の回答を取得する関数
async function clickSuggestedQuestion(page, questionIndex = 0) {
  try {
    const suggestedQuestions = await page.$$('.suggested-question');
    
    if (suggestedQuestions.length > 0 && questionIndex < suggestedQuestions.length) {
      // 質問のテキストを取得
      const questionText = await suggestedQuestions[questionIndex].textContent();
      console.log(`提案された質問をクリックします: ${questionText}`);
      
      // 質問をクリック
      await suggestedQuestions[questionIndex].click();
      
      // 回答の待機と取得（上記の手順4と5と同様）
      // ...
      
      // 新しい回答を取得
      const followUpResponse = await getLatestAIResponse(page);
      
      // フォローアップ回答をファイルに保存
      fs.writeFileSync(
        path.join(logsDir, `m5ai_followup_response_${timestamp}.txt`), 
        followUpResponse.text, 
        'utf8'
      );
      
      return followUpResponse;
    } else {
      console.log('提案された質問が見つからないか、指定されたインデックスが範囲外です');
      return null;
    }
  } catch (error) {
    console.error('提案された質問のクリック中にエラーが発生しました:', error);
    return null;
  }
}
```

## Playwright Test Frameworkの使用方法

Playwright Test Frameworkを使用すると、より構造化されたテストが可能になります。以下は、`test/m5ai.test.js`の基本的な実装例です。

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ログ保存用のディレクトリパス
const logsDir = path.join(__dirname, 'logs');

// 現在の日時を取得してファイル名に使用するための関数
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

// テスト実行時のタイムスタンプ
const runTimestamp = getTimestamp();

test('M5 AI FAEに質問して回答を取得する', async ({ page }) => {
  // M5 AIのチャットページに移動
  await page.goto('https://chat.m5stack.com/');
  
  // 質問内容
  const question = 'AtomS3 LiteにGPSモジュールを接続する方法を教えてください';
  
  // テキストエリアに質問を入力（複数のセレクタを試行）
  // ...
  
  // 送信ボタンをクリック（複数のセレクタを試行）
  // ...
  
  // 回答が表示されるのを待機
  // ...
  
  // 回答テキストを取得
  const responseText = await page.textContent('.message.bot-message:last-child .message-text');
  
  // アサーション
  expect(responseText).toBeTruthy();
  expect(responseText.length).toBeGreaterThan(100);
  
  // 結果を保存
  fs.writeFileSync(path.join(logsDir, `m5ai_response_${runTimestamp}.txt`), responseText, 'utf8');
});
```

## 注意事項

1. **UIの変更**: M5 AIのウェブインターフェースは更新される可能性があります。セレクタが機能しない場合は、最新のUIに合わせて調整してください。

2. **ネットワーク状態**: 安定したインターネット接続が必要です。接続が不安定な場合、タイムアウトエラーが発生する可能性があります。

3. **応答時間**: M5 AIの応答時間は質問の複雑さや負荷によって異なります。長い回答の場合は、待機時間を調整する必要があるかもしれません。

4. **ログファイル**: すべてのログファイルは `test/logs` ディレクトリに保存されます。タイムスタンプ付きのファイル名を使用することで、以前の実行結果が上書きされないようになっています。

5. **ブラウザの可視性**: デフォルトでは、ブラウザは可視モードで起動されます。ヘッドレスモードで実行する場合は、`playwright.config.js`の設定を変更するか、テストコード内で`headless: true`オプションを指定してください。