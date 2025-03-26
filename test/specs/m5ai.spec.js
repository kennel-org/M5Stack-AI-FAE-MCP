/**
 * M5 AI FAEとの対話テスト
 * 
 * AtomS3 LiteとGPSモジュール（AtomicBase GPS）の接続方法に関する
 * 情報を取得するためのテスト
 */
const { test, expect } = require('../fixtures/m5ai-fixture');
const path = require('path');
const fs = require('fs');
const { saveTextFile, saveHtmlFile, saveJsonFile, saveQandAFile, logsDir } = require('../utils/logger');
const { getLatestAIResponse, getBotMessages } = require('../utils/m5ai-helper');

test('M5 AI FAEに質問して回答を取得する', async ({ jaPage: page, timestamp }) => {
  // M5 AIのチャットページに移動
  console.log('M5 AIのチャットページにアクセスしています...');
  await page.goto('https://chat.m5stack.com/', { timeout: 60000 });
  console.log('ページにアクセスしました');
  
  // ページが完全に読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  console.log('ページが完全に読み込まれました');
  
  // スクリーンショットを撮影（初期状態）
  console.log('初期状態のスクリーンショットを撮影しています...');
  const initialScreenshotPath = path.join(logsDir, `m5ai_initial_${timestamp}.png`);
  await page.screenshot({ path: initialScreenshotPath, fullPage: true });
  console.log('初期状態のスクリーンショットを保存しました: ' + initialScreenshotPath);
  
  // 質問内容
  const question = 'AtomS3 LiteにGPSモジュールを接続する方法を教えてください';
  console.log(`質問内容: ${question}`);
  
  // テキストエリアに質問を入力（複数のセレクタを試行）
  console.log('テキストエリアに質問を入力しています...');
  const textareaSelectors = [
    'textarea[placeholder="Enterキーで送信（Shift+Enterで改行）"]', // 日本語版
    'textarea[placeholder="Send a message"]', // 英語版
    '.chat-input textarea', // 汎用1
    'textarea' // 最も汎用的
  ];
  
  let inputSuccess = false;
  for (const selector of textareaSelectors) {
    try {
      await page.fill(selector, question);
      console.log(`セレクタ "${selector}" で入力成功`);
      inputSuccess = true;
      break;
    } catch (error) {
      console.log(`セレクタ "${selector}" での入力に失敗しました`);
    }
  }
  
  expect(inputSuccess, '質問の入力に失敗しました').toBeTruthy();
  
  // スクリーンショットを撮影（質問入力後）
  console.log('質問入力後のスクリーンショットを撮影しています...');
  const questionScreenshotPath = path.join(logsDir, `m5ai_question_${timestamp}.png`);
  await page.screenshot({ path: questionScreenshotPath, fullPage: true });
  console.log('質問入力後のスクリーンショットを保存しました: ' + questionScreenshotPath);
  
  // 送信ボタンをクリック（複数のセレクタを試行）
  console.log('送信ボタンをクリックしています...');
  const buttonSelectors = [
    'textarea[placeholder="Enterキーで送信（Shift+Enterで改行）"] + button', // 日本語版
    'button[aria-label="Send message"]', // 英語版
    'form button', // 汎用1
    'button' // 最も汎用的
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
  
  expect(clickSuccess, '送信ボタンのクリックに失敗しました').toBeTruthy();
  
  // 回答が表示されるのを待機
  console.log('回答が表示されるのを待機しています...');
  
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
      return thinkingBar && thinkingBar.style.display === 'none';
    }, { timeout: 60000 });
    console.log('「考え中...」が消えました - 回答が表示されています');
  } catch (error) {
    console.log('「考え中...」の非表示を検出できませんでした - タイムアウト');
  }
  
  // 回答が完全に表示されるまで追加で待機（30秒）
  console.log('回答が完全に表示されるまで追加で待機しています...');
  await page.waitForTimeout(30000);
  console.log('追加の待機が完了しました');
  
  // スクリーンショットを撮影（回答表示後）
  console.log('回答表示後のスクリーンショットを撮影しています...');
  const responseScreenshotPath = path.join(logsDir, `m5ai_response_${timestamp}.png`);
  await page.screenshot({ path: responseScreenshotPath, fullPage: true });
  console.log('回答表示後のスクリーンショットを保存しました: ' + responseScreenshotPath);
  
  // 回答テキストを取得
  console.log('回答テキストを取得しています...');
  const response = await getLatestAIResponse(page);
  
  // 回答テキストを表示と保存
  if (response.text) {
    console.log('=== 回答テキスト ===');
    console.log(response.text);
    console.log('===================');
    
    // 回答テキストをファイルに保存
    const responseTextPath = saveTextFile(response.text, 'm5ai_response', timestamp);
    
    // 質問と回答を一緒にファイルに保存
    const qAndAPath = saveQandAFile(question, response.text, timestamp);
    console.log(`質問と回答を一緒に保存しました: ${qAndAPath}`);
    
    // HTMLコンテンツをファイルに保存
    if (response.html) {
      const responseHtmlPath = saveHtmlFile(response.html, 'm5ai_response_html', timestamp);
    }
    
    // 回答テキストが取得できたことを検証
    expect(response.text.length).toBeGreaterThan(100);
  } else {
    console.log('回答テキストが取得できませんでした。');
    // テストを失敗させる
    expect(response.text, '回答テキストが取得できませんでした').toBeTruthy();
  }
  
  // ページ全体のHTMLを保存
  console.log('ページ全体のHTMLを保存しています...');
  const html = await page.content();
  const pageHtmlPath = saveHtmlFile(html, 'm5ai_page', timestamp);
  
  // ボットメッセージの詳細情報を取得
  console.log('ボットメッセージの詳細情報を取得しています...');
  const botMessages = await getBotMessages(page);
  
  // ボットメッセージをJSONファイルに保存
  const botMessagesPath = saveJsonFile(botMessages, 'm5ai_bot_messages', timestamp);
  
  // ボットメッセージが取得できたことを検証
  expect(botMessages.length).toBeGreaterThan(0);
  
  // GPSモジュールの接続情報が含まれているか確認
  const containsGpsInfo = response.text.includes('GPS') && 
                         (response.text.includes('TX') || response.text.includes('RX'));
  
  // GPSモジュールの接続情報が含まれていることを検証
  console.log('GPSモジュールの接続情報が含まれているか確認しています...');
  if (containsGpsInfo) {
    console.log('GPSモジュールの接続情報が含まれています');
  } else {
    console.log('GPSモジュールの接続情報が含まれていない可能性があります');
  }
  
  // AtomS3 Liteの情報が含まれているか確認
  const containsAtomS3Info = response.text.includes('AtomS3') || 
                            response.text.includes('Atom S3');
  
  // AtomS3 Liteの情報が含まれていることを検証
  console.log('AtomS3 Liteの情報が含まれているか確認しています...');
  if (containsAtomS3Info) {
    console.log('AtomS3 Liteの情報が含まれています');
  } else {
    console.log('AtomS3 Liteの情報が含まれていない可能性があります');
  }
});
