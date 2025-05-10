/**
 * Utility functions to support interaction with M5 AI FAE
 */
const { saveTextFile, saveHtmlFile, saveJsonFile } = require('./logger');

/**
 * Function to retrieve response text
 * @param {import('@playwright/test').Page} page Playwright page object
 * @returns {Promise<{text: string, html: string, selectorUsed: string, originalText: string}>} Retrieved text and HTML
 */
async function getLatestAIResponse(page) {
  // List of selectors to try - in priority order (prioritizing selectors verified effective in debugging)
  const responseSelectors = [
    // Selectors with verified effectiveness
    '.message.bot-message:last-child .message-text',
    '.message.bot-message:nth-last-child(1) .message-text',
    '.bot-message:last-child',
    // Other selectors (kept for reference)
    '.message.bot-message:nth-last-child(2) .message-text',
    '.chat-message-bot:last-child .chat-message-content',
    '.chat-message-bot:last-child',
    '.ai-message:last-child',
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
  
  // Try all selectors
  for (const selector of responseSelectors) {
    try {
      // Check if selector exists
      const exists = await page.$(selector);
      if (!exists) {
        console.log(`Selector "${selector}" does not exist`);
        continue;
      }
      
      // Get text content
      const text = await page.textContent(selector);
      if (text && text.trim() !== '' && text.length > 50) { // Consider as valid response only if length is more than 50 characters
        console.log(`Retrieved response text with selector "${selector}" (${text.length} characters)`);
        
        // Get HTML content as well
        const html = await page.evaluate(sel => {
          const element = document.querySelector(sel);
          return element ? element.innerHTML : '';
        }, selector);
        console.log(`Retrieved response HTML with selector "${selector}"`);
        
        // Remove "Thinking..." lines
        const cleanedText = text.trim()
          .split('\n')
          .filter(line => !line.trim().startsWith('考え中...'))
          .join('\n')
          .trim();
        
        return { 
          text: cleanedText, 
          html, 
          selectorUsed: selector,
          originalText: text.trim()
        };
      } else if (text) {
        console.log(`Text from selector "${selector}" is too short (${text.length} characters): ${text.substring(0, 30)}...`);
      }
    } catch (error) {
      console.log(`Failed to retrieve with selector "${selector}": ${error.message}`);
    }
  }
  
  // Last resort: Get detailed information about bot messages
  try {
    console.log('Failed to find with selectors, trying direct JavaScript exploration');
    const botMessages = await page.evaluate(() => {
      // Try multiple possible selector patterns
      const possibleSelectors = [
        '.message.bot-message',
        '.chat-message-bot',
        '.bot-message',
        '.ai-message',
        '.message[data-role="assistant"]',
        '.message[data-sender="bot"]'
      ];
      
      let messages = [];
      
      // Try each selector pattern
      for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          console.log(`Found ${elements.length} messages with ${selector}`);
          messages = Array.from(elements);
          break;
        }
      }
      
      // メッセージが見つからなかった場合は、より汎用的な方法で探す
      if (messages.length === 0) {
        console.log('汎用的な方法でメッセージを探索します');
        // すべてのdiv要素をチェックして、大きなテキストブロックを探す
        const allDivs = document.querySelectorAll('div');
        const potentialMessages = Array.from(allDivs).filter(div => {
          const text = div.textContent || '';
          return text.length > 100 && !div.querySelector('input, textarea, button');
        });
        
        if (potentialMessages.length > 0) {
          console.log(`${potentialMessages.length} 個の潜在的なメッセージを発見`);
          messages = potentialMessages;
        }
      }
      
      // メッセージをマップしてテキストとHTMLを取得
      const mappedMessages = messages.map(msg => {
        const id = msg.id || '';
        // テキストコンテンツを取得する複数の方法を試す
        let text = '';
        let html = '';
        
        // 特定のクラスを持つ子要素を探す
        const textElement = msg.querySelector('.message-text') || 
                           msg.querySelector('.chat-message-content') || 
                           msg.querySelector('.content');
        
        if (textElement) {
          text = textElement.textContent || '';
          html = textElement.innerHTML || '';
        } else {
          // 子要素がない場合は要素自体のテキストを使用
          text = msg.textContent || '';
          html = msg.innerHTML || '';
        }
        
        return { id, text: text.trim(), html };
      });
      
      // 短すぎるメッセージをフィルタリング
      const filteredMessages = mappedMessages.filter(msg => msg.text.length > 50);
      console.log(`${mappedMessages.length} 個のメッセージから ${filteredMessages.length} 個の有効なメッセージをフィルタリングしました`);
      
      return filteredMessages.length > 0 ? filteredMessages : mappedMessages;
    });
    
    if (botMessages.length > 0) {
      // 最も長いメッセージを選択（より完全な回答である可能性が高い）
      botMessages.sort((a, b) => b.text.length - a.text.length);
      const bestMessage = botMessages[0];
      console.log(`JavaScriptによる探索で ${botMessages.length} 個のメッセージを発見、最長の ${bestMessage.text.length} 文字のメッセージを選択`);
      
      // 「考え中...」の行を削除
      const cleanedText = bestMessage.text
        .split('\n')
        .filter(line => !line.trim().startsWith('考え中...'))
        .join('\n')
        .trim();
      
      return { 
        text: cleanedText, 
        html: bestMessage.html, 
        selectorUsed: 'javascript-exploration',
        originalText: bestMessage.text
      };
    } else {
      console.log('JavaScriptによる探索でもメッセージを発見できませんでした');
    }
  } catch (error) {
    console.error('ボットメッセージの取得中にエラーが発生しました:', error);
  }
  
  // すべての方法が失敗した場合は空の結果を返す
  console.log('すべての方法が失敗しました。空の結果を返します。');
  return { text: '', html: '', selectorUsed: 'none', originalText: '' };
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
 * @returns {Promise<Array<{id: string, text: string, html: string, originalText: string}>>} ボットメッセージの配列
 */
