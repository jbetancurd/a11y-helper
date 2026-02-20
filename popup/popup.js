// Popup script
document.addEventListener('DOMContentLoaded', () => {
  // Toggle panel button
  document.getElementById('toggle-panel').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const panel = document.getElementById('a11y-floating-panel');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
      }
    });
    
    window.close();
  });
  
  // Open options button
  document.getElementById('open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
