/**
 * M5 AI FAEテスト用のフィクスチャ
 * テストの前後処理を共通化
 */
const base = require('@playwright/test');
const { getTimestamp, ensureLogDirectory } = require('../utils/logger');

/**
 * M5 AI FAEテスト用の拡張フィクスチャ
 */
exports.test = base.test.extend({
  // テスト実行時のタイムスタンプ
  timestamp: async ({}, use) => {
    // タイムスタンプを生成
    const timestamp = getTimestamp();
    console.log(`テスト実行時のタイムスタンプ: ${timestamp}`);
    
    // ログディレクトリが存在することを確認
    ensureLogDirectory();
    
    // タイムスタンプをテストで使用
    await use(timestamp);
  },
  
  // 日本語ブラウザコンテキスト
  jaContext: async ({ browser }, use) => {
    // 日本語ブラウザのコンテキストを作成
    const context = await browser.newContext({
      locale: 'ja-JP',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      geolocation: { longitude: 139.7671, latitude: 35.6812 }, // 東京
      permissions: ['geolocation'],
      timezoneId: 'Asia/Tokyo',
    });
    
    // コンテキストをテストで使用
    await use(context);
    
    // テスト終了後にコンテキストを閉じる
    await context.close();
  },
  
  // 日本語ページ
  jaPage: async ({ jaContext }, use) => {
    // 日本語コンテキストから新しいページを作成
    const page = await jaContext.newPage();
    console.log('日本語ページを作成しました');
    
    // ページをテストで使用
    await use(page);
  },
});

// expect関数をエクスポート
exports.expect = base.expect;
