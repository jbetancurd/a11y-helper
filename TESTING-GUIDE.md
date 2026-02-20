# Testing Guide for Accessibility Helper Extension

## Quick Start

1. **Install the extension** (see INSTALL.md)
2. **Open test-page.html** in Chrome
3. **Follow the checklist** on the test page

## Test Page Overview

The `test-page.html` file contains **7 intentional accessibility issues**:

### Issue #1: Images Without Alt Text ❌
- **What to test:** Extension should detect 3 images without alt text
- **Expected:** Panel shows "X images without descriptions"
- **Auto-fix:** Click "Fix Now" to add generic alt text

### Issue #2: Form Inputs Without Labels ❌
- **What to test:** Extension should detect 4 form fields without labels
- **Expected:** Panel shows "X form fields without labels"
- **Auto-fix:** Click "Fix Now" to add aria-labels

### Issue #3: Low Contrast Text ❌
- **What to test:** Gray text on light gray background
- **Expected:** High contrast mode should improve readability
- **Manual fix:** Toggle "High Contrast" in panel

### Issue #4: Very Small Text ❌
- **What to test:** 10px text that's hard to read
- **Expected:** Text size controls should make it larger
- **Manual fix:** Click + button to increase text size

### Issue #5: Missing Focus Indicators ❌
- **What to test:** Buttons with no visible focus
- **Expected:** Keyboard navigation mode adds focus outlines
- **Manual fix:** Toggle "Keyboard Navigation" in panel

### Issue #6: Small Click Targets ❌
- **What to test:** Tiny clickable elements
- **Expected:** Detected in accessibility score
- **Manual fix:** Text size increase helps

### Issue #7: Color-Only Information ❌
- **What to test:** Status indicators using only color
- **Expected:** Detected in accessibility score
- **Manual fix:** High contrast mode helps

## Testing Checklist

### ✅ Panel Functionality
- [ ] Panel appears in bottom-right corner
- [ ] Panel can be clicked to expand
- [ ] Panel can be collapsed with X button
- [ ] Panel can be dragged to different positions
- [ ] Panel remembers position after page reload
- [ ] Alt+A keyboard shortcut toggles panel visibility

### ✅ Accessibility Scoring
- [ ] Score is calculated (should be 65-75% on test page)
- [ ] Score is displayed in minimized panel
- [ ] Score is displayed in expanded panel with label (Good/Fair/Poor)
- [ ] Score updates after fixes are applied

### ✅ Issue Detection
- [ ] Missing alt text is detected
- [ ] Missing form labels are detected
- [ ] Issue count is shown in tips section
- [ ] Tips appear with helpful messages

### ✅ Auto-Fix Features
- [ ] "Fix Now" button appears for fixable issues
- [ ] Clicking "Fix Now" adds alt text to images
- [ ] Clicking "Fix Now" adds aria-labels to form fields
- [ ] Score improves after fixes are applied
- [ ] Success message appears after fixing

### ✅ Text Size Control
- [ ] + button increases text size
- [ ] - button decreases text size
- [ ] Current size is displayed (e.g., "100%")
- [ ] Changes are visible immediately
- [ ] Size persists after page reload
- [ ] Size can range from 50% to 200%

### ✅ High Contrast Mode
- [ ] Toggle button switches between ON/OFF
- [ ] Current state is displayed
- [ ] Contrast increases when enabled
- [ ] Colors become more vivid
- [ ] Setting persists after page reload

### ✅ Keyboard Navigation
- [ ] Toggle button switches between ON/OFF
- [ ] Current state is displayed
- [ ] Focus indicators appear on all elements when enabled
- [ ] Blue outline is visible when tabbing through elements
- [ ] Setting persists after page reload

### ✅ Read Aloud Feature
- [ ] "Start Reading" button is visible
- [ ] Clicking starts text-to-speech
- [ ] Button changes to "Stop Reading"
- [ ] Clicking again stops speech
- [ ] Works with page content

