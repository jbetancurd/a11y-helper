# 🐕‍🦺 Accessibility Helper - Chrome Extension

A free, open-source Chrome extension that helps people with disabilities overcome accessibility barriers on websites. Features voice commands, text size adjustment, high contrast modes, page zoom, text-to-speech, keyboard navigation, and more.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)

## 🎥 Video Demo

[videoDemo.mp4](https://github.com/jbetancurd/a11y-helper/blob/main/videoDemo.mp4)

> Watch the extension in action! See how the floating panel, voice commands, and accessibility features work on real websites.

## ✨ Features

- **🔤 Text Size Control** - Adjust text size from 50% to 200%
- **🔍 Page Zoom** - Zoom entire page including images (50-200%)
- **🎨 High Contrast Modes** - 4 levels: OFF, Low, Medium, High
- **⌨️ Keyboard Navigation** - Enhanced focus indicators and keyboard access
- **🔊 Text-to-Speech** - Read page content aloud with adjustable speed
- **🔗 Link Finder** - Search and navigate all links on the page
- **🎤 Voice Commands** - Hands-free control (Experimental)
- **💾 Settings Persistence** - Your preferences are saved across all pages
- **🌓 Light/Dark Theme** - Choose your preferred panel theme

## 🚀 Quick Start

### Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `accessibility-chrome-extension` folder

**Detailed instructions:** [INSTALL.md](INSTALL.md)

### Basic Usage

1. **Open the panel** - Click the 🐕‍🦺 A11y button in the bottom-right corner (or press F6)
2. **Adjust settings** - Use the controls to customize your experience
3. **Try voice commands** - Enable voice control and say commands like:
   - "increase text size"
   - "high contrast"
   - "read page"
   - "scroll down"
   - "hide" (to minimize panel)

## 📖 Quick Tutorial

### Text Size & Zoom
- Click **+** or **-** buttons to adjust text size
- Use **Page Zoom** controls to zoom the entire page
- Voice: Say "increase text size" or "zoom in"

### High Contrast
- Click **Cycle Contrast** to switch between OFF → Low → Medium → High
- Voice: Say "high contrast" or "cycle contrast"

### Reading Aloud
- Click **▶ Start Reading** to hear the page content
- Adjust **Reading Speed** (Very Slow to Very Fast)
- Click **⏸ Pause** or **⏹ Stop** to control playback
- Voice: Say "read page", "pause", or "stop reading"

### Voice Commands (Experimental)
Enable voice control and try these commands:
- **Navigation**: "down", "up", "scroll to top"
- **Text**: "increase text size", "decrease text size"
- **Zoom**: "zoom in", "zoom out"
- **Contrast**: "high contrast", "cycle contrast"
- **Reading**: "read page", "pause", "stop reading"
- **Panel**: "hide", "close", "open panel"
- **Links**: "find links"
- **Help**: "help" (lists available commands)

## 📚 Documentation

- **[Installation Guide](INSTALL.md)** - Detailed installation instructions
- **[Testing Guide](TESTING-GUIDE.md)** - How to test the extension
- **[Quick Release Guide](QUICK-RELEASE-GUIDE.md)** - Publishing to Chrome Web Store
- **[Store Listing](STORE-LISTING.md)** - Chrome Web Store description
- **[Release Checklist](RELEASE-CHECKLIST.md)** - Pre-release checklist
- **[Disclaimer](DISCLAIMER.md)** - Legal disclaimer and limitations
- **[Privacy Policy](PRIVACY-POLICY.md)** - Privacy information (no data collection)
- **[License](LICENSE)** - MIT License

## ⚠️ Important Disclaimers

**This extension is provided "as is" without warranty of any kind.**

- ❌ **NOT WCAG/ADA Certified** - This tool helps improve accessibility but does not guarantee compliance
- ❌ **No Liability** - We are not responsible for accessibility issues on websites
- ✅ **Free & Open Source** - Use at your own discretion
- ✅ **No Data Collection** - Your privacy is protected

**Read the full disclaimer:** [DISCLAIMER.md](DISCLAIMER.md)

## 🎯 Use Cases

Perfect for users who need:
- Larger text for better readability
- High contrast for visual impairments
- Keyboard-only navigation
- Screen reader alternatives (text-to-speech)
- Hands-free browsing (voice commands)
- Quick link navigation

## 🛠️ Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, storage, scripting
- **No External Dependencies** - Pure JavaScript, HTML, CSS
- **No Data Collection** - Everything runs locally
- **Browser Support**: Chrome, Edge, and other Chromium-based browsers

## 🤝 Contributing

Contributions are welcome! This is an open-source project under the MIT License.

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development
- Main logic: `content-scripts/main.js`
- Styles: `components/floating-panel.css`
- Manifest: `manifest.json`

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use

## 🐛 Known Issues

- Voice commands require internet connection (Web Speech API)
- Voice recognition may be unreliable with Bluetooth devices (e.g., AirPods)
- Some websites may override text size/zoom with their own styles
- Text-to-speech quality depends on browser's speech synthesis

## 💡 Tips

- **F6 keyboard shortcut** - Quickly toggle panel expand/collapse
- **Settings persist** - Your preferences are saved across all pages
- **Test page included** - Use `test-page.html` to try all features
- **Voice commands** - Speak clearly and wait for the listening indicator

## 🙏 Acknowledgments

- Service dog emoji 🐕‍🦺 represents assistance and support
- Built with accessibility best practices in mind
- Inspired by the need for better web accessibility tools

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the [Testing Guide](TESTING-GUIDE.md)

---

**Made with ❤️ to make the web more accessible for everyone**
