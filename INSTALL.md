# Quick Installation Guide

## Step-by-Step Installation

### 1. Prepare the Extension

**Create Icons (Easy - 2 minutes):**

1. **Open** `assets/icons/generate-icons.html` in Chrome (double-click it)
2. **Click** the download buttons under each icon
3. **Move** the downloaded files to `assets/icons/` folder
4. **Done!** You now have custom icons

**Or skip this step** - the extension works fine with default Chrome icons.

See `assets/icons/QUICK-START.md` for other icon creation methods.

### 2. Open Chrome Extensions Page

**Method 1:**
- Type `chrome://extensions/` in the address bar
- Press Enter

**Method 2:**
- Click the three dots menu (⋮) in Chrome
- Go to: More Tools → Extensions

### 3. Enable Developer Mode

- Look for the "Developer mode" toggle in the top-right corner
- Click to turn it ON
- You'll see new buttons appear: "Load unpacked", "Pack extension", "Update"

### 4. Load the Extension

1. Click the **"Load unpacked"** button
2. Navigate to the `accessibility-chrome-extension` folder
3. Select the folder (the one containing `manifest.json`)
4. Click **"Select Folder"** or **"Open"**

### 5. Verify Installation

✅ The extension should now appear in your extensions list
✅ You should see "Accessibility Helper" with version 1.0.0
✅ Check for any errors (shown in red text)

### 6. Test the Extension

**Option A: Use the Test Page (Recommended)**

1. **Open the test page:**
   - Navigate to the extension folder
   - Open `test-page.html` in Chrome
   - Or drag the file into Chrome

2. **The test page contains:**
   - 7 intentional accessibility issues
   - Images without alt text
   - Forms without labels
   - Low contrast text
   - Small text and buttons
   - Instructions for testing

3. **Follow the checklist on the test page** to verify all features work

**Option B: Test on Real Websites**

1. **Visit any website** (e.g., https://example.com)
2. **Look for the floating panel** in the bottom-right corner
3. **Click the panel** to expand it
4. **Try the controls:**
   - Click + or - to adjust text size
   - Toggle High Contrast
   - Try the Read Aloud feature

5. **Test keyboard shortcut:**
   - Press **Alt+A** to hide/show the panel

6. **Check the extension popup:**
   - Click the extension icon in the Chrome toolbar
   - You should see the popup with quick actions

### 7. Configure Settings (Optional)

1. Click the extension icon in the toolbar
2. Click "Settings"
3. Customize:
   - Panel position
   - Default text size
   - Auto-enable features
4. Click "Save Settings"

## Troubleshooting

### ❌ Error: "Manifest file is missing or unreadable"
**Solution:** Make sure you selected the correct folder containing `manifest.json`

### ❌ Error: "Required value 'version' is missing"
**Solution:** Check that `manifest.json` is properly formatted (valid JSON)

### ❌ Panel doesn't appear on websites
**Solutions:**
1. Refresh the page (Ctrl+R or Cmd+R)
2. Check browser console for errors (press F12)
3. Make sure extension is enabled in `chrome://extensions/`
4. Try a different website

### ❌ Icons not showing
**Solution:** This is normal if you haven't added icon files yet. The extension will still work with default icons.

### ❌ Changes not appearing after editing code
**Solutions:**
1. Go to `chrome://extensions/`
2. Click the refresh/reload icon on the extension card
3. Hard refresh test pages (Ctrl+Shift+R)

## Updating the Extension

When you make changes to the code:

1. Go to `chrome://extensions/`
2. Find "Accessibility Helper"
3. Click the refresh icon (circular arrow)
4. Reload any open web pages

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Accessibility Helper"
3. Click "Remove"
4. Confirm removal

## Next Steps

Once installed:

1. **Test on various websites** - Try news sites, social media, e-commerce
2. **Test all features** - Make sure everything works as expected
3. **Get feedback** - Ask people with disabilities to test it
4. **Report issues** - Note any bugs or problems
5. **Customize** - Adjust settings to your preferences

## Need Help?

- Check the main README.md for detailed documentation
- Look at the browser console (F12) for error messages
- Make sure you're using Chrome 88 or newer

## Success Checklist

- [ ] Extension appears in `chrome://extensions/`
- [ ] No error messages shown
- [ ] Floating panel appears on websites
- [ ] Panel can be expanded and collapsed
- [ ] Text size controls work
- [ ] High contrast toggle works
- [ ] Keyboard shortcut (Alt+A) works
- [ ] Extension popup opens when clicking icon
- [ ] Settings page opens and saves preferences

If all items are checked, you're ready to use the extension! 🎉
