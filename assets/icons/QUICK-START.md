# Quick Start: Creating Extension Icons

## 🚀 Easiest Method (No Installation Required)

### Option 1: Use the HTML Generator ⭐ RECOMMENDED

1. **Double-click** `generate-icons.html` to open it in Chrome
2. **Click the download buttons** under each icon
3. **Done!** The icons will download automatically

That's it! The icons are now in your Downloads folder. Move them to this directory.

---

## Other Methods

### Option 2: Use Python Script

If you have Python installed:

```bash
pip install pillow
python create-icons.py
```

Icons will be created in the current directory.

### Option 3: Convert the SVG

1. Open `icon.svg` in any image editor (Photoshop, GIMP, Inkscape)
2. Export as PNG at sizes: 16×16, 48×48, 128×128
3. Save as `icon-16.png`, `icon-48.png`, `icon-128.png`

### Option 4: Use Online Converter

1. Go to https://www.iloveimg.com/resize-image
2. Upload `icon.svg`
3. Resize to each size and download

---

## After Creating Icons

1. **Move the files** to this folder (`assets/icons/`)
2. **Verify filenames:**
   - `icon-16.png`
   - `icon-48.png`
   - `icon-128.png`

3. **Reload extension:**
   - Open `chrome://extensions/`
   - Find "Accessibility Helper"
   - Click the refresh icon 🔄

4. **Check icons appear:**
   - In the extensions list
   - In the Chrome toolbar
   - In the extension popup

---

## Troubleshooting

**Icons not showing?**
- Check filenames are exact (lowercase, with dash)
- Make sure files are PNG format
- Reload the extension
- Try restarting Chrome

**Still not working?**
- The extension works fine without custom icons
- Chrome will show a default icon
- You can add icons later

---

## What the Icons Look Like

The icons show the universal accessibility symbol:
- 🔵 Blue circular background (#0056b3)
- ⚪ White accessibility icon (person with arms outstretched)
- Clean, simple, professional design

---

## Need Help?

See `ICONS-README.md` for detailed instructions and more options.
