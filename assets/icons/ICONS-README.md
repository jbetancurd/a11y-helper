# Extension Icons

## ✨ Easy Method: Use the Icon Generator

1. **Open the generator:**
   - Open `generate-icons.html` in Chrome (double-click the file)
   
2. **Download the icons:**
   - Click the "Download" button under each icon
   - Or right-click each icon and "Save image as..."
   - Save as: `icon-16.png`, `icon-48.png`, `icon-128.png`
   
3. **Place in this folder:**
   - All three PNG files should be in `assets/icons/`
   
4. **Reload extension:**
   - Go to `chrome://extensions/`
   - Click the refresh icon on the extension
   - Icons should now appear!

## Alternative Methods

### Method 2: Convert SVG to PNG

1. Open `icon.svg` in a browser or image editor
2. Export/Save as PNG at these sizes:
   - 16×16 pixels → `icon-16.png`
   - 48×48 pixels → `icon-48.png`
   - 128×128 pixels → `icon-128.png`

### Method 3: Use Online Converter

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Convert to PNG at each required size
4. Download and rename files

### Method 4: Use Node.js Script (Advanced)

If you have Node.js installed:

```bash
cd assets/icons
npm install canvas
node create-icons.js
```

This will automatically generate all three PNG files.

## Required Files

```
accessibility-chrome-extension/assets/icons/
├── icon-16.png   (16×16 pixels)
├── icon-48.png   (48×48 pixels)
└── icon-128.png  (128×128 pixels)
```

## Icon Design

The icon uses:
- **Symbol:** Universal accessibility icon (person with arms outstretched)
- **Colors:** Blue (#0056b3) background with white icon
- **Style:** Material Design inspired, clean and simple
- **Format:** PNG with transparency

## Testing Icons

After adding icons:
1. Go to `chrome://extensions/`
2. Find "Accessibility Helper"
3. Click the refresh icon
4. Check if icons appear in:
   - Extension list
   - Chrome toolbar
   - Extension popup

## Temporary Solution

The extension works without custom icons - Chrome will show a default puzzle piece icon. You can add proper icons later.

## Need Help?

If icons don't appear:
- Make sure filenames are exact: `icon-16.png`, `icon-48.png`, `icon-128.png`
- Check files are in the correct folder: `assets/icons/`
- Reload the extension in `chrome://extensions/`
- Try hard refresh (Ctrl+Shift+R)
