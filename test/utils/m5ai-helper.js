/**
 * M5 AI FAEとの対話を支援するユーティリティ関数
 */
const { saveTextFile, saveHtmlFile, saveJsonFile } = require('./logger');

/**
 * 回答テキストを取得する関数
 * @param {import('@playwright/test').Page} page Playwrightのページオブジェクト
 * @returns {Promise<{text: string, html: string}>} 取得したテキストとHTML
 */
async function getLatestAIResponse(page) {
  // 試行するセレクタのリスト
  const responseSelectors = [
    '.message.bot-message:last-child .message-text',
    '.message.bot-message:nth-last-child(1) .message-text',
    '.message.bot-message:nth-last-child(2) .message-text',
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
  
  // すべてのセレクタを試行
  for (const selector of responseSelectors) {
    try {
      const text = await page.textContent(selector);
      if (text && text.trim() !== '' && text.length > 100) { // 長さが100文字以上の場合のみ有効な回答と見なす
        console.log(`セレクタ "${selector}" で回答テキストを取得しました`);
        
        // HTMLコンテンツも取得
        const html = await page.evaluate(sel => {
          const element = document.querySelector(sel);
          return element ? element.innerHTML : '';
        }, selector);
        console.log(`セレクタ "${selector}" で回答HTMLを取得しました`);
        
        return { text: text.trim(), html };
      }
    } catch (error) {
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
  } catch (error) {
    console.error('ボットメッセージの取得中にエラーが発生しました:', error);
  }
  
  return { text: '', html: '' };
}

/**
 * 提案された質問をクリックして追加の回答を取得する関数
 * @param {import('@playwright/test').Page} page Playwrightのページオブジェクト
 * @param {number} questionIndex クリックする質問のインデックス（デフォルト: 0）
 * @param {string} timestamp タイムスタンプ
 * @returns {Promise<{text: string, html: string} | null>} 取得した回答またはnull
 */
async function clickSuggestedQuestion(page, questionIndex = 0, timestamp) {
  try {
    const suggestedQuestions = await page.$$('.suggested-question');
    
    if (suggestedQuestions.length > 0 && questionIndex < suggestedQuestions.length) {
      // 質問のテキストを取得
      const questionText = await suggestedQuestions[questionIndex].textContent();
      console.log(`提案された質問をクリックします: ${questionText}`);
      
      // 質問をクリック
      await suggestedQuestions[questionIndex].click();
      console.log('提案された質問をクリックしました');
      
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
      
      // 新しい回答を取得
      const followUpResponse = await getLatestAIResponse(page);
      
      // 回答をファイルに保存
      if (followUpResponse.text) {
        saveTextFile(followUpResponse.text, 'm5ai_followup_response', timestamp);
        
        if (followUpResponse.html) {
          saveHtmlFile(followUpResponse.html, 'm5ai_followup_response_html', timestamp);
        }
      }
      
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

/**
 * ボットメッセージの詳細情報を取得する関数
 * @param {import('@playwright/test').Page} page Playwrightのページオブジェクト
 * @returns {Promise<Array<{id: string, text: string, html: string}>>} ボットメッセージの配列
 */
async function getBotMessages(page) {
  try {
    return await page.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('.message.bot-message'));
      return messages.map(msg => {
        const id = msg.id;
        const text = msg.querySelector('.message-text')?.textContent || '';
        const html = msg.querySelector('.message-text')?.innerHTML || '';
        return { id, text, html };
      });
    });
  } catch (error) {
    console.error('ボットメッセージの取得中にエラーが発生しました:', error);
    return [];
  }
}

module.exports = {
  getLatestAIResponse,
  clickSuggestedQuestion,
  getBotMessages
};
