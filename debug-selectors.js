/**
 * M5 AI FAEのセレクタデバッグスクリプト
 * 
 * このスクリプトは、M5 AI FAEのチャットページから回答を抽出するためのセレクタをテストします。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// テスト用の質問
const TEST_QUESTION = 'AtomS3 LiteにGPSモジュールを接続する方法を教えてください';

// テストするセレクタのリスト
const SELECTORS_TO_TEST = [
  // M5 AI FAEの最新のUIに対応するセレクタ
  '.message.bot-message:last-child .message-text',
  '.message.bot-message:nth-last-child(1) .message-text',
  '.message.bot-message:nth-last-child(2) .message-text',
  // 一般的なチャットボットUIのセレクタ
  '.chat-message-bot:last-child .chat-message-content',
  '.chat-message-bot:last-child',
  '.bot-message:last-child',
  '.ai-message:last-child',
  // 汎用的なセレクタ
  '.message.bot-message .message-text',
  '.message-text',
  '.message',
  '.chat-message',
  '.chat-message-content',
  '.response',
  '.ai-response',
  '.chat-response',
  'div[role="presentation"]',
  '.message-list .message:last-child',
  '.message-list .message:nth-last-child(1)',
  '.message-list .message:nth-last-child(2)'
];

// デバッグ結果を保存するディレクトリ
const DEBUG_DIR = path.join(__dirname, 'debug');
if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

/**
 * タイムスタンプを生成する
 * @returns {string} YYYYMMDD_HHmmss 形式のタイムスタンプ
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * セレクタをテストする
 */
async function testSelectors() {
  const timestamp = getTimestamp();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    locale: 'ja-JP',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    geolocation: { longitude: 139.7671, latitude: 35.6812 },
    permissions: ['geolocation'],
    timezoneId: 'Asia/Tokyo',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('M5 AI FAEのチャットページにアクセスしています...');
    await page.goto('https://chat.m5stack.com/', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('ページが読み込まれました');
    
    // スクリーンショットを撮影（初期状態）
    const initialScreenshotPath = path.join(DEBUG_DIR, `initial_${timestamp}.png`);
    await page.screenshot({ path: initialScreenshotPath, fullPage: true });
    console.log(`初期状態のスクリーンショットを保存しました: ${initialScreenshotPath}`);
    
    // 質問を入力
    console.log(`質問を入力します: ${TEST_QUESTION}`);
    const textareaSelectors = [
      'textarea[placeholder="Enterキーで送信（Shift+Enterで改行）"]',
      'textarea[placeholder="Send a message"]',
      '.chat-input textarea',
      'textarea'
    ];
    
    let inputSuccess = false;
    for (const selector of textareaSelectors) {
      try {
        await page.fill(selector, TEST_QUESTION);
        console.log(`セレクタ "${selector}" で入力成功`);
        inputSuccess = true;
        break;
      } catch (error) {
        console.log(`セレクタ "${selector}" での入力に失敗しました`);
      }
    }
    
    if (!inputSuccess) {
      throw new Error('質問の入力に失敗しました');
    }
    
    // 送信ボタンをクリック
    console.log('送信ボタンをクリックします...');
    const buttonSelectors = [
      'textarea[placeholder="Enterキーで送信（Shift+Enterで改行）"] + button',
      'button[aria-label="Send message"]',
      'form button',
      'button'
    ];
    
    let clickSuccess = false;
    for (const selector of buttonSelectors) {
      try {
        await page.click(selector);
        console.log(`セレクタ "${selector}" でクリック成功`);
        clickSuccess = true;
        break;
      } catch (error) {
        console.log(`セレクタ "${selector}" でのクリックに失敗しました`);
      }
    }
    
    if (!clickSuccess) {
      throw new Error('送信ボタンのクリックに失敗しました');
    }
    
    // 「考え中...」が表示されるのを待機
    try {
      await page.waitForSelector('.thinking-bar', { timeout: 5000 });
      console.log('「考え中...」が表示されました');
    } catch (error) {
      console.log('「考え中...」の表示を検出できませんでした');
    }
    
    // 「考え中...」が消えるのを待機（最大60秒）
    try {
      await page.waitForFunction(() => {
        const thinkingBar = document.querySelector('.thinking-bar');
        return !thinkingBar || thinkingBar.style.display === 'none';
      }, { timeout: 60000 });
      console.log('「考え中...」が消えました - 回答が表示されています');
    } catch (error) {
      console.log('「考え中...」の非表示を検出できませんでした - タイムアウト');
    }
    
    // 回答が完全に表示されるまで追加で待機（10秒）
    console.log('回答が完全に表示されるまで追加で待機しています...');
    await page.waitForTimeout(10000);
    console.log('追加の待機が完了しました');
    
    // スクリーンショットを撮影（回答表示後）
    const responseScreenshotPath = path.join(DEBUG_DIR, `response_${timestamp}.png`);
    await page.screenshot({ path: responseScreenshotPath, fullPage: true });
    console.log(`回答表示後のスクリーンショットを保存しました: ${responseScreenshotPath}`);
    
    // ページのHTMLを保存
    const html = await page.content();
    const htmlPath = path.join(DEBUG_DIR, `page_${timestamp}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`ページのHTMLを保存しました: ${htmlPath}`);
    
    // 各セレクタをテスト
    console.log('\n=== セレクタテスト結果 ===');
    const results = [];
    
    for (const selector of SELECTORS_TO_TEST) {
      try {
        const exists = await page.$(selector);
        if (!exists) {
          console.log(`❌ セレクタ "${selector}" は存在しません`);
          results.push({ selector, exists: false, text: null, length: 0 });
          continue;
        }
        
        const text = await page.textContent(selector);
        const trimmedText = text ? text.trim() : '';
        const length = trimmedText.length;
        const isLongEnough = length > 50;
        
        if (isLongEnough) {
          console.log(`✅ セレクタ "${selector}" で有効なテキストを取得 (${length}文字)`);
          results.push({ 
            selector, 
            exists: true, 
            text: trimmedText.substring(0, 100) + (trimmedText.length > 100 ? '...' : ''),
            length,
            valid: true
          });
        } else {
          console.log(`❌ セレクタ "${selector}" のテキストは短すぎます (${length}文字)`);
          results.push({ 
            selector, 
            exists: true, 
            text: trimmedText,
            length,
            valid: false
          });
        }
      } catch (error) {
        console.log(`❌ セレクタ "${selector}" のテスト中にエラーが発生しました: ${error.message}`);
        results.push({ 
          selector, 
          exists: false, 
          error: error.message,
          valid: false
        });
      }
    }
    
    // テスト結果をJSONファイルに保存
    const resultsPath = path.join(DEBUG_DIR, `selector_results_${timestamp}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nテスト結果をJSONファイルに保存しました: ${resultsPath}`);
    
    // 有効なセレクタの数を表示
    const validSelectors = results.filter(r => r.valid);
    console.log(`\n${SELECTORS_TO_TEST.length}個中${validSelectors.length}個のセレクタが有効です`);
    
    if (validSelectors.length > 0) {
      console.log('\n最も有効なセレクタ:');
      // テキストの長さでソート（降順）
      validSelectors.sort((a, b) => b.length - a.length);
      const bestSelector = validSelectors[0];
      console.log(`セレクタ: "${bestSelector.selector}"`);
      console.log(`テキスト長: ${bestSelector.length}文字`);
      console.log(`テキスト: ${bestSelector.text}`);
    }
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  } finally {
    await browser.close();
    console.log('\nテストが完了しました');
  }
}

// テストを実行
testSelectors().catch(console.error);
