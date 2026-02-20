// Background service worker
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      textSize: 100,
      highContrast: false,
      keyboardNav: false,
      panelPosition: 'bottom-right',
      panelVisible: true
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html')
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openOptions') {
    chrome.runtime.openOptionsPage();
  }
});
