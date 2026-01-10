# Keystatic Setup Guide for Next.js 15 App Router

This guide explains how Keystatic is configured in this project and documents the fixes applied to get it working properly.

## What is Keystatic?

Keystatic is a content management system (CMS) that works directly with your Git repository. It provides a web-based admin panel where you can edit content without needing to know how to code.

## Required Files

To use Keystatic with Next.js 15 App Router, you need **three essential files**:

### 1. Configuration File (Project Root)
**File:** `keystatic.config.ts`
- Location: In the root folder of your project (same level as `package.json`)
- Purpose: Defines your content structure, collections, and settings
- Status: ✅ Already created and configured

### 2. Admin Panel Page (App Router)
**File:** `src/app/keystatic/[[...params]]/page.tsx`
- Location: Inside the `src/app/keystatic` folder
- Purpose: Renders the Keystatic admin interface in your browser
- Status: ✅ Already created and configured

### 3. API Route Handler (App Router)
**File:** `src/app/api/keystatic/[...params]/route.ts`
- Location: Inside the `src/app/api/keystatic` folder
- Purpose: Handles API requests from the admin panel (save, load, etc.)
- Status: ✅ Already created and configured

## File Structure

Here's the complete file structure for Keystatic:

```
temporary_stories/
├── keystatic.config.ts                    ← Configuration file (root)
├── src/
│   └── app/
│       ├── keystatic/
│       │   └── [[...params]]/             ← Catch-all route folder
│       │       └── page.tsx               ← Admin panel page
│       └── api/
│           └── keystatic/
│               └── [...params]/           ← API catch-all route folder
│                   └── route.ts           ← API handler
│   └── content/
│       └── stories/                       ← Where story content files are stored
└── public/
    └── images/
        └── stories/                       ← Where story cover images are stored
```

## Issues Fixed

When setting up Keystatic, we encountered and fixed several issues:

### Issue 1: Black Screen Problem
**Problem:** The `/keystatic` page showed a black screen with no content.

**Solution:** Added the `'use client'` directive at the top of `page.tsx`.

```typescript
'use client';  // ← This line was missing!

import { makePage } from '@keystatic/next/ui/app';
import keystaticConfig from '../../../../keystatic.config';

export default makePage(keystaticConfig);
```

**Why it matters:** Keystatic's UI components need to run on the client-side (in the browser). Without this directive, Next.js tries to render them on the server, which causes a black screen.

### Issue 2: API Route Handler Syntax
**Problem:** The API route handler wasn't working correctly.

**Solution:** Changed from passing the config directly to passing it as an object:

```typescript
// ❌ Wrong (original):
export const { POST, GET } = makeRouteHandler(config);

// ✅ Correct (fixed):
export const { POST, GET } = makeRouteHandler({ config: keystaticConfig });
```

**Why it matters:** The `makeRouteHandler` function expects an object with a `config` property, not the config directly.

### Issue 3: Missing Required Directories
**Problem:** The configuration referenced directories that didn't exist, causing errors.

**Solution:** Created the following directories:
- `src/content/stories/` - Stores your story content files
- `public/images/stories/` - Stores story cover images

**Why it matters:** Keystatic needs these directories to save your content. If they don't exist, saving will fail.

### Issue 4: Inconsistent Import Naming
**Problem:** Using different variable names for the config import made the code harder to understand.

**Solution:** Used consistent naming: `keystaticConfig` in both files.

```typescript
// In page.tsx:
import keystaticConfig from '../../../../keystatic.config';

// In route.ts:
import keystaticConfig from '../../../../../keystatic.config';
```

## How to Access the Admin Panel

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000/keystatic
   ```

3. **You should see** the Keystatic admin interface where you can:
   - Create and edit stories
   - Upload cover images
   - Manage your content

## Troubleshooting

### Problem: Black or White Screen at `/keystatic`

**Check these things:**

1. **Verify `'use client'` is present:**
   - Open `src/app/keystatic/[[...params]]/page.tsx`
   - Make sure the first line is `'use client';`
   - If missing, add it at the very top of the file

2. **Check browser console for errors:**
   - Press `F12` to open Developer Tools
   - Click the "Console" tab
   - Look for any red error messages
   - Common errors will tell you what's wrong

3. **Verify import paths are correct:**
   - In `page.tsx`: `import keystaticConfig from '../../../../keystatic.config';`
   - In `route.ts`: `import keystaticConfig from '../../../../../keystatic.config';`
   - Make sure the number of `../` matches your folder structure

4. **Ensure directories exist:**
   ```bash
   # Check if these directories exist:
   src/content/stories/
   public/images/stories/
   ```

5. **Restart the dev server:**
   ```bash
   # Stop the server (Ctrl+C), then:
   npm run dev
   ```

### Problem: "Cannot find module" Error

**Solution:**
- Make sure `keystatic.config.ts` exists in the project root (same folder as `package.json`)
- Check that the import path in your files is correct
- Count the folder levels to verify the `../../` path is right

### Problem: API Errors in Console

**Check:**
1. The API route file exists at: `src/app/api/keystatic/[...params]/route.ts`
2. The syntax is correct: `makeRouteHandler({ config: keystaticConfig })`
3. The config file exports correctly: `export default config({ ... })`

### Problem: Cannot Save Content

**Check:**
1. The `src/content/stories/` directory exists
2. The directory has write permissions
3. You're running the dev server (not trying to edit files directly)

## Understanding the Folder Names

You might notice some unusual folder names like `[[...params]]` and `[...params]`. These are special Next.js syntax:

- `[[...params]]` - Optional catch-all route (matches `/keystatic` and `/keystatic/anything/here`)
- `[...params]` - Catch-all route (matches `/api/keystatic/anything/here`)

These allow Keystatic to handle all routes under `/keystatic` and `/api/keystatic` with a single file.

## Quick Reference

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Configuration | `keystatic.config.ts` | Defines content structure |
| Admin UI | `src/app/keystatic/[[...params]]/page.tsx` | Admin panel interface |
| API Handler | `src/app/api/keystatic/[...params]/route.ts` | Handles API requests |
| Content Storage | `src/content/stories/` | Where content files are saved |
| Image Storage | `public/images/stories/` | Where images are stored |

## Getting Help

If you're still experiencing issues:

1. Check the browser console (F12) for specific error messages
2. Verify all three required files exist and have the correct content
3. Ensure you've installed Keystatic packages:
   ```bash
   npm install @keystatic/core @keystatic/next
   ```
4. Check the [official Keystatic documentation](https://keystatic.com/docs)
5. Restart your development server after making changes

## Summary

The key points to remember:

✅ **Always include `'use client'`** in your Keystatic page component  
✅ **Use correct syntax** for `makeRouteHandler({ config: ... })`  
✅ **Create required directories** before using Keystatic  
✅ **Use consistent naming** for imports  
✅ **Access the admin panel** at `http://localhost:3000/keystatic`

With these fixes applied, Keystatic should work correctly in your Next.js 15 App Router project!
