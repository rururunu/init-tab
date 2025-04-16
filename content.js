// 添加书签搜索功能
function searchBookmarks() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  
  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) {
      searchResults.innerHTML = '';
      return;
    }

    const bookmarks = await chrome.bookmarks.search({});
    const results = bookmarks.filter(bookmark => {
      const title = bookmark.title.toLowerCase();
      const url = bookmark.url?.toLowerCase() || '';
      
      // 使用 pinyin 进行拼音搜索
      const pinyinTitle = pinyin(title, { style: pinyin.STYLE_NORMAL }).join('');
      const pinyinUrl = pinyin(url, { style: pinyin.STYLE_NORMAL }).join('');
      
      return title.includes(query) || 
             url.includes(query) || 
             pinyinTitle.includes(query) || 
             pinyinUrl.includes(query);
    });

    searchResults.innerHTML = results.map(bookmark => `
      <div class="bookmark-item">
        <a href="${bookmark.url}" target="_blank">
          <div class="bookmark-title">${bookmark.title}</div>
          <div class="bookmark-url">${bookmark.url}</div>
        </a>
      </div>
    `).join('');
  });
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
  .bookmark-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
  }
  
  .bookmark-item a {
    text-decoration: none;
    color: inherit;
  }
  
  .bookmark-title {
    font-weight: bold;
  }
  
  .bookmark-url {
    font-size: 0.8em;
    color: #666;
  }
  
  #searchResults {
    max-height: 300px;
    overflow-y: auto;
  }
`;
document.head.appendChild(style);

// 初始化搜索功能
searchBookmarks(); 