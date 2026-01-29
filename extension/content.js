// X Whiteboard Content Script
// Injects "Add to Whiteboard" buttons on X/Twitter posts

(function () {
  'use strict';

  const API_URL = 'http://localhost:3002/api/posts';
  const BUTTON_CLASS = 'x-whiteboard-btn';
  const PROCESSED_ATTR = 'data-x-whiteboard-processed';

  // SVG icons
  const ICONS = {
    add: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`,
    loading: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>`,
  };

  // Show toast notification
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.x-whiteboard-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `x-whiteboard-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  // Extract tweet data from article element
  function extractTweetData(article) {
    const data = {
      tweet_id: null,
      tweet_url: null,
      author_handle: null,
      author_name: null,
      author_avatar: null,
      content: null,
      media: [],
    };

    try {
      // Get tweet URL and ID from the time element link
      const timeLink = article.querySelector('a[href*="/status/"] time');
      if (timeLink) {
        const linkElement = timeLink.closest('a');
        if (linkElement) {
          data.tweet_url = linkElement.href;
          const match = data.tweet_url.match(/\/status\/(\d+)/);
          if (match) {
            data.tweet_id = match[1];
          }
        }
      }

      // Fallback: try to find any status link
      if (!data.tweet_id) {
        const statusLinks = article.querySelectorAll('a[href*="/status/"]');
        for (const link of statusLinks) {
          const match = link.href.match(/\/status\/(\d+)/);
          if (match) {
            data.tweet_id = match[1];
            data.tweet_url = link.href;
            break;
          }
        }
      }

      // Get author info
      const userLinks = article.querySelectorAll('a[href^="/"][role="link"]');
      for (const link of userLinks) {
        const href = link.getAttribute('href');
        if (href && href.match(/^\/[a-zA-Z0-9_]+$/) && !href.includes('/status/')) {
          data.author_handle = href.substring(1);
          break;
        }
      }

      // Get author name
      const nameElement = article.querySelector('[data-testid="User-Name"]');
      if (nameElement) {
        const spans = nameElement.querySelectorAll('span');
        for (const span of spans) {
          const text = span.textContent?.trim();
          if (text && !text.startsWith('@') && text.length > 0) {
            data.author_name = text;
            break;
          }
        }
      }

      // Get avatar
      const avatar = article.querySelector('img[src*="profile_images"]');
      if (avatar) {
        data.author_avatar = avatar.src;
      }

      // Get tweet content
      const tweetText = article.querySelector('[data-testid="tweetText"]');
      if (tweetText) {
        data.content = tweetText.textContent?.trim() || null;
      }

      // Get media (images and videos)
      const images = article.querySelectorAll('[data-testid="tweetPhoto"] img');
      images.forEach((img) => {
        if (img.src && !img.src.includes('profile_images')) {
          data.media.push({
            type: 'image',
            url: img.src,
          });
        }
      });

      const videos = article.querySelectorAll('[data-testid="videoPlayer"] video');
      videos.forEach((video) => {
        if (video.src) {
          data.media.push({
            type: 'video',
            url: video.src,
            thumbnail: video.poster || null,
          });
        }
      });
    } catch (error) {
      console.error('[X Whiteboard] Error extracting tweet data:', error);
    }

    return data;
  }

  // Create the add button
  function createButton() {
    const btn = document.createElement('button');
    btn.className = BUTTON_CLASS;
    btn.innerHTML = ICONS.add;
    btn.title = 'Add to X Whiteboard';
    return btn;
  }

  // Handle button click
  async function handleAddToWhiteboard(btn, article) {
    if (btn.classList.contains('loading') || btn.classList.contains('success')) {
      return;
    }

    btn.classList.add('loading');
    btn.innerHTML = ICONS.loading;

    try {
      // Get auth token from storage
      const result = await chrome.storage.local.get(['authToken']);
      const token = result.authToken;

      if (!token) {
        showToast('Please login in the extension popup first', 'error');
        btn.classList.remove('loading');
        btn.innerHTML = ICONS.add;
        return;
      }

      const tweetData = extractTweetData(article);

      if (!tweetData.tweet_id) {
        showToast('Could not extract tweet data', 'error');
        btn.classList.remove('loading');
        btn.innerHTML = ICONS.add;
        return;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tweetData),
      });

      const data = await response.json();

      if (response.ok) {
        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = ICONS.check;
        showToast('Added to whiteboard!', 'success');
      } else if (response.status === 409) {
        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = ICONS.check;
        showToast('Already on whiteboard', 'info');
      } else if (response.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        chrome.storage.local.remove(['authToken']);
        btn.classList.remove('loading');
        btn.innerHTML = ICONS.add;
      } else {
        throw new Error(data.error || 'Failed to add post');
      }
    } catch (error) {
      console.error('[X Whiteboard] Error:', error);
      showToast(error.message || 'Failed to add post', 'error');
      btn.classList.remove('loading');
      btn.innerHTML = ICONS.add;
    }
  }

  // Find the action bar in a tweet and inject our button
  function injectButton(article) {
    if (article.hasAttribute(PROCESSED_ATTR)) {
      return;
    }
    article.setAttribute(PROCESSED_ATTR, 'true');

    // Find the action bar (reply, retweet, like, share buttons)
    const actionBar = article.querySelector('[role="group"]');
    if (!actionBar) {
      return;
    }

    // Check if we already added a button
    if (actionBar.querySelector(`.${BUTTON_CLASS}`)) {
      return;
    }

    const btn = createButton();
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleAddToWhiteboard(btn, article);
    });

    // Insert before the last child (usually the share button)
    const lastChild = actionBar.lastElementChild;
    if (lastChild) {
      actionBar.insertBefore(btn, lastChild);
    } else {
      actionBar.appendChild(btn);
    }
  }

  // Process all tweets on the page
  function processPage() {
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    articles.forEach(injectButton);
  }

  // Initialize
  function init() {
    // Process existing tweets
    processPage();

    // Watch for new tweets loaded dynamically
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }
      if (shouldProcess) {
        processPage();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('[X Whiteboard] Extension initialized');
  }

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
