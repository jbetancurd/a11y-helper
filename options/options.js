// Options page script
document.addEventListener('DOMContentLoaded', async () => {
  // Load current settings
  await loadSettings();
  
  // Text size slider
  const textSizeSlider = document.getElementById('text-size');
  const textSizeValue = document.getElementById('text-size-value');
  
  textSizeSlider.addEventListener('input', (e) => {
    textSizeValue.textContent = `${e.target.value}%`;
  });
  
  // Save settings button
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  
  // Reset settings button
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
});

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get([
      'textSize',
      'highContrast',
      'keyboardNav',
      'panelPosition',
      'panelVisible'
    ]);
    
    // Set form values
    document.getElementById('text-size').value = result.textSize || 100;
    document.getElementById('text-size-value').textContent = `${result.textSize || 100}%`;
    document.getElementById('high-contrast').checked = result.highContrast || false;
    document.getElementById('keyboard-nav').checked = result.keyboardNav || false;
    document.getElementById('panel-position').value = result.panelPosition || 'bottom-right';
    document.getElementById('panel-visible').checked = result.panelVisible !== false;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  try {
    const settings = {
      textSize: parseInt(document.getElementById('text-size').value),
      highContrast: document.getElementById('high-contrast').checked,
      keyboardNav: document.getElementById('keyboard-nav').checked,
      panelPosition: document.getElementById('panel-position').value,
      panelVisible: document.getElementById('panel-visible').checked
    };
    
    await chrome.storage.local.set(settings);
    
    // Show success message
    const message = document.getElementById('save-message');
    message.hidden = false;
    
    setTimeout(() => {
      message.hidden = true;
    }, 3000);
    
    // Reload all tabs to apply new settings
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.reload(tab.id);
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}

async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    const defaults = {
      textSize: 100,
      highContrast: false,
      keyboardNav: false,
      panelPosition: 'bottom-right',
      panelVisible: true
    };
    
    await chrome.storage.local.set(defaults);
    await loadSettings();
    
    // Show success message
    const message = document.getElementById('save-message');
    message.textContent = 'Settings reset to defaults!';
    message.hidden = false;
    
    setTimeout(() => {
      message.textContent = 'Settings saved successfully!';
      message.hidden = true;
    }, 3000);
  }
}
