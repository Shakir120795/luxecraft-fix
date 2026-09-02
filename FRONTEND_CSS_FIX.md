# Frontend CSS Fix Guide

## Problem
CSS not loading in storefront - showing plain HTML without styles

## Root Cause
Development server cache issue - `.next` folder has stale/corrupted build artifacts

## Solution

### Step 1: Stop Dev Server
```bash
# Press Ctrl+C in terminal running storefront
```

### Step 2: Clean Cache
```bash
# From project root
cd apps/storefront

# Delete .next folder (Windows)
Remove-Item -Recurse -Force .next

# OR (if above doesn't work)
rm -rf .next
```

### Step 3: Restart Dev Server
```bash
# From project root
npm run dev:storefront

# OR use clean command
npm run dev:storefront:clean
```

### Step 4: Hard Refresh Browser
```
Chrome/Edge: Ctrl + Shift + R
Firefox: Ctrl + F5
```

## Alternative: Full Reset

If above doesn't work:

```bash
# Stop all servers
# Ctrl+C to stop dev servers

# Clean everything
cd apps/storefront
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules

# Reinstall
npm install

# Start again
npm run dev
```

## Verify CSS is Working

After restart, you should see:
- ✅ Luxury cream background (#F6F1E8)
- ✅ Serif fonts for headings
- ✅ Gold accent colors
- ✅ Proper spacing and layout
- ✅ No console errors

## Expected Console (After Fix)

Should see:
```
⚠ Fast Refresh had to perform a full reload
✓ Compiled successfully
```

Should NOT see:
```
❌ Failed to load chunks
❌ net::ERR_ABORTED 400 (Bad Request)
```

## If Still Not Working

### Check 1: Tailwind Config
Verify `apps/storefront/tailwind.config.js` exists:
```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ... rest of config
}
```

### Check 2: Globals CSS Import
Verify `apps/storefront/src/app/layout.tsx`:
```typescript
import './globals.css';  // This line MUST be present
```

### Check 3: PostCSS Config
Verify `apps/storefront/postcss.config.js` exists:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Check 4: Dev Server Port
Make sure storefront is running on port 3003:
```
http://localhost:3003
```

Not on 3000 or other port.

## Quick Commands

```bash
# Clean start (recommended)
npm run dev:storefront:clean

# Manual clean + start
cd apps/storefront
Remove-Item -Force -Recurse .next
npm run dev

# Check if Tailwind is installed
npm list tailwindcss
# Should show: tailwindcss@3.4.1 or similar
```

## Success Indicators

When CSS loads correctly:
1. Background will be ivory/cream (#F6F1E8)
2. Headers will be serif font
3. Buttons will have gold styling
4. Layout will be centered and spaced properly
5. No "LUXECRAFT" plain text at top

## Still Having Issues?

Run full rebuild:
```bash
# From project root
npm run build:storefront

# Then dev
npm run dev:storefront
```

---

**Most Common Fix:** Just delete `.next` folder and restart! 🎯
