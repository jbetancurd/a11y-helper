// Main content script - Entry point for the accessibility helper
// This script runs on every page and initializes the floating panel

(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.a11yHelperInjected) {
    return;
  }
  window.a11yHelperInjected = true;

  class AccessibilityPanel {
    constructor() {
      this.panel = null;
      this.isExpanded = false;
      this.isDragging = false;
      this.position = 'bottom-right';
      this.score = 0;
      this.settings = {
        textSize: 100,
        highContrast: false,
        contrastLevel: 0, // 0=off, 1=low, 2=medium, 3=high
        keyboardNav: false,
        highlightLinks: false,
        panelVisible: true,
        panelTheme: 'light', // 'light' or 'dark'
        voiceControl: false,
        pageZoom: 100, // 50-200%
        readingSpeed: 1.0 // 0.5-2.0 (slow to fast, 1.0 is normal)
      };
      this.currentUtterance = null;
      this.speechProgress = 0;
      this.recognition = null;
      this.isListening = false;
      this.gestureRecognition = null;
      this.isGestureActive = false;
      this.videoElement = null;
      this.canvasElement = null;
      this.handTrackModel = null;
      this.lastGestureTime = null;
      this.cooldownShown = false;
      this.lastCooldownValue = null;
    }
    
    async init() {
      // Load saved settings
      await this.loadSettings();
      
      // Create and inject panel
      this.create();
      
      // Analyze page after short delay
      setTimeout(() => this.analyzePage(), 2000);
      
      // Listen for keyboard shortcuts
      this.setupKeyboardShortcuts();
    }
    
    async loadSettings() {
      try {
        const result = await chrome.storage.local.get([
          'textSize',
          'highContrast',
          'contrastLevel',
          'keyboardNav',
          'highlightLinks',
          'panelPosition',
          'panelVisible',
          'panelTheme',
          'pageZoom',
          'readingSpeed'
        ]);
        
        this.settings = {
          textSize: result.textSize || 100,
          highContrast: result.highContrast || false,
          contrastLevel: result.contrastLevel || 0, // Default to 0 (OFF)
          keyboardNav: result.keyboardNav || false,
          highlightLinks: result.highlightLinks || false,
          panelVisible: result.panelVisible !== false,
          panelTheme: result.panelTheme || 'light',
          pageZoom: result.pageZoom || 100,
          readingSpeed: result.readingSpeed || 1.0,
          gestureControl: false
        };
        
        this.position = result.panelPosition || 'bottom-right';
        
        // Apply saved settings
        if (this.settings.textSize !== 100) {
          this.applyTextSize(this.settings.textSize);
        }
        if (this.settings.pageZoom !== 100) {
          this.applyPageZoom(this.settings.pageZoom);
        }
        if (this.settings.contrastLevel > 0) {
          this.applyHighContrast(this.settings.contrastLevel);
        }
        if (this.settings.keyboardNav) {
          this.applyKeyboardNav(true);
        }
        if (this.settings.highlightLinks) {
          this.applyHighlightLinks(true);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    
    async saveSettings() {
      try {
        await chrome.storage.local.set({
          textSize: this.settings.textSize,
          highContrast: this.settings.highContrast,
          contrastLevel: this.settings.contrastLevel,
          keyboardNav: this.settings.keyboardNav,
          panelPosition: this.position,
          panelVisible: this.settings.panelVisible,
          panelTheme: this.settings.panelTheme,
          pageZoom: this.settings.pageZoom,
          readingSpeed: this.settings.readingSpeed
        });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
    
    create() {
      // Create panel container
      this.panel = document.createElement('div');
      this.panel.id = 'a11y-floating-panel';
      this.panel.setAttribute('role', 'complementary');
      this.panel.setAttribute('aria-label', 'Accessibility Helper Panel');
      
      // Create panel HTML
      this.panel.innerHTML = `
        <button 
          class="panel-minimized"
          aria-label="Accessibility Helper, Page score ${this.score}%, Click to expand"
          aria-expanded="false"
          title="Accessibility score: ${this.score}% - Click to see details">
          <span class="panel-logo" aria-hidden="true"><span class="emoji-box">🐕‍🦺</span> A11y</span>
          <span class="panel-score" aria-label="Score ${this.score} percent">${this.score}%</span>
          <span class="panel-arrow" aria-hidden="true">▼</span>
          <span class="keyboard-hint" aria-hidden="true">${this.getKeyboardShortcutText()}</span>
        </button>
        
        <div class="panel-expanded" hidden role="dialog" aria-labelledby="panel-title">
          <div class="panel-header">
            <h2 id="panel-title">Accessibility Helper</h2>
            <div class="panel-header-buttons">
              <button class="panel-theme-toggle" aria-label="Toggle panel theme" title="Switch between light and dark theme">
                <span aria-hidden="true">🌓</span>
              </button>
              <button class="panel-close" aria-label="Close panel" aria-keyshortcuts="Escape">
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
          
          <div class="panel-score-display" role="status">
            <div class="score-title">Accessibility Score</div>
            <div class="score-value">
              <strong>${this.score}%</strong>
              <span class="score-label">Analyzing...</span>
            </div>
            <div class="score-description">
              This score shows how accessible this page is for people with disabilities. 
              Higher scores mean fewer accessibility issues.
            </div>
          </div>
          
          <div class="panel-controls">
            <fieldset>
              <legend>Quick Controls</legend>
              
              <div class="control-group">
                <label id="text-size-label"><span class="control-number">1.</span> Text Size</label>
                <div class="control-buttons" role="group" aria-labelledby="text-size-label">
                  <button class="btn-decrease" aria-label="Decrease text size" title="Decrease text size">
                    <span aria-hidden="true">−</span>
                  </button>
                  <span class="text-size-value" aria-live="polite">${this.settings.textSize}%</span>
                  <button class="btn-increase" aria-label="Increase text size" title="Increase text size">
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              </div>
              
              <div class="control-group">
                <label id="page-zoom-label"><span class="control-number">2.</span> Page Zoom</label>
                <div class="control-buttons" role="group" aria-labelledby="page-zoom-label">
                  <button class="btn-zoom-out" aria-label="Zoom out" title="Zoom out page">
                    <span aria-hidden="true">−</span>
                  </button>
                  <span class="page-zoom-value" aria-live="polite">${this.settings.pageZoom}%</span>
                  <button class="btn-zoom-in" aria-label="Zoom in" title="Zoom in page">
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              </div>
              
              <div class="control-group">
                <label id="contrast-label"><span class="control-number">3.</span> Contrast Level</label>
                <div class="control-toggle">
                  <span class="toggle-status">Currently: <strong>OFF</strong></span>
                  <button 
                    class="btn-toggle-contrast"
                    role="button"
                    aria-labelledby="contrast-label">
                    Cycle Contrast
                  </button>
                </div>
              </div>
              
              <div class="control-group">
                <label id="keyboard-label"><span class="control-number">4.</span> Keyboard Navigation</label>
                <div class="control-toggle">
                  <span class="toggle-status">Currently: <strong>${this.settings.keyboardNav ? 'ON' : 'OFF'}</strong></span>
                  <button 
                    class="btn-toggle-keyboard"
                    role="switch"
                    aria-checked="${this.settings.keyboardNav}"
                    aria-labelledby="keyboard-label">
                    ${this.settings.keyboardNav ? 'Turn OFF' : 'Turn ON'}
                  </button>
                </div>
              </div>
              
              <div class="control-group">
                <label id="read-aloud-label"><span class="control-number">5.</span> Read Page Aloud</label>
                <div class="reading-speed-control">
                  <label id="reading-speed-label">Reading Speed</label>
                  <div class="control-buttons" role="group" aria-labelledby="reading-speed-label">
                    <button class="btn-speed-slower" aria-label="Slower reading speed" title="Slower reading speed">
                      <span aria-hidden="true">−</span>
                    </button>
                    <span class="reading-speed-value" aria-live="polite">${this.getSpeedLabel(this.settings.readingSpeed)}</span>
                    <button class="btn-speed-faster" aria-label="Faster reading speed" title="Faster reading speed">
                      <span aria-hidden="true">+</span>
                    </button>
                  </div>
                </div>
                <div class="read-aloud-progress" style="display: none;">
                  <div class="progress-bar">
                    <div class="progress-fill" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <div class="progress-text">0%</div>
                </div>
                <div class="read-aloud-controls">
                  <button class="action-button btn-read-aloud" aria-labelledby="read-aloud-label">
                    <span aria-hidden="true">▶</span> Start Reading
                  </button>
                  <button class="action-button-secondary btn-stop-reading" aria-label="Stop reading" style="display: none;">
                    <span aria-hidden="true">⏹</span> Stop
                  </button>
                </div>
              </div>
              
              <div class="control-group">
                <label id="link-finder-label"><span class="control-number">6.</span> Find & Navigate Links</label>
                <button class="action-button btn-link-finder" aria-labelledby="link-finder-label">
                  <span aria-hidden="true">🔍</span> Open Link Finder
                </button>
              </div>
              
              <div class="control-group">
                <label id="voice-label"><span class="control-number">7.</span> Voice Commands (Experimental)</label>
                <div class="control-toggle">
                  <span class="toggle-status">Currently: <strong>OFF</strong></span>
                  <button 
                    class="btn-toggle-voice"
                    role="switch"
                    aria-checked="false"
                    aria-labelledby="voice-label">
                    Turn ON
                  </button>
                </div>
              </div>
            </fieldset>
          </div>
          
          <div class="panel-tip" role="status" aria-live="polite" aria-atomic="true">
            <div class="tip-icon" aria-hidden="true">💡</div>
            <div class="tip-content">
              <p class="tip-message">Analyzing page...</p>
              <div class="tip-actions" role="group" aria-label="Tip actions"></div>
            </div>
          </div>
          
          <div class="panel-footer">
            <button class="settings-button">
              <span aria-hidden="true">⚙️</span> More Settings
            </button>
            <button class="reset-button">
              <span aria-hidden="true">↺</span> Reset All Settings
            </button>
          </div>
        </div>
      `;
      
      // Apply positioning
      this.applyPosition();
      
      // Add event listeners
      this.attachEventListeners();
      
      // Inject into page
      document.body.appendChild(this.panel);
      
      // Update contrast button to reflect loaded settings
      this.updateContrastButton();
      
      // Apply panel theme
      this.applyPanelTheme(this.settings.panelTheme);
      
      // Hide if user preference
      if (!this.settings.panelVisible) {
        this.panel.style.display = 'none';
      }
    }
    
    updateContrastButton() {
      const btn = this.panel.querySelector('.btn-toggle-contrast');
      const status = btn?.previousElementSibling?.querySelector('strong');
      
      if (btn && status) {
        const levels = ['OFF', 'Low', 'Medium', 'High'];
        status.textContent = levels[this.settings.contrastLevel];
      }
    }
    
    togglePanelTheme() {
      this.settings.panelTheme = this.settings.panelTheme === 'light' ? 'dark' : 'light';
      this.applyPanelTheme(this.settings.panelTheme);
      this.saveSettings();
    }
    
    applyPanelTheme(theme) {
      if (theme === 'dark') {
        this.panel.classList.add('theme-dark');
        this.panel.classList.remove('theme-light');
      } else {
        this.panel.classList.add('theme-light');
        this.panel.classList.remove('theme-dark');
      }
    }
    
    applyPosition() {
      const positions = {
        'top-left': { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
        'top-right': { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
        'bottom-left': { bottom: '20px', left: '20px', right: 'auto', top: 'auto' },
        'bottom-right': { bottom: '20px', right: '20px', left: 'auto', top: 'auto' }
      };
      
      const pos = positions[this.position];
      Object.assign(this.panel.style, {
        position: 'fixed',
        zIndex: '2147483647', // Maximum z-index
        ...pos
      });
    }
    
    attachEventListeners() {
      // Toggle expand/collapse
      const minimized = this.panel.querySelector('.panel-minimized');
      minimized.addEventListener('click', () => this.toggle());
      minimized.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });
      
      // Close button
      const closeBtn = this.panel.querySelector('.panel-close');
      closeBtn.addEventListener('click', () => this.collapse());
      
      // Theme toggle button
      const themeBtn = this.panel.querySelector('.panel-theme-toggle');
      themeBtn.addEventListener('click', () => this.togglePanelTheme());
      
      // Text size controls
      const decreaseBtn = this.panel.querySelector('.btn-decrease');
      const increaseBtn = this.panel.querySelector('.btn-increase');
      
      console.log('Text size buttons found:', { decreaseBtn, increaseBtn });
      
      decreaseBtn.addEventListener('click', () => {
        console.log('Decrease button clicked');
        this.adjustTextSize(-10);
      });
      increaseBtn.addEventListener('click', () => {
        console.log('Increase button clicked');
        this.adjustTextSize(10);
      });
      
      // High contrast toggle
      const contrastBtn = this.panel.querySelector('.btn-toggle-contrast');
      contrastBtn.addEventListener('click', () => this.toggleHighContrast());
      
      // Keyboard navigation toggle
      const keyboardBtn = this.panel.querySelector('.btn-toggle-keyboard');
      keyboardBtn.addEventListener('click', () => this.toggleKeyboardNav());
      
      // Voice control toggle
      const voiceBtn = this.panel.querySelector('.btn-toggle-voice');
      voiceBtn.addEventListener('click', () => this.toggleVoiceControl());
      
      // Read aloud button
      const readBtn = this.panel.querySelector('.btn-read-aloud');
      readBtn.addEventListener('click', () => this.readAloud());
      
      // Stop reading button
      const stopBtn = this.panel.querySelector('.btn-stop-reading');
      stopBtn.addEventListener('click', () => this.stopReading());
      
      // Reading speed controls
      const slowerBtn = this.panel.querySelector('.btn-speed-slower');
      const fasterBtn = this.panel.querySelector('.btn-speed-faster');
      
      slowerBtn.addEventListener('click', () => this.adjustReadingSpeed(-0.1));
      fasterBtn.addEventListener('click', () => this.adjustReadingSpeed(0.1));
      
      // Link finder button
      const linkFinderBtn = this.panel.querySelector('.btn-link-finder');
      if (linkFinderBtn) {
        linkFinderBtn.addEventListener('click', () => {
          console.log('Link finder button clicked');
          this.openLinkFinder();
        });
      } else {
        console.error('Link finder button not found');
      }
      
      // Page zoom controls
      const zoomOutBtn = this.panel.querySelector('.btn-zoom-out');
      const zoomInBtn = this.panel.querySelector('.btn-zoom-in');
      
      zoomOutBtn.addEventListener('click', () => this.adjustPageZoom(-10));
      zoomInBtn.addEventListener('click', () => this.adjustPageZoom(10));
      
      // Settings button
      const settingsBtn = this.panel.querySelector('.settings-button');
      settingsBtn.addEventListener('click', () => this.openSettings());
      
      // Reset button
      const resetBtn = this.panel.querySelector('.reset-button');
      resetBtn.addEventListener('click', () => this.resetAllSettings());
    }
    
    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // F6 key to toggle panel expand/collapse
        if (e.key === 'F6') {
          e.preventDefault();
          
          // If panel is hidden, show it
          if (!this.settings.panelVisible) {
            this.toggleVisibility();
          } else {
            // If panel is visible, toggle expand/collapse
            this.toggle();
          }
        }
        
        // Escape to close panel if expanded
        if (e.key === 'Escape' && this.isExpanded) {
          this.collapse();
        }
      });
    }
    
    getKeyboardShortcutText() {
      return 'F6';
    }
    
    toggle() {
      if (this.isExpanded) {
        this.collapse();
      } else {
        this.expand();
      }
    }
    
    expand() {
      this.isExpanded = true;
      const minimized = this.panel.querySelector('.panel-minimized');
      const expanded = this.panel.querySelector('.panel-expanded');
      
      minimized.hidden = true;
      minimized.setAttribute('aria-expanded', 'true');
      expanded.hidden = false;
      this.panel.classList.add('expanded');
      
      // Focus first interactive element
      const firstButton = expanded.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }
    
    collapse() {
      this.isExpanded = false;
      const minimized = this.panel.querySelector('.panel-minimized');
      const expanded = this.panel.querySelector('.panel-expanded');
      
      minimized.hidden = false;
      minimized.setAttribute('aria-expanded', 'false');
      expanded.hidden = true;
      this.panel.classList.remove('expanded');
    }
    
    toggleVisibility() {
      this.settings.panelVisible = !this.settings.panelVisible;
      this.panel.style.display = this.settings.panelVisible ? 'block' : 'none';
      this.saveSettings();
    }
    
    adjustTextSize(delta) {
      this.settings.textSize = Math.max(50, Math.min(200, this.settings.textSize + delta));
      console.log('Adjusting text size to:', this.settings.textSize);
      this.applyTextSize(this.settings.textSize);
      
      // Update display
      const valueSpan = this.panel.querySelector('.text-size-value');
      if (valueSpan) {
        valueSpan.textContent = `${this.settings.textSize}%`;
      }
      
      this.saveSettings();
    }
    
    applyTextSize(size) {
      console.log('Applying text size:', size);
      
      // Apply to both body and wrapper (if it exists)
      const wrapper = document.getElementById('a11y-page-wrapper');
      
      if (size !== 100) {
        // Apply to body
        document.body.style.fontSize = `${size}%`;
        
        // Also apply to wrapper if it exists
        if (wrapper) {
          wrapper.style.fontSize = `${size}%`;
        }
        
        // Also apply to html element for better coverage
        document.documentElement.style.fontSize = `${size}%`;
      } else {
        // Reset to default
        document.body.style.fontSize = '';
        if (wrapper) {
          wrapper.style.fontSize = '';
        }
        document.documentElement.style.fontSize = '';
      }
      
      console.log('Text size applied successfully');
    }
    
    adjustPageZoom(delta) {
      this.settings.pageZoom = Math.max(50, Math.min(200, this.settings.pageZoom + delta));
      this.applyPageZoom(this.settings.pageZoom);
      
      // Update display
      const valueSpan = this.panel.querySelector('.page-zoom-value');
      valueSpan.textContent = `${this.settings.pageZoom}%`;
      
      this.saveSettings();
    }
    
    adjustReadingSpeed(delta) {
      this.settings.readingSpeed = Math.max(0.5, Math.min(2.0, this.settings.readingSpeed + delta));
      this.settings.readingSpeed = Math.round(this.settings.readingSpeed * 10) / 10; // Round to 1 decimal
      
      // Update display
      const valueSpan = this.panel.querySelector('.reading-speed-value');
      valueSpan.textContent = this.getSpeedLabel(this.settings.readingSpeed);
      
      this.saveSettings();
    }
    
    getSpeedLabel(speed) {
      if (speed <= 0.7) return 'Very Slow';
      if (speed <= 0.9) return 'Slow';
      if (speed <= 1.1) return 'Normal';
      if (speed <= 1.5) return 'Fast';
      return 'Very Fast';
    }
    
    applyPageZoom(zoom) {
      // Create a wrapper for page content if it doesn't exist
      let wrapper = document.getElementById('a11y-page-wrapper');
      
      if (!wrapper && zoom !== 100) {
        // Create wrapper
        wrapper = document.createElement('div');
        wrapper.id = 'a11y-page-wrapper';
        
        // Move all body children except our panel into the wrapper
        const children = Array.from(document.body.children);
        children.forEach(child => {
          if (child.id !== 'a11y-floating-panel' && child.id !== 'a11y-link-finder') {
            wrapper.appendChild(child);
          }
        });
        
        // Add wrapper to body
        document.body.insertBefore(wrapper, document.body.firstChild);
      }
      
      if (wrapper) {
        if (zoom === 100) {
          // Remove zoom
          wrapper.style.transform = '';
          wrapper.style.transformOrigin = '';
          wrapper.style.width = '';
          wrapper.style.height = '';
        } else {
          // Apply zoom to wrapper only
          wrapper.style.transform = `scale(${zoom / 100})`;
          wrapper.style.transformOrigin = 'top left';
          wrapper.style.width = `${10000 / zoom}%`;
          wrapper.style.height = `${10000 / zoom}%`;
        }
      }
    }
    
    toggleHighContrast() {
      // Cycle through contrast levels: 0 (off) -> 1 (low) -> 2 (medium) -> 3 (high) -> 0
      this.settings.contrastLevel = (this.settings.contrastLevel + 1) % 4;
      this.applyHighContrast(this.settings.contrastLevel);
      
      // Update button
      const btn = this.panel.querySelector('.btn-toggle-contrast');
      const status = btn.previousElementSibling.querySelector('strong');
      
      const levels = ['OFF', 'Low', 'Medium', 'High'];
      status.textContent = levels[this.settings.contrastLevel];
      
      this.saveSettings();
    }
    
    applyHighContrast(level) {
      // Remove all contrast classes
      document.documentElement.classList.remove('a11y-high-contrast', 'a11y-contrast-low', 'a11y-contrast-medium', 'a11y-contrast-high');
      
      // Apply appropriate class based on level
      if (level === 1) {
        document.documentElement.classList.add('a11y-contrast-low');
      } else if (level === 2) {
        document.documentElement.classList.add('a11y-contrast-medium');
      } else if (level === 3) {
        document.documentElement.classList.add('a11y-high-contrast');
      }
      // level 0 = no class = off
    }
    
    toggleKeyboardNav() {
      this.settings.keyboardNav = !this.settings.keyboardNav;
      this.applyKeyboardNav(this.settings.keyboardNav);
      
      // Update button
      const btn = this.panel.querySelector('.btn-toggle-keyboard');
      const status = btn.previousElementSibling.querySelector('strong');
      
      btn.setAttribute('aria-checked', this.settings.keyboardNav);
      btn.textContent = this.settings.keyboardNav ? 'Turn OFF' : 'Turn ON';
      status.textContent = this.settings.keyboardNav ? 'ON' : 'OFF';
      
      this.saveSettings();
    }
    
    applyKeyboardNav(enabled) {
      if (enabled) {
        document.documentElement.classList.add('a11y-keyboard-nav');
        // Make non-keyboard-accessible elements accessible
        this.makeElementsKeyboardAccessible();
      } else {
        document.documentElement.classList.remove('a11y-keyboard-nav');
        // Remove keyboard accessibility enhancements
        this.removeKeyboardAccessibility();
      }
    }
    
    makeElementsKeyboardAccessible() {
      // Find clickable elements that aren't keyboard accessible
      const clickableSelectors = [
        'div[onclick]',
        'span[onclick]',
        'div[role="button"]:not([tabindex])',
        'span[role="button"]:not([tabindex])',
        '[onclick]:not(a):not(button):not(input):not([tabindex])',
        // Navigation and menu items
        'nav a:not([tabindex])',
        'nav div:not([tabindex])',
        'nav span:not([tabindex])',
        'nav li:not([tabindex])',
        'nav button:not([tabindex])',
        '[class*="menu"] a:not([tabindex])',
        '[class*="menu"] li:not([tabindex])',
        '[class*="menu"] button:not([tabindex])',
        '[class*="nav"] a:not([tabindex])',
        '[class*="nav"] li:not([tabindex])',
        '[class*="dropdown"] a:not([tabindex])',
        '[class*="dropdown"] li:not([tabindex])',
        // Common interactive elements
        '[class*="button"]:not(button):not([tabindex])',
        '[class*="link"]:not(a):not([tabindex])',
        '[class*="clickable"]:not([tabindex])',
        // Elements with cursor pointer
        '*[style*="cursor: pointer"]:not([tabindex])',
        '*[style*="cursor:pointer"]:not([tabindex])'
      ];
      
      clickableSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            // Skip if already keyboard accessible or is our panel
            if (element.hasAttribute('tabindex') || 
                element.hasAttribute('data-a11y-keyboard') ||
                element.closest('#a11y-floating-panel')) {
              return;
            }
            
            // Make it keyboard accessible
            element.setAttribute('tabindex', '0');
            element.setAttribute('data-a11y-keyboard', 'true');
            
            // Add keyboard event listener
            const keyHandler = (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                
                // Try to trigger click
                element.click();
                
                // If it's a link, also try to navigate
                if (element.tagName === 'A' && element.href) {
                  window.location.href = element.href;
                }
              }
              
              // Handle dropdown menus with arrow keys
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.handleDropdownNavigation(element, e.key);
              }
            };
            
            // Add focus handler to simulate hover
            const focusHandler = () => {
              // Move mouse pointer to element (simulate hover)
              const rect = element.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              
              // Dispatch mouse events to trigger hover effects
              const mouseOver = new MouseEvent('mouseover', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: centerX,
                clientY: centerY
              });
              
              const mouseEnter = new MouseEvent('mouseenter', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: centerX,
                clientY: centerY
              });
              
              element.dispatchEvent(mouseOver);
              element.dispatchEvent(mouseEnter);
            };
            
            const blurHandler = () => {
              // Remove hover effect after a delay
              setTimeout(() => {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const mouseOut = new MouseEvent('mouseout', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                  clientX: centerX,
                  clientY: centerY
                });
                
                const mouseLeave = new MouseEvent('mouseleave', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                  clientX: centerX,
                  clientY: centerY
                });
                
                element.dispatchEvent(mouseOut);
                element.dispatchEvent(mouseLeave);
              }, 300);
            };
            
            element.addEventListener('keydown', keyHandler);
            element.addEventListener('focus', focusHandler);
            element.addEventListener('blur', blurHandler);
            
            element._a11yKeyHandler = keyHandler;
            element._a11yFocusHandler = focusHandler;
            element._a11yBlurHandler = blurHandler;
            
            // Add role if missing
            if (!element.hasAttribute('role')) {
              if (element.tagName === 'A') {
                element.setAttribute('role', 'link');
              } else if (element.tagName === 'LI') {
                element.setAttribute('role', 'menuitem');
              } else {
                element.setAttribute('role', 'button');
              }
            }
            
            // Add aria-label if missing and element has text
            if (!element.getAttribute('aria-label') && element.textContent.trim()) {
              element.setAttribute('aria-label', element.textContent.trim().substring(0, 50));
            }
            
            // Mark parent dropdown menus
            if (element.querySelector('ul, .dropdown-menu, [class*="submenu"]')) {
              element.setAttribute('aria-haspopup', 'true');
              element.setAttribute('aria-expanded', 'false');
            }
          });
        } catch (e) {
          // Skip invalid selectors
          console.debug('Skipped selector:', selector);
        }
      });
      
      // Make all dropdown/submenu items visible and keyboard accessible
      const dropdownMenus = document.querySelectorAll('ul[class*="dropdown"], ul[class*="submenu"], [class*="dropdown-menu"]');
      dropdownMenus.forEach(menu => {
        const items = menu.querySelectorAll('a, li, button');
        items.forEach(item => {
          if (!item.hasAttribute('tabindex') && !item.closest('#a11y-floating-panel')) {
            item.setAttribute('tabindex', '0');
            item.setAttribute('data-a11y-keyboard', 'true');
          }
        });
      });
    }
    
    handleDropdownNavigation(element, key) {
      // Find dropdown menu
      let dropdown = element.querySelector('ul, .dropdown-menu, [class*="submenu"]');
      
      if (!dropdown) {
        dropdown = element.nextElementSibling;
        if (dropdown && !dropdown.matches('ul, .dropdown-menu, [class*="submenu"]')) {
          dropdown = null;
        }
      }
      
      if (dropdown) {
        // Show dropdown
        dropdown.style.display = 'block';
        dropdown.style.visibility = 'visible';
        dropdown.style.opacity = '1';
        
        // Find focusable items
        const items = Array.from(dropdown.querySelectorAll('a, button, [tabindex="0"]'));
        
        if (items.length > 0) {
          if (key === 'ArrowDown') {
            items[0].focus();
          } else if (key === 'ArrowUp') {
            items[items.length - 1].focus();
          }
        }
      }
    }
    
    hasEventListener(element, eventType) {
      // Check if element has event listeners (approximate check)
      const listeners = getEventListeners ? getEventListeners(element) : null;
      if (listeners && listeners[eventType]) {
        return listeners[eventType].length > 0;
      }
      // Fallback: check for common patterns
      return element.getAttribute(`on${eventType}`) !== null;
    }
    
    removeKeyboardAccessibility() {
      // Remove enhancements added by makeElementsKeyboardAccessible
      const elements = document.querySelectorAll('[data-a11y-keyboard="true"]');
      elements.forEach(element => {
        element.removeAttribute('tabindex');
        element.removeAttribute('data-a11y-keyboard');
        element.removeAttribute('aria-haspopup');
        element.removeAttribute('aria-expanded');
        
        // Remove event listeners
        if (element._a11yKeyHandler) {
          element.removeEventListener('keydown', element._a11yKeyHandler);
          delete element._a11yKeyHandler;
        }
        if (element._a11yFocusHandler) {
          element.removeEventListener('focus', element._a11yFocusHandler);
          delete element._a11yFocusHandler;
        }
        if (element._a11yBlurHandler) {
          element.removeEventListener('blur', element._a11yBlurHandler);
          delete element._a11yBlurHandler;
        }
      });
    }
    
    readAloud() {
      const btn = this.panel.querySelector('.btn-read-aloud');
      const stopBtn = this.panel.querySelector('.btn-stop-reading');
      const progressContainer = this.panel.querySelector('.read-aloud-progress');
      const progressFill = this.panel.querySelector('.progress-fill');
      const progressText = this.panel.querySelector('.progress-text');
      
      if ('speechSynthesis' in window) {
        // Check if currently speaking
        if (window.speechSynthesis.speaking) {
          // Check if paused
          if (window.speechSynthesis.paused) {
            // Resume
            window.speechSynthesis.resume();
            btn.innerHTML = '<span aria-hidden="true">⏸</span> Pause Reading';
            btn.setAttribute('aria-label', 'Pause reading');
          } else {
            // Pause
            window.speechSynthesis.pause();
            btn.innerHTML = '<span aria-hidden="true">▶</span> Resume Reading';
            btn.setAttribute('aria-label', 'Resume reading');
          }
        } else {
          // Start reading
          const content = this.getMainContent();
          
          // Split content into sentences for better progress tracking
          const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
          let currentSentence = 0;
          
          const speakNextSentence = () => {
            if (currentSentence >= sentences.length) {
              // Finished reading
              this.resetReadAloudUI();
              return;
            }
            
            const utterance = new SpeechSynthesisUtterance(sentences[currentSentence].trim());
            utterance.rate = this.settings.readingSpeed;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            this.currentUtterance = utterance;
            
            // Update progress
            utterance.onstart = () => {
              const progress = Math.round((currentSentence / sentences.length) * 100);
              this.updateProgress(progress);
            };
            
            // When this sentence ends, speak next
            utterance.onend = () => {
              currentSentence++;
              const progress = Math.round((currentSentence / sentences.length) * 100);
              this.updateProgress(progress);
              
              if (currentSentence < sentences.length) {
                speakNextSentence();
              } else {
                this.resetReadAloudUI();
              }
            };
            
            // Handle errors
            utterance.onerror = (event) => {
              console.error('Speech error:', event);
              this.resetReadAloudUI();
            };
            
            window.speechSynthesis.speak(utterance);
          };
          
          // Show progress bar
          if (progressContainer) progressContainer.style.display = 'flex';
          this.updateProgress(0);
          
          // Start speaking
          speakNextSentence();
          
          // Update button to show pause option
          btn.innerHTML = '<span aria-hidden="true">⏸</span> Pause Reading';
          btn.setAttribute('aria-label', 'Pause reading');
          
          // Show stop button
          if (stopBtn) stopBtn.style.display = 'inline-flex';
        }
      } else {
        this.showTip([{
          type: 'error',
          message: 'Text-to-speech is not supported in your browser.'
        }]);
      }
    }
    
    updateProgress(percent) {
      const progressFill = this.panel.querySelector('.progress-fill');
      const progressText = this.panel.querySelector('.progress-text');
      
      if (progressFill) {
        progressFill.style.width = `${percent}%`;
        progressFill.setAttribute('aria-valuenow', percent);
      }
      
      if (progressText) {
        progressText.textContent = `${percent}%`;
      }
      
      this.speechProgress = percent;
    }
    
    resetReadAloudUI() {
      const btn = this.panel.querySelector('.btn-read-aloud');
      const stopBtn = this.panel.querySelector('.btn-stop-reading');
      const progressContainer = this.panel.querySelector('.read-aloud-progress');
      
      if (btn) {
        btn.innerHTML = '<span aria-hidden="true">▶</span> Start Reading';
        btn.setAttribute('aria-label', 'Start reading page aloud');
      }
      
      if (stopBtn) {
        stopBtn.style.display = 'none';
      }
      
      if (progressContainer) {
        progressContainer.style.display = 'none';
      }
      
      this.updateProgress(0);
      this.currentUtterance = null;
    }
    
    stopReading() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        this.resetReadAloudUI();
      }
    }
    
    getMainContent() {
      // Try to find main content
      const main = document.querySelector('main, article, [role="main"]');
      if (main) {
        return main.innerText;
      }
      
      // Fallback to body
      return document.body.innerText;
    }
    
    openSettings() {
      chrome.runtime.sendMessage({ action: 'openOptions' });
    }
    
    async resetAllSettings() {
      // Confirm with user
      const confirmed = confirm('Reset all settings to default? This will:\n\n• Set text size to 100%\n• Set page zoom to 100%\n• Turn off contrast\n• Turn off keyboard navigation\n• Turn off voice commands\n• Set light theme\n• Set reading speed to normal\n\nContinue?');
      
      if (!confirmed) return;
      
      // Reset to defaults
      this.settings = {
        textSize: 100,
        highContrast: false,
        contrastLevel: 0,
        keyboardNav: false,
        highlightLinks: false,
        panelVisible: true,
        panelTheme: 'light',
        voiceControl: false,
        pageZoom: 100,
        readingSpeed: 1.0
      };
      
      // Apply defaults
      this.applyTextSize(100);
      this.applyPageZoom(100);
      this.applyHighContrast(0);
      this.applyKeyboardNav(false);
      this.applyPanelTheme('light');
      
      // Stop voice if active
      if (this.recognition) {
        this.stopVoiceRecognition();
      }
      
      // Stop reading if active
      if (window.speechSynthesis.speaking) {
        this.stopReading();
      }
      
      // Update UI
      this.updateAllControls();
      
      // Save
      await this.saveSettings();
      
      // Show confirmation
      this.showTip([{
        type: 'success',
        message: 'All settings have been reset to default values.'
      }]);
      
      // Reload page to apply changes cleanly
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
    
    updateAllControls() {
      // Update text size display
      const textSizeValue = this.panel.querySelector('.text-size-value');
      if (textSizeValue) textSizeValue.textContent = '100%';
      
      // Update page zoom display
      const pageZoomValue = this.panel.querySelector('.page-zoom-value');
      if (pageZoomValue) pageZoomValue.textContent = '100%';
      
      // Update reading speed display
      const readingSpeedValue = this.panel.querySelector('.reading-speed-value');
      if (readingSpeedValue) readingSpeedValue.textContent = this.getSpeedLabel(1.0);
      
      // Update contrast button
      this.updateContrastButton();
      
      // Update keyboard nav button
      const keyboardBtn = this.panel.querySelector('.btn-toggle-keyboard');
      const keyboardStatus = keyboardBtn?.previousElementSibling?.querySelector('strong');
      if (keyboardBtn && keyboardStatus) {
        keyboardBtn.setAttribute('aria-checked', 'false');
        keyboardBtn.textContent = 'Turn ON';
        keyboardStatus.textContent = 'OFF';
      }
      
      // Update voice button
      const voiceBtn = this.panel.querySelector('.btn-toggle-voice');
      const voiceStatus = voiceBtn?.previousElementSibling?.querySelector('strong');
      if (voiceBtn && voiceStatus) {
        voiceBtn.setAttribute('aria-checked', 'false');
        voiceBtn.textContent = 'Turn ON';
        voiceStatus.textContent = 'OFF';
        voiceBtn.classList.remove('listening');
      }
    }
    
    openLinkFinder() {
      console.log('openLinkFinder called');
      
      // Create link finder overlay
      if (document.getElementById('a11y-link-finder')) {
        // Already open, just focus it
        console.log('Link finder already open, focusing input');
        document.getElementById('a11y-link-finder-input').focus();
        return;
      }
      
      console.log('Creating link finder overlay');
      
      const overlay = document.createElement('div');
      overlay.id = 'a11y-link-finder';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'Link Finder');
      
      // Apply theme class based on panel theme
      if (this.settings.panelTheme === 'dark') {
        overlay.classList.add('theme-dark');
      } else {
        overlay.classList.add('theme-light');
      }
      
      // Get all links on the page
      const links = Array.from(document.querySelectorAll('a[href]'))
        .filter(link => !link.closest('#a11y-floating-panel') && !link.closest('#a11y-link-finder'))
        .map(link => ({
          text: link.textContent.trim() || link.getAttribute('aria-label') || link.href,
          href: link.href,
          element: link
        }))
        .filter(link => link.text.length > 0);
      
      overlay.innerHTML = `
        <div class="link-finder-content">
          <div class="link-finder-header">
            <h2>Find & Navigate Links</h2>
            <button class="link-finder-close" aria-label="Close">×</button>
          </div>
          <div class="link-finder-search">
            <input 
              type="text" 
              id="a11y-link-finder-input"
              placeholder="Type to search links..."
              aria-label="Search links"
              autocomplete="off"
            />
            <div class="link-finder-count">${links.length} links found</div>
          </div>
          <div class="link-finder-results" role="listbox" aria-label="Search results">
            ${links.slice(0, 10).map((link, index) => `
              <div class="link-finder-item" role="option" data-href="${link.href}" tabindex="0">
                <span class="link-text">${this.escapeHtml(link.text)}</span>
                <span class="link-url">${this.escapeHtml(link.href)}</span>
              </div>
            `).join('')}
          </div>
          <div class="link-finder-footer">
            <kbd>↑↓</kbd> Navigate <kbd>Enter</kbd> Open <kbd>Esc</kbd> Close
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Focus input
      const input = document.getElementById('a11y-link-finder-input');
      input.focus();
      
      // Store links for searching
      overlay._allLinks = links;
      overlay._selectedIndex = 0;
      
      // Close button
      overlay.querySelector('.link-finder-close').addEventListener('click', () => {
        overlay.remove();
      });
      
      // Search functionality
      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = links.filter(link => 
          link.text.toLowerCase().includes(query) || 
          link.href.toLowerCase().includes(query)
        );
        
        const results = overlay.querySelector('.link-finder-results');
        const count = overlay.querySelector('.link-finder-count');
        
        count.textContent = `${filtered.length} link${filtered.length !== 1 ? 's' : ''} found`;
        
        if (filtered.length === 0) {
          results.innerHTML = '<div class="link-finder-empty">No links found</div>';
        } else {
          results.innerHTML = filtered.slice(0, 50).map((link, index) => `
            <div class="link-finder-item" role="option" data-href="${link.href}" tabindex="0">
              <span class="link-text">${this.escapeHtml(link.text)}</span>
              <span class="link-url">${this.escapeHtml(link.href)}</span>
            </div>
          `).join('');
          
          // Re-attach click handlers
          this.attachLinkFinderItemHandlers(overlay);
        }
        
        overlay._selectedIndex = 0;
        this.updateLinkFinderSelection(overlay);
      });
      
      // Keyboard navigation
      input.addEventListener('keydown', (e) => {
        const results = overlay.querySelector('.link-finder-results');
        const items = results.querySelectorAll('.link-finder-item');
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          overlay._selectedIndex = Math.min(overlay._selectedIndex + 1, items.length - 1);
          this.updateLinkFinderSelection(overlay);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          overlay._selectedIndex = Math.max(overlay._selectedIndex - 1, 0);
          this.updateLinkFinderSelection(overlay);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (items[overlay._selectedIndex]) {
            const href = items[overlay._selectedIndex].getAttribute('data-href');
            window.location.href = href;
          }
        } else if (e.key === 'Escape') {
          overlay.remove();
        }
      });
      
      // Click handlers
      this.attachLinkFinderItemHandlers(overlay);
      
      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
    }
    
    attachLinkFinderItemHandlers(overlay) {
      const items = overlay.querySelectorAll('.link-finder-item');
      items.forEach((item, index) => {
        item.addEventListener('click', () => {
          const href = item.getAttribute('data-href');
          window.location.href = href;
        });
        
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const href = item.getAttribute('data-href');
            window.location.href = href;
          }
        });
        
        item.addEventListener('mouseenter', () => {
          overlay._selectedIndex = index;
          this.updateLinkFinderSelection(overlay);
        });
      });
    }
    
    updateLinkFinderSelection(overlay) {
      const items = overlay.querySelectorAll('.link-finder-item');
      items.forEach((item, index) => {
        if (index === overlay._selectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          item.classList.remove('selected');
        }
      });
    }
    
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    async analyzePage() {
      const issues = await this.detectIssues();
      this.score = this.calculateScore(issues);
      this.updateScore();
      
      if (issues.length > 0) {
        this.showTip(issues);
      } else {
        this.showTip([{ 
          type: 'success', 
          message: 'Great! This page has good accessibility. No major issues found.' 
        }]);
      }
    }
    
    async detectIssues() {
      const issues = [];
      
      // Check for images without alt text
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
      if (imagesWithoutAlt.length > 0) {
        issues.push({
          type: 'missing-alt',
          count: imagesWithoutAlt.length,
          message: `${imagesWithoutAlt.length} image${imagesWithoutAlt.length > 1 ? 's' : ''} without descriptions. Screen readers cannot describe these images.`,
          fix: () => this.fixMissingAlt(imagesWithoutAlt)
        });
      }
      
      // Check for form inputs without labels
      const inputsWithoutLabels = Array.from(document.querySelectorAll('input, textarea, select')).filter(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
        return !hasLabel && !hasAriaLabel;
      });
      
      if (inputsWithoutLabels.length > 0) {
        issues.push({
          type: 'missing-labels',
          count: inputsWithoutLabels.length,
          message: `${inputsWithoutLabels.length} form field${inputsWithoutLabels.length > 1 ? 's' : ''} without labels. This makes forms difficult to use.`,
          fix: () => this.fixMissingLabels(inputsWithoutLabels)
        });
      }
      
      // Check for low contrast (simplified check)
      // In a real implementation, this would use color contrast algorithms
      
      return issues;
    }
    
    calculateScore(issues) {
      const maxScore = 100;
      const deduction = Math.min(issues.reduce((sum, issue) => sum + (issue.count || 1) * 5, 0), 100);
      return Math.max(0, maxScore - deduction);
    }
    
    updateScore() {
      const scoreElements = this.panel.querySelectorAll('.panel-score');
      const scoreDisplay = this.panel.querySelector('.panel-score-display strong');
      const scoreLabel = this.panel.querySelector('.score-label');
      
      scoreElements.forEach(el => {
        el.textContent = `${this.score}%`;
      });
      
      if (scoreDisplay) {
        scoreDisplay.textContent = `${this.score}%`;
      }
      
      // Update label
      let label = 'Good';
      let className = 'score-good';
      
      if (this.score < 60) {
        label = 'Poor';
        className = 'score-poor';
      } else if (this.score < 80) {
        label = 'Fair';
        className = 'score-fair';
      }
      
      if (scoreLabel) {
        scoreLabel.textContent = label;
        scoreLabel.className = `score-label ${className}`;
      }
      
      // Update minimized button aria-label
      const minimized = this.panel.querySelector('.panel-minimized');
      minimized.setAttribute('aria-label', `Accessibility Helper, Page score ${this.score}%, ${label}, Click to expand`);
    }
    
    showTip(issues) {
      const tipMessage = this.panel.querySelector('.tip-message');
      const tipActions = this.panel.querySelector('.tip-actions');
      
      if (!tipMessage || !tipActions) return;
      
      if (issues.length === 0 || issues[0].type === 'success') {
        tipMessage.textContent = issues[0].message;
        tipActions.innerHTML = '';
        return;
      }
      
      const firstIssue = issues[0];
      tipMessage.textContent = firstIssue.message;
      
      // Add action buttons
      tipActions.innerHTML = `
        <button class="tip-button primary">Fix Now</button>
        <button class="tip-button secondary">Tell Me More</button>
      `;
      
      tipActions.querySelector('.primary').addEventListener('click', () => {
        if (firstIssue.fix) {
          firstIssue.fix();
          setTimeout(() => this.analyzePage(), 500);
        }
      });
      
      tipActions.querySelector('.secondary').addEventListener('click', () => {
        alert(`Issue: ${firstIssue.type}\n\n${firstIssue.message}\n\nThis affects users who rely on assistive technologies like screen readers.`);
      });
    }
    
    fixMissingAlt(images) {
      images.forEach((img, index) => {
        // Add generic alt text
        const altText = `Image ${index + 1}`;
        img.setAttribute('alt', altText);
        img.setAttribute('data-a11y-fixed', 'true');
      });
      
      this.showTip([{
        type: 'success',
        message: `Fixed ${images.length} image${images.length > 1 ? 's' : ''} by adding descriptions.`
      }]);
    }
    
    fixMissingLabels(inputs) {
      inputs.forEach((input, index) => {
        // Add aria-label
        const labelText = input.placeholder || input.name || `Input field ${index + 1}`;
        input.setAttribute('aria-label', labelText);
        input.setAttribute('data-a11y-fixed', 'true');
      });
      
      this.showTip([{
        type: 'success',
        message: `Fixed ${inputs.length} form field${inputs.length > 1 ? 's' : ''} by adding labels.`
      }]);
    }
    
    toggleVoiceControl() {
      this.settings.voiceControl = !this.settings.voiceControl;
      
      if (this.settings.voiceControl) {
        this.startVoiceRecognition();
      } else {
        this.stopVoiceRecognition();
      }
      
      // Update button
      const btn = this.panel.querySelector('.btn-toggle-voice');
      const status = btn.previousElementSibling.querySelector('strong');
      
      btn.setAttribute('aria-checked', this.settings.voiceControl);
      btn.textContent = this.settings.voiceControl ? 'Turn OFF' : 'Turn ON';
      status.textContent = this.settings.voiceControl ? 'ON' : 'OFF';
      
      this.saveSettings();
    }
    
    startVoiceRecognition() {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        this.showTip([{
          type: 'error',
          message: 'Voice recognition is not supported in your browser.'
        }]);
        return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true; // Changed to true for better detection
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('Voice recognition started');
        
        // Update button to show listening state
        const btn = this.panel.querySelector('.btn-toggle-voice');
        btn.classList.add('listening');
        
        this.showTip([{
          type: 'success',
          message: '🎤 Listening... Try: "increase text size", "high contrast", "read page", or "help"'
        }]);
      };
      
      this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const result = event.results[last];
        
        // Only process final results
        if (result.isFinal) {
          const command = result[0].transcript.toLowerCase().trim();
          const confidence = result[0].confidence;
          
          console.log('Voice command heard:', command, 'Confidence:', confidence);
          
          // Show what was heard
          this.showTip([{
            type: 'success',
            message: `Heard: "${command}"`
          }]);
          
          this.processVoiceCommand(command);
        } else {
          // Show interim results in console
          const interim = result[0].transcript;
          console.log('Interim:', interim);
        }
      };
      
      this.recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          this.showTip([{
            type: 'error',
            message: 'Microphone access denied. Please allow microphone access.'
          }]);
          this.settings.voiceControl = false;
          const btn = this.panel.querySelector('.btn-toggle-voice');
          const status = btn.previousElementSibling.querySelector('strong');
          btn.setAttribute('aria-checked', 'false');
          btn.textContent = 'Turn ON';
          status.textContent = 'OFF';
        } else if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen...');
          // Don't show error for no-speech, just keep listening
        } else if (event.error === 'audio-capture') {
          this.showTip([{
            type: 'error',
            message: 'No microphone found. Please connect a microphone.'
          }]);
        } else {
          console.log('Voice recognition error:', event.error);
        }
      };
      
      this.recognition.onend = () => {
        if (this.settings.voiceControl) {
          // Restart if still enabled
          this.recognition.start();
        }
      };
      
      this.recognition.start();
    }
    
    stopVoiceRecognition() {
      if (this.recognition) {
        this.isListening = false;
        this.recognition.stop();
        this.recognition = null;
        
        // Remove listening indicator
        const btn = this.panel.querySelector('.btn-toggle-voice');
        if (btn) {
          btn.classList.remove('listening');
        }
      }
    }
    
    processVoiceCommand(command) {
      console.log('Processing command:', command);
      
      // Number-based commands
      if (command.match(/\b(one|1)\b.*\b(on|off)\b/)) {
        const action = command.includes('on') ? 10 : -10;
        this.adjustTextSize(action);
        this.speak(action > 0 ? 'Text size increased' : 'Text size decreased');
      } else if (command.match(/\b(two|2)\b.*\b(on|off)\b/)) {
        const level = command.includes('off') ? 0 : 3;
        this.settings.contrastLevel = level;
        this.applyHighContrast(level);
        this.updateContrastButton();
        this.speak(level > 0 ? 'High contrast enabled' : 'Contrast disabled');
      } else if (command.match(/\b(three|3)\b.*\b(on|off)\b/)) {
        const enable = command.includes('on');
        if (enable !== this.settings.keyboardNav) {
          this.toggleKeyboardNav();
        }
        this.speak(enable ? 'Keyboard navigation enabled' : 'Keyboard navigation disabled');
      } else if (command.match(/\b(four|4)\b.*\b(on|off)\b/)) {
        const enable = command.includes('on');
        if (enable !== this.settings.voiceControl) {
          // Don't toggle voice control off via voice command (that would be confusing)
          if (enable) {
            this.speak('Voice commands already active');
          }
        }
      } else if (command.match(/\b(five|5)\b/)) {
        if (command.includes('on') || command.includes('start')) {
          this.readAloud();
          this.speak('Starting to read');
        } else if (command.includes('off') || command.includes('stop')) {
          this.stopReading();
          this.speak('Stopped reading');
        }
      } else if (command.match(/\b(six|6)\b/)) {
        this.openLinkFinder();
        this.speak('Link finder opened');
      }
      
      // Text size commands
      else if (command.includes('increase text') || command.includes('bigger text') || command.includes('larger text')) {
        this.adjustTextSize(10);
        this.speak('Text size increased');
      } else if (command.includes('decrease text') || command.includes('smaller text')) {
        this.adjustTextSize(-10);
        this.speak('Text size decreased');
      } else if (command.includes('reset text')) {
        this.settings.textSize = 100;
        this.applyTextSize(100);
        this.speak('Text size reset');
      }
      
      // Page zoom commands
      else if (command.includes('zoom in') || command.includes('increase zoom')) {
        this.adjustPageZoom(10);
        this.speak('Page zoom increased');
      } else if (command.includes('zoom out') || command.includes('decrease zoom')) {
        this.adjustPageZoom(-10);
        this.speak('Page zoom decreased');
      } else if (command.includes('reset zoom')) {
        this.settings.pageZoom = 100;
        this.applyPageZoom(100);
        this.speak('Page zoom reset');
      }
      
      // Contrast commands
      else if (command.includes('cycle contrast') || command.includes('change contrast') || command.includes('next contrast')) {
        this.settings.contrastLevel = (this.settings.contrastLevel + 1) % 4;
        this.applyHighContrast(this.settings.contrastLevel);
        this.updateContrastButton();
        const levels = ['OFF', 'Low', 'Medium', 'High'];
        this.speak(`Contrast ${levels[this.settings.contrastLevel]}`);
        this.saveSettings();
      }
      else if (command.includes('high contrast') || command.includes('maximum contrast')) {
        this.settings.contrastLevel = 3;
        this.applyHighContrast(3);
        this.updateContrastButton();
        this.speak('High contrast enabled');
      } else if (command.includes('medium contrast')) {
        this.settings.contrastLevel = 2;
        this.applyHighContrast(2);
        this.updateContrastButton();
        this.speak('Medium contrast enabled');
      } else if (command.includes('low contrast')) {
        this.settings.contrastLevel = 1;
        this.applyHighContrast(1);
        this.updateContrastButton();
        this.speak('Low contrast enabled');
      } else if (command.includes('no contrast') || command.includes('contrast off')) {
        this.settings.contrastLevel = 0;
        this.applyHighContrast(0);
        this.updateContrastButton();
        this.speak('Contrast disabled');
      }
      
      // Read aloud commands
      else if (command.includes('read page') || command.includes('read aloud') || command.includes('start reading')) {
        this.readAloud();
        this.speak('Starting to read');
      } else if (command.includes('pause reading') || command.includes('pause')) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          this.speak('Paused reading');
        }
      } else if (command.includes('resume reading') || command.includes('resume') || command.includes('continue reading')) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          this.speak('Resumed reading');
        }
      } else if (command.includes('stop reading')) {
        this.stopReading();
        this.speak('Stopped reading');
      }
      
      // Panel commands
      else if (command.includes('open panel') || command.includes('show panel') || command.includes('expand panel')) {
        if (!this.isExpanded) {
          this.expand();
          this.speak('Panel opened');
        }
      } else if (command.includes('close panel') || command.includes('hide panel') || command.includes('collapse panel') || command.includes('hide') || command.includes('close') || command.includes('collapse')) {
        if (this.isExpanded) {
          this.collapse();
          this.speak('Panel closed');
        }
      }
      
      // Scroll commands
      else if (command.includes('scroll down') || command.includes('go down') || command.includes('down')) {
        const scrollAmount = window.innerHeight * 0.3; // About 5 lines (30% of viewport)
        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        this.speak('Scrolling down');
      } else if (command.includes('scroll up') || command.includes('go up') || command.includes('up')) {
        const scrollAmount = window.innerHeight * 0.3; // About 5 lines (30% of viewport)
        window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        this.speak('Scrolling up');
      } else if (command.includes('scroll to top') || command.includes('go to top')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.speak('Scrolling to top');
      } else if (command.includes('scroll to bottom') || command.includes('go to bottom')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        this.speak('Scrolling to bottom');
      }
      
      // Theme commands
      else if (command.includes('dark theme') || command.includes('dark mode')) {
        this.settings.panelTheme = 'dark';
        this.applyPanelTheme('dark');
        this.saveSettings();
        this.speak('Dark theme enabled');
      } else if (command.includes('light theme') || command.includes('light mode')) {
        this.settings.panelTheme = 'light';
        this.applyPanelTheme('light');
        this.saveSettings();
        this.speak('Light theme enabled');
      }
      
      // Link finder
      else if (command.includes('find links') || command.includes('show links') || command.includes('open link finder')) {
        this.openLinkFinder();
        this.speak('Link finder opened');
      }
      
      // Help command
      else if (command.includes('help') || command.includes('what can you do')) {
        this.speak('Say a number and on or off. One for text size, two for contrast, three for keyboard, five to read, six for links');
      }
      
      else {
        console.log('Command not recognized:', command);
      }
    }
    
    speak(text) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    }
    
    toggleGestureControl() {
      this.settings.gestureControl = !this.settings.gestureControl;
      
      if (this.settings.gestureControl) {
        this.startGestureRecognition();
      } else {
        this.stopGestureRecognition();
      }
      
      // Update button
      const btn = this.panel.querySelector('.btn-toggle-gesture');
      const status = btn.previousElementSibling.querySelector('strong');
      const info = this.panel.querySelector('.gesture-info');
      
      btn.setAttribute('aria-checked', this.settings.gestureControl);
      btn.textContent = this.settings.gestureControl ? 'Turn OFF' : 'Turn ON';
      status.textContent = this.settings.gestureControl ? 'ON' : 'OFF';
      
      if (info) {
        info.style.display = this.settings.gestureControl ? 'block' : 'none';
      }
      
      this.saveSettings();
    }
    
    async startGestureRecognition() {
      try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        // Create hidden video element
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        this.videoElement.autoplay = true;
        this.videoElement.srcObject = stream;
        document.body.appendChild(this.videoElement);
        
        await this.videoElement.play();
        
        this.isGestureActive = true;
        
        // Load MediaPipe Hands library dynamically
        await this.loadMediaPipeScript();
        
        this.showTip([{
          type: 'success',
          message: '👋 Motion gestures active! Slow motion=text size, Fast motion=page zoom (4 sec cooldown)'
        }]);
        
        // Start gesture detection loop
        this.detectGestures();
        
      } catch (error) {
        console.error('Gesture recognition error:', error);
        this.showTip([{
          type: 'error',
          message: 'Camera access denied. Please allow camera access to use hand gestures.'
        }]);
        
        this.settings.gestureControl = false;
        const btn = this.panel.querySelector('.btn-toggle-gesture');
        const status = btn.previousElementSibling.querySelector('strong');
        btn.setAttribute('aria-checked', 'false');
        btn.textContent = 'Turn ON';
        status.textContent = 'OFF';
      }
    }
    
    stopGestureRecognition() {
      this.isGestureActive = false;
      
      // Stop video stream
      if (this.videoElement && this.videoElement.srcObject) {
        const tracks = this.videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        this.videoElement.remove();
        this.videoElement = null;
      }
      
      if (this.canvasElement) {
        this.canvasElement.remove();
        this.canvasElement = null;
      }
    }
    
    async loadMediaPipeScript() {
      // No external library needed - we'll use built-in Canvas API for motion detection
      return Promise.resolve();
    }
    
    async detectGestures() {
      if (!this.isGestureActive) return;
      
      try {
        // Create canvas for motion detection
        if (!this.canvasElement) {
          this.canvasElement = document.createElement('canvas');
          this.canvasElement.width = 320;
          this.canvasElement.height = 240;
          this.canvasElement.style.display = 'none';
          document.body.appendChild(this.canvasElement);
        }
        
        const context = this.canvasElement.getContext('2d', { willReadFrequently: true });
        let previousFrame = null;
        
        // Motion detection loop
        const runDetection = () => {
          if (!this.isGestureActive) return;
          
          // Draw video frame to canvas
          context.drawImage(this.videoElement, 0, 0, 320, 240);
          
          // Get current frame data
          const currentFrame = context.getImageData(0, 0, 320, 240);
          
          if (previousFrame) {
            // Detect motion by comparing frames
            const motion = this.detectMotion(previousFrame, currentFrame);
            
            if (motion.detected) {
              this.processMotionGesture(motion);
            }
          }
          
          previousFrame = currentFrame;
          
          // Continue detection (10 FPS to reduce CPU usage)
          setTimeout(() => requestAnimationFrame(runDetection), 100);
        };
        
        runDetection();
        
      } catch (error) {
        console.error('Gesture detection error:', error);
        this.showTip([{
          type: 'error',
          message: 'Failed to initialize gesture tracking. Please try again.'
        }]);
        this.stopGestureRecognition();
      }
    }
    
    detectMotion(previousFrame, currentFrame) {
      const width = 320;
      const height = 240;
      const threshold = 30; // Motion sensitivity
      
      let motionPixels = 0;
      let topMotion = 0;
      let bottomMotion = 0;
      let leftMotion = 0;
      let rightMotion = 0;
      
      // Track motion clusters to estimate "finger count"
      let motionClusters = [];
      let clusterSize = 0;
      
      // Divide frame into regions
      const topRegion = height * 0.33;
      const bottomRegion = height * 0.67;
      const leftRegion = width * 0.33;
      const rightRegion = width * 0.67;
      
      // Compare pixels (sample every 4th pixel for performance)
      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          const i = (y * width + x) * 4;
          
          // Calculate difference in RGB values
          const diff = Math.abs(previousFrame.data[i] - currentFrame.data[i]) +
                      Math.abs(previousFrame.data[i + 1] - currentFrame.data[i + 1]) +
                      Math.abs(previousFrame.data[i + 2] - currentFrame.data[i + 2]);
          
          if (diff > threshold) {
            motionPixels++;
            clusterSize++;
            
            // Track motion by region
            if (y < topRegion) topMotion++;
            if (y > bottomRegion) bottomMotion++;
            if (x < leftRegion) leftMotion++;
            if (x > rightRegion) rightMotion++;
          }
        }
      }
      
      // Determine gesture based on motion regions
      const totalPixels = (width / 4) * (height / 4);
      const motionPercent = (motionPixels / totalPixels) * 100;
      
      // Estimate "finger count" based on motion area size
      // Adjusted thresholds for better detection
      // Small motion area (5-12%) = 1 finger
      // Medium motion area (12-22%) = 2 fingers
      // Medium-large motion area (22-32%) = 3 fingers
      // Large motion area (32%+) = 4+ fingers (open hand)
      let fingerCount = 0;
      if (motionPercent > 5 && motionPercent < 12) {
        fingerCount = 1;
      } else if (motionPercent >= 12 && motionPercent < 22) {
        fingerCount = 2;
      } else if (motionPercent >= 22 && motionPercent < 32) {
        fingerCount = 3;
      } else if (motionPercent >= 32) {
        fingerCount = 4; // 4 or more (open hand)
      }
      
      return {
        detected: motionPercent > 5, // At least 5% motion
        percent: motionPercent,
        top: topMotion,
        bottom: bottomMotion,
        left: leftMotion,
        right: rightMotion,
        fingerCount: fingerCount
      };
    }
    
    processMotionGesture(motion) {
      // Debounce gestures with 4-second cooldown
      const now = Date.now();
      const cooldownTime = 4000; // 4 seconds
      
      if (this.lastGestureTime && (now - this.lastGestureTime) < cooldownTime) {
        // Show countdown in UI
        const remaining = Math.ceil((cooldownTime - (now - this.lastGestureTime)) / 1000);
        if (!this.cooldownShown || this.lastCooldownValue !== remaining) {
          this.showTip([{
            type: 'success',
            message: `⏳ Wait ${remaining} second${remaining > 1 ? 's' : ''} before next gesture...`
          }]);
          this.lastCooldownValue = remaining;
          this.cooldownShown = true;
        }
        return;
      }
      
      this.cooldownShown = false;
      
      // Detect gesture based on motion direction
      const total = motion.top + motion.bottom + motion.left + motion.right;
      
      if (total < 10) return; // Not enough motion
      
      // Determine dominant direction
      const topPercent = (motion.top / total) * 100;
      const bottomPercent = (motion.bottom / total) * 100;
      
      console.log('Motion detected:', { 
        topPercent, 
        bottomPercent,
        fingerCount: motion.fingerCount,
        motionPercent: motion.percent,
        isUpward,
        isDownward
      });
      
      // Only use UP and DOWN directions (simpler!)
      // NOTE: Motion is inverted - when hand moves UP, it creates motion in BOTTOM region
      const isUpward = bottomPercent > 40; // Hand moving UP creates bottom motion
      const isDownward = topPercent > 40;   // Hand moving DOWN creates top motion
      
      if (!isUpward && !isDownward) {
        // No clear motion - don't log spam
        return;
      }
      
      // Determine if motion is SLOW or FAST based on motion area
      // Slow motion (small area) = deliberate, controlled
      // Fast motion (large area) = quick, sweeping
      const isSlow = motion.percent < 20; // Less than 20% motion area = slow/controlled
      const isFast = motion.percent >= 20; // 20%+ motion area = fast/sweeping
      
      console.log(`Motion speed: ${isSlow ? 'SLOW' : 'FAST'} (${motion.percent.toFixed(1)}%), isUpward=${isUpward}, isDownward=${isDownward}`);
      
      let gestureExecuted = false;
      
      // SLOW MOTION = Text size control
      if (isSlow) {
        if (isUpward) {
          this.adjustTextSize(10);
          this.showTip([{
            type: 'success',
            message: '👆 Slow UP - Text size increased'
          }]);
          gestureExecuted = true;
        } else if (isDownward) {
          this.adjustTextSize(-10);
          this.showTip([{
            type: 'success',
            message: '👇 Slow DOWN - Text size decreased'
          }]);
          gestureExecuted = true;
        }
      }
      // FAST MOTION = Page zoom control
      else if (isFast) {
        if (isUpward) {
          this.adjustPageZoom(10);
          this.showTip([{
            type: 'success',
            message: '⬆️ Fast UP - Page zoom increased'
          }]);
          gestureExecuted = true;
        } else if (isDownward) {
          this.adjustPageZoom(-10);
          this.showTip([{
            type: 'success',
            message: '⬇️ Fast DOWN - Page zoom decreased'
          }]);
          gestureExecuted = true;
        }
      }
      
      // Only set cooldown if a gesture was actually executed
      if (gestureExecuted) {
        this.lastGestureTime = now;
        console.log('Gesture executed, starting 4-second cooldown');
      }
    }
  }

  // Initialize the panel when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const panel = new AccessibilityPanel();
      panel.init();
    });
  } else {
    const panel = new AccessibilityPanel();
    panel.init();
  }
})();
