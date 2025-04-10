// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  });
  
  // 监听快捷键命令
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-search') {
      try {
        // 获取当前活动标签页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          // 注入内容脚本（如果还没注入）
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content-script.js']
            });
          } catch (e) {
            // 忽略已经注入的错误
          }
          
          // 发送消息给内容脚本
          let retryCount = 0;
          const maxRetries = 10;
          
          const sendMessage = async () => {
            try {
              await chrome.tabs.sendMessage(tab.id, { action: 'SHOW_SEARCH' });
            } catch (e) {
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(sendMessage, 100);
              }
            }
          };
          
          await sendMessage();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  });