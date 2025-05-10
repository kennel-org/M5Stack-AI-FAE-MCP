// MCPサーバ: m5stack chatbotに問い合わせるAPIサーバ
const express = require('express');
const { chromium } = require('playwright');
const { getLatestAIResponse } = require('./test/utils/m5ai-helper');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Default route to serve debug.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'debug.html'));
});

// POST /ask { question: "..." }
app.post('/ask', async (req, res) => {
  const question = req.body.question;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question is required' });
  }
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      locale: 'ja-JP',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      geolocation: { longitude: 139.7671, latitude: 35.6812 },
      permissions: ['geolocation'],
      timezoneId: 'Asia/Tokyo',
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    await page.goto('https://chat.m5stack.com/', { timeout: 60000 });
    await page.waitForLoadState('networkidle');

    // テキストエリアに質問を入力
    const textareaSelectors = [
      'textarea[placeholder="Enterキーで送信（Shift+Enterで改行）"]',
      'textarea[placeholder="Send a message"]',
      '.chat-input textarea',
      'textarea'
    ];
    let inputSuccess = false;
    for (const selector of textareaSelectors) {
      try {
        await page.fill(selector, question);
        inputSuccess = true;
        break;
      } catch (e) {}
    }
    if (!inputSuccess) {
      throw new Error('質問入力に失敗しました');
    }
    // Enterキーで送信
    await page.keyboard.press('Enter');

    // 「考え中...」インジケータの表示を待機（最大10秒）
    try {
      await page.waitForSelector('.thinking-bar', { timeout: 10000 });
    } catch (e) {}

    // 「考え中...」が消えるまで待機（最大90秒）
    try {
      await page.waitForFunction(() => {
        const bar = document.querySelector('.thinking-bar');
        return !bar || bar.style.display === 'none' || bar.offsetParent === null;
      }, { timeout: 90000 });
    } catch (e) {}

    // 回答が完全に表示されるまで追加で待機（5秒）
    await page.waitForTimeout(5000);

    // 回答取得
    const response = await getLatestAIResponse(page);

    res.json({
      question,
      answer: response?.text || '',
      html: response?.html || '',
      originalAnswer: response?.originalText || '',
      selectors: {
        tested: true,
        successful: response?.text ? true : false,
        selectorUsed: response?.selectorUsed || 'unknown'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// サーバ起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCPサーバが起動しました: http://localhost:${PORT}`);
});
