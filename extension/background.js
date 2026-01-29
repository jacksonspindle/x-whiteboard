// X Whiteboard Background Service Worker

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAuthToken') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken || null });
    });
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'setAuthToken') {
    chrome.storage.local.set({ authToken: request.token }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'clearAuthToken') {
    chrome.storage.local.remove(['authToken'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[X Whiteboard] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[X Whiteboard] Extension updated');
  }
});