async function getBotMessages(page) {
  try {
    return await page.evaluate(() => {
      // 複数の可能性のあるセレクタパターンを試す
      const possibleSelectors = [
        '.message.bot-message',
        '.chat-message-bot',
        '.bot-message',
        '.ai-message',
        '.message[data-role="assistant"]',
        '.message[data-sender="bot"]'
      ];
      
      let messages = [];
      
      // 各セレクタパターンを試す
      for (const selector of possibleSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          console.log(`${selector} で ${elements.length} 個のメッセージを発見`);
          messages = Array.from(elements);
          break;
        }
      }
      
      // メッセージが見つからなかった場合は、より汎用的な方法で探す
      if (messages.length === 0) {
        console.log('汎用的な方法でメッセージを探索します');
        // すべてのdiv要素をチェックして、大きなテキストブロックを探す
        const allDivs = document.querySelectorAll('div');
        const potentialMessages = Array.from(allDivs).filter(div => {
          const text = div.textContent || '';
          return text.length > 100 && !div.querySelector('input, textarea, button');
        });
        
        if (potentialMessages.length > 0) {
          console.log(`${potentialMessages.length} 個の潜在的なメッセージを発見`);
          messages = potentialMessages;
        }
      }
      
      // メッセージをマップしてテキストとHTMLを取得
      const mappedMessages = messages.map(msg => {
        const id = msg.id || '';
        // テキストコンテンツを取得する複数の方法を試す
        let text = '';
        let html = '';
        
        // 特定のクラスを持つ子要素を探す
        const textElement = msg.querySelector('.message-text') || 
                           msg.querySelector('.chat-message-content') || 
                           msg.querySelector('.content');
        
        if (textElement) {
          text = textElement.textContent || '';
          html = textElement.innerHTML || '';
        } else {
          // 子要素がない場合は要素自体のテキストを使用
          text = msg.textContent || '';
          html = msg.innerHTML || '';
        }
        
        // 「考え中...」の行を削除
        const cleanedText = text.trim()
          .split('\n')
          .filter(line => !line.trim().startsWith('考え中...'))
          .join('\n')
          .trim();
        
        return { id, text: cleanedText, html, originalText: text.trim() };
      });
      
      // 短すぎるメッセージをフィルタリング
      const filteredMessages = mappedMessages.filter(msg => msg.text.length > 50);
      
      return filteredMessages.length > 0 ? filteredMessages : mappedMessages;
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