### ✅ Keyboard Shortcuts
- [ ] Alt+A toggles panel visibility
- [ ] Escape closes expanded panel
- [ ] Tab navigates through controls
- [ ] Enter/Space activates buttons
- [ ] Focus is trapped in expanded panel

### ✅ Extension Popup
- [ ] Clicking extension icon opens popup
- [ ] Popup shows "Extension Active" status
- [ ] "Toggle Panel" button works
- [ ] "Settings" button opens options page
- [ ] Keyboard shortcut is displayed

### ✅ Settings Page
- [ ] Opens from popup or extension icon
- [ ] All settings are loaded correctly
- [ ] Panel position can be changed
- [ ] Default text size can be set
- [ ] Checkboxes work correctly
- [ ] "Save Settings" button works
- [ ] Success message appears after saving
- [ ] "Reset to Defaults" button works
- [ ] Settings persist after browser restart

### ✅ Accessibility Compliance
- [ ] All controls are keyboard accessible
- [ ] Focus indicators are visible (3px outline)
- [ ] ARIA labels are present
- [ ] Screen reader announces changes
- [ ] Color contrast is high (7:1 ratio)
- [ ] Touch targets are 44×44px minimum
- [ ] Works with reduced motion preference

## Expected Scores

### Test Page (Before Fixes)
- **Expected Score:** 65-75%
- **Detected Issues:** 5-7 issues
- **Auto-fixable:** 2 issues (images, form labels)

### Test Page (After Fixes)
- **Expected Score:** 85-95%
- **Remaining Issues:** 3-5 issues (contrast, text size, etc.)
- **Manual fixes available:** High contrast, text size

### Good Website (e.g., Wikipedia)
- **Expected Score:** 85-95%
- **Detected Issues:** 0-2 minor issues

### Poor Website
- **Expected Score:** 40-60%
- **Detected Issues:** 10+ issues

## Testing on Real Websites

### Recommended Test Sites

**Good Accessibility:**
- https://www.w3.org/ (W3C website)
- https://www.gov.uk/ (UK Government)
- https://www.bbc.com/ (BBC)

**Common Issues:**
- https://example.com (basic test)
- News websites (often have contrast issues)
- E-commerce sites (often have form issues)
- Social media (often have alt text issues)

## Performance Testing

### Page Load Impact
- [ ] Extension loads within 100ms
- [ ] No visible delay on page load
- [ ] Panel appears smoothly
- [ ] No console errors

### Memory Usage
- [ ] Check Chrome Task Manager
- [ ] Extension uses < 50MB memory
- [ ] No memory leaks after extended use

### Compatibility
- [ ] Works on HTTP and HTTPS sites
- [ ] Works on simple HTML pages
- [ ] Works on complex web apps
- [ ] Doesn't conflict with other extensions

## Browser Console Testing

Open browser console (F12) and check:

```javascript
// Panel should be injected
document.getElementById('a11y-floating-panel')

// Settings should be stored
chrome.storage.local.get(null, (items) => console.log(items))

// No errors should appear
// Look for red error messages in console
```

## Troubleshooting Tests

### If panel doesn't appear:
1. Check extension is enabled
2. Refresh the page
3. Check console for errors
4. Try Alt+A to toggle visibility

### If features don't work:
1. Check settings are saved
2. Try resetting to defaults
3. Reload the extension
4. Clear browser cache

### If auto-fix doesn't work:
1. Check console for errors
2. Verify elements exist on page
3. Try manual fixes instead

## Reporting Issues

When reporting bugs, include:
- Chrome version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots

## Success Criteria

Extension passes testing if:
- ✅ All checklist items pass
- ✅ No console errors
- ✅ Score calculation is accurate
- ✅ Auto-fixes work correctly
- ✅ Settings persist
- ✅ Keyboard navigation works
- ✅ Performance is acceptable

## Next Steps After Testing

1. **Test with real users** with disabilities
2. **Get feedback** on usability
3. **Fix any bugs** discovered
4. **Optimize performance** if needed
5. **Add more features** based on feedback
6. **Prepare for Chrome Web Store** submission

---

**Happy Testing! 🧪**

If you find any issues, they're opportunities to improve the extension and help more people.
