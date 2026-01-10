# Temporary Use Policy Stories Website

A Next.js 15 application showcasing temporary use policy stories, integrated with Keystatic CMS for content management.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Keystatic Integration](#keystatic-integration)
- [Routing System](#routing-system)
- [Font Configuration](#font-configuration)
- [Image Handling](#image-handling)
- [Content Structure](#content-structure)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

## Project Overview

This website displays "Good Practices" stories about temporary use policies from various European cities. Content is managed through Keystatic CMS, allowing non-technical users to edit stories via a web interface.

**Key Features:**
- Homepage with story cards grid
- Individual story pages with full content
- Keystatic admin panel at `/keystatic`
- ID-based routing system (numeric IDs: 001, 002, 003, etc.)
- Server-side rendering with Next.js App Router
- Responsive design with Tailwind CSS

## Technology Stack

- **Framework:** Next.js 16.1.1 (App Router)
- **React:** 19.2.3
- **TypeScript:** 5.x
- **CMS:** Keystatic (@keystatic/core: 0.5.48, @keystatic/next: 5.0.4)
- **Styling:** Tailwind CSS 4
- **Markdown Rendering:** react-markdown 10.1.0
- **Date Formatting:** date-fns 4.1.0

## Project Structure

```
temporary_stories/
├── public/
│   └── images/
│       └── stories/
│           ├── 001/
│           │   └── image.png          # Story 001 cover image
│           ├── 002/
│           │   └── cover.avif         # Story 002 cover image
│           └── [003-011]/             # Similar structure for other stories
│               └── cover.avif
│
├── src/
│   ├── app/                           # Next.js App Router pages
│   │   ├── layout.tsx                 # Root layout with fonts, Header, Footer
│   │   ├── page.tsx                   # Homepage with story cards grid
│   │   ├── globals.css                # Global styles, Tailwind imports, prose overrides
│   │   │
│   │   ├── api/
│   │   │   └── keystatic/
│   │   │       └── [...params]/
│   │   │           └── route.ts       # Keystatic API handler (REQUIRED for admin panel)
│   │   │
│   │   ├── keystatic/
│   │   │   └── [[...params]]/         # Catch-all route for Keystatic UI
│   │   │       └── page.tsx           # Keystatic admin panel (MUST have 'use client')
│   │   │
│   │   ├── stories/
│   │   │   └── [id]/                  # Dynamic route for individual stories
│   │   │       └── page.tsx           # Story detail page (uses numeric ID)
│   │   │
│   │   ├── about/
│   │   │   └── page.tsx               # About page placeholder
│   │   └── contact/
│   │       └── page.tsx               # Contact page placeholder
│   │
│   ├── components/
│   │   ├── Header.tsx                 # Site header with navigation
│   │   ├── Footer.tsx                 # Site footer with contact info
│   │   └── StoryCard.tsx              # Story card component for homepage
│   │
│   ├── content/
│   │   └── stories/                   # Keystatic content directory
│   │       ├── 001.mdx                # Story files (ID-based naming)
│   │       ├── 002.mdx
│   │       └── [003-011].mdx
│   │
│   └── lib/
│       └── keystatic.ts               # Keystatic reader utilities
│
├── keystatic.config.ts                # Keystatic configuration (CRITICAL)
├── tsconfig.json                      # TypeScript config with path aliases
├── next.config.ts                     # Next.js configuration
├── package.json                       # Dependencies
└── README.md                          # This file
```

### Critical Paths

**Keystatic Configuration:**
- Config file: `keystatic.config.ts` (project root)
- Content directory: `src/content/stories/*`
- Image directory: `public/images/stories/`
- Admin panel: `src/app/keystatic/[[...params]]/page.tsx` (MUST have `'use client'`)
- API handler: `src/app/api/keystatic/[...params]/route.ts`

**Routing:**
- Homepage: `src/app/page.tsx`
- Story pages: `src/app/stories/[id]/page.tsx`
- Admin panel: `/keystatic` (accesses `src/app/keystatic/[[...params]]/page.tsx`)
- API endpoint: `/api/keystatic/*` (accesses `src/app/api/keystatic/[...params]/route.ts`)

**Content:**
- Story MDX files: `src/content/stories/{id}.mdx` (e.g., `001.mdx`, `002.mdx`)
- Story images: `public/images/stories/{id}/cover.avif` (or `cover.jpg`)

## Keystatic Integration

### Configuration File: `keystatic.config.ts`

```typescript
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',  // Files are stored in git
  },
  collections: {
    stories: collection({
      label: 'Stories',
      slugField: 'id',  // Uses 'id' field as the slug (not auto-generated)
      path: 'src/content/stories/*',  // Where MDX files are stored
      format: { contentField: 'content' },  // MDX content field
      schema: {
        id: fields.text({  // REQUIRED: Numeric ID like "001", "002"
          label: 'ID',
          description: 'Unique identifier (e.g., "001", "002", "003")',
          validation: { length: { min: 1 } },
        }),
        title: fields.text({  // Regular text field (NOT slug)
          label: 'Title',
          validation: { length: { min: 1 } },
        }),
        summary: fields.text({
          label: 'Summary',
          multiline: true,
        }),
        date: fields.date({
          label: 'Publication Date',
        }),
        image: fields.image({
          label: 'Cover Image',
          directory: 'public/images/stories',  // Base directory
          publicPath: '/images/stories',  // Public URL path
        }),
        content: fields.mdx({
          label: 'Main Content',
        }),
      },
    }),
  },
});
```

### Key Keystatic Concepts

1. **ID-Based System:** Stories use numeric IDs (001, 002, 003) stored in the `id` field. The `slugField: 'id'` configuration tells Keystatic to use this field as the filename/slug.

2. **File Naming:** Story files are named after their ID (e.g., `001.mdx`, `002.mdx`). Keystatic generates these filenames based on the `id` field value.

3. **Storage Type:** `local` means files are stored directly in the repository (not in a database). Changes are committed to git.

4. **Content Field:** The `format: { contentField: 'content' }` tells Keystatic that the MDX content goes in a `content` field in the frontmatter.

### Admin Panel Setup

**Location:** `src/app/keystatic/[[...params]]/page.tsx`

**Critical:** This file MUST have `'use client'` directive at the top because Keystatic UI requires client-side rendering.

```typescript
'use client';  // REQUIRED - Keystatic UI needs client-side rendering

import { makePage } from '@keystatic/next/ui/app';
import keystaticConfig from '../../../../keystatic.config';

export default makePage(keystaticConfig);
```

**API Route:** `src/app/api/keystatic/[...params]/route.ts`

```typescript
import { makeRouteHandler } from '@keystatic/next/route-handler';
import keystaticConfig from '../../../../../keystatic.config';

export const { POST, GET } = makeRouteHandler({ config: keystaticConfig });
```

**Access:** Navigate to `http://localhost:3000/keystatic` to access the admin panel.

### Data Fetching: `src/lib/keystatic.ts`

This file contains utility functions to read content from Keystatic:

```typescript
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

export const reader = createReader(process.cwd(), keystaticConfig);

export async function getAllStories() {
  const stories = await reader.collections.stories.all();
  // Maps stories and returns with ID for routing
}

export async function getStoryById(id: string) {
  // Finds story by matching slug (which equals the ID field value)
  // Reads raw MDX content from file system for react-markdown
}
```

**Important Notes:**
- `story.slug` in Keystatic equals the filename (e.g., "001" for file `001.mdx`)
- When `slugField: 'id'`, the slug matches the `id` field value
- `getStoryById` uses `reader.collections.stories.all()` and finds by `story.slug === id`
- Raw markdown is read directly from the file system for `react-markdown` rendering

**Raw Markdown Extraction Logic:**
The `getStoryById` function reads the MDX file directly using Node.js `fs.readFileSync` to extract raw markdown:
1. Reads file: `src/content/stories/{id}.mdx`
2. Finds the second `---` line (end of frontmatter)
3. Extracts everything after frontmatter as `rawMarkdown`
4. Passes `rawMarkdown` to `react-markdown` for rendering

This approach avoids issues with Keystatic's MDX component rendering and ensures reliable Markdown-to-HTML conversion.

## Routing System

### ID-Based Routing

Stories use numeric IDs instead of title-based slugs for simplicity and reliability:

- **URL Pattern:** `/stories/001`, `/stories/002`, etc.
- **Route Handler:** `src/app/stories/[id]/page.tsx`
- **Static Generation:** Uses `generateStaticParams()` to pre-render all story pages

### Route Structure

```
/                          → Homepage (src/app/page.tsx)
/stories/[id]              → Individual story (src/app/stories/[id]/page.tsx)
  ├── /stories/001         → Story with ID "001"
  ├── /stories/002         → Story with ID "002"
  └── ...

/about                     → About page (src/app/about/page.tsx)
/contact                   → Contact page (src/app/contact/page.tsx)
/keystatic                 → Keystatic admin panel (src/app/keystatic/[[...params]]/page.tsx)
/api/keystatic/*           → Keystatic API (src/app/api/keystatic/[...params]/route.ts)
```

### Dynamic Route: `src/app/stories/[id]/page.tsx`

```typescript
export async function generateStaticParams() {
  const stories = await getAllStories();
  return stories.map((story) => ({
    id: story.id,  // Returns [{ id: "001" }, { id: "002" }, ...]
  }));
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStoryById(id);
  // Renders story content with react-markdown
}
```

**Key Points:**
- `params` is a Promise in Next.js 15 (must await)
- Uses `getStoryById(id)` to fetch story data
- Returns 404 if story not found (`notFound()`)
- Renders MDX content using `react-markdown` for reliable formatting

## Font Configuration

### Font Setup in `src/app/layout.tsx`

The project uses Next.js Google Fonts optimization:

```typescript
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

Fonts are applied via CSS variables:
- `--font-geist-sans` → Used for body text
- `--font-geist-mono` → Used for code/monospace text

### Font Usage in CSS: `src/app/globals.css`

```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  font-family: Arial, Helvetica, sans-serif;  // Fallback font
}
```

**Note:** The body uses Arial as fallback, but Tailwind classes can use the Geist fonts via the CSS variables. The fonts are loaded and optimized by Next.js automatically.

## Image Handling

### Image Structure

Images are stored in the `public` directory for direct static serving:

```
public/images/stories/
├── 001/
│   └── image.png          # Original Riga story image
├── 002/
│   └── cover.avif         # Story 002 cover (AVIF format)
└── [003-011]/
    └── cover.avif         # Other story covers
```

### Image Paths in MDX

Story MDX files reference images in frontmatter:

```yaml
---
id: "002"
title: "Story Title"
image: /images/stories/002/cover.avif
---
```

### Image Component Usage

Next.js `Image` component is used in `StoryCard.tsx` and story pages:

```typescript
<Image
  src={story.image}  // e.g., "/images/stories/002/cover.avif"
  alt={story.title}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
/>
```

**Supported Formats:** `.jpg`, `.jpeg`, `.png`, `.avif`, `.webp` (Next.js optimizes all formats)

**Keystatic Image Field:**
- `directory: 'public/images/stories'` - Base directory for Keystatic admin
- `publicPath: '/images/stories'` - Public URL prefix
- Images uploaded via Keystatic admin are stored in subdirectories automatically

## Content Structure

### MDX File Format

Story files (`src/content/stories/{id}.mdx`) follow this structure:

```markdown
---
id: "002"
title: "Story Title"
summary: "Short summary text (1-2 sentences)"
date: 2025-11-05
image: /images/stories/002/cover.avif
---

Main content here in Markdown format.

Multiple paragraphs are separated by blank lines.

## Headings work as expected

- Lists work
- With proper formatting

More content...
```

**Key Points:**
- Frontmatter uses YAML format
- `id` field must match filename (without extension)
- Content after frontmatter is standard Markdown
- Blank lines create paragraph breaks (important for `react-markdown`)
- Headings use `##` for h2, `###` for h3, etc.

### Content Rendering

Stories are rendered using `react-markdown` for reliable Markdown-to-HTML conversion:

```typescript
import ReactMarkdown from 'react-markdown';

<ReactMarkdown>{story.rawMarkdown}</ReactMarkdown>
```

The `rawMarkdown` is extracted from the MDX file by reading it directly from the file system (see `getStoryById` in `src/lib/keystatic.ts`).

## Common Issues & Troubleshooting

### Issue: Keystatic Admin Panel Shows Black Screen

**Solution:**
1. Ensure `src/app/keystatic/[[...params]]/page.tsx` has `'use client'` at the top
2. Verify `keystatic.config.ts` is in project root
3. Check that API route exists at `src/app/api/keystatic/[...params]/route.ts`
4. Restart dev server: `npm run dev`

### Issue: YAML Parsing Errors

**Symptom:** `YAMLException: bad indentation` or similar errors

**Solution:**
- Titles with colons must be quoted: `title: "ADULM: Strategic Actor"`
- Titles with special characters should be quoted: `title: "Spółdzielnia / Cooperative"`
- Check frontmatter indentation (use 2 spaces, no tabs)
- Ensure no extra blank lines in frontmatter

### Issue: Story Pages Return 404

**Symptom:** Homepage shows stories, but clicking leads to 404

**Solution:**
1. Verify story files are named correctly: `001.mdx`, `002.mdx`, etc.
2. Check that `id` field in frontmatter matches filename
3. Ensure `getStoryById` uses `story.slug` (which equals filename)
4. Clear Next.js cache: Delete `.next` folder and restart server
5. Check `generateStaticParams()` returns correct IDs

### Issue: Images Not Displaying

**Solution:**
1. Verify image paths in MDX frontmatter: `/images/stories/{id}/cover.avif`
2. Check images exist in `public/images/stories/{id}/` directory
3. Ensure image filenames match paths in frontmatter
4. Next.js serves files from `public/` directory automatically
5. Check browser console for 404 errors on image requests

### Issue: MDX Content Renders as Raw Markdown

**Symptom:** See `## Heading` instead of formatted heading

**Solution:**
- Ensure `react-markdown` is installed: `npm install react-markdown`
- Verify `getStoryById` extracts `rawMarkdown` from file
- Check that content has blank lines between paragraphs
- Ensure `ReactMarkdown` component is used (not Keystatic's MDX component directly)

### Issue: Text Color Not Black on Story Pages

**Symptom:** Story content appears gray instead of black

**Solution:**
- Check `src/app/globals.css` has `!important` rules for `.prose` elements
- Verify CSS classes in story page: `prose prose-lg max-w-none`
- Use browser DevTools to check if Tailwind Typography styles are overriding
- Hard refresh browser (Ctrl+Shift+R) to clear cache

### Issue: Paragraphs Not Breaking

**Symptom:** All text appears as one paragraph

**Solution:**
- Ensure blank lines between paragraphs in MDX content
- Check that `react-markdown` is rendering content (not showing raw markdown)
- Verify `rawMarkdown` extraction in `getStoryById` correctly splits frontmatter
- Check CSS spacing rules in `globals.css` for `.prose p`

### Issue: Fonts Not Loading

**Solution:**
1. Verify fonts are imported in `src/app/layout.tsx`
2. Check CSS variables are set in `globals.css`
3. Ensure `next/font/google` is working (check Network tab for font requests)
4. Fonts load asynchronously - may take a moment on first load

### Issue: TypeScript Errors

**Common Fixes:**
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` path aliases: `"@/*": ["./src/*"]`
- Verify import paths use `@/` alias (e.g., `import Header from '@/components/Header'`)
- Restart TypeScript server in IDE

### Issue: Build Errors

**Solution:**
1. Clear `.next` folder: `rm -rf .next` (or `Remove-Item -Recurse .next` on Windows)
2. Clear `node_modules`: `rm -rf node_modules && npm install`
3. Check for syntax errors in recent changes
4. Verify all required files exist (especially Keystatic routes)
5. Check Node.js version (requires Node 18+)

## Development Workflow

### Adding a New Story

1. **Via Keystatic Admin (Recommended):**
   - Navigate to `/keystatic`
   - Click "Stories" → "Create entry"
   - Enter ID (e.g., "012")
   - Fill in title, summary, date, upload image, write content
   - Save (creates `012.mdx` automatically)

2. **Manually:**
   - Create file: `src/content/stories/012.mdx`
   - Add frontmatter with `id: "012"`
   - Add content in Markdown
   - Place image in `public/images/stories/012/cover.avif`
   - Update frontmatter with image path

### Editing Stories

- **Via Admin:** `/keystatic` → Select story → Edit → Save
- **Via Code:** Edit `src/content/stories/{id}.mdx` directly
- Changes appear after page refresh (hot reload works for content)

### Updating Images

1. Replace image file: `public/images/stories/{id}/cover.avif`
2. OR use Keystatic admin: Edit story → Change image → Save
3. Clear Next.js image cache if needed (restart server)

## Key Technical Decisions

1. **ID-Based Routing:** Chosen over slug-based for simplicity and reliability. IDs are short, URL-safe, and predictable.

2. **react-markdown:** Used instead of Keystatic's MDX component for more control over rendering and to avoid "cannot pass functions to client components" errors.

3. **Local Storage:** Keystatic uses `local` storage (files in git) rather than database for version control and simplicity.

4. **Server Components:** All pages are server components by default. Only Keystatic admin panel needs `'use client'`.

5. **AVIF Images:** Modern format for better compression, supported by Next.js Image component.

6. **Tailwind Typography:** Used for story content styling with custom overrides to ensure black text on white background.

## Code Examples

### Story Page Rendering Logic

The story page (`src/app/stories/[id]/page.tsx`) uses a fallback chain for rendering content:

```typescript
{story.rawMarkdown ? (
  <ReactMarkdown>{story.rawMarkdown}</ReactMarkdown>
) : story.content && typeof story.content === 'function' ? (
  <story.content />
) : typeof story.content === 'string' ? (
  <ReactMarkdown>{story.content}</ReactMarkdown>
) : (
  <div>Content not available</div>
)}
```

This ensures content renders even if rawMarkdown extraction fails, with multiple fallback options.

### CSS Prose Overrides

The `globals.css` file contains important overrides for Tailwind Typography to ensure proper formatting:

```css
/* Force black text in story prose content */
.prose p, .prose li, .prose strong {
  color: #000000 !important;
}

/* Ensure proper paragraph spacing */
.prose p {
  margin-top: 1em !important;
  margin-bottom: 1em !important;
  display: block !important;
}
```

The `!important` flags are necessary to override Tailwind Typography's default gray text color.

## File Naming Conventions

- **Story Files:** `{id}.mdx` where id is zero-padded (001, 002, ..., 011)
- **Image Files:** `cover.avif` or `cover.jpg` in `public/images/stories/{id}/`
- **Components:** PascalCase (`StoryCard.tsx`, `Header.tsx`)
- **Utilities:** camelCase (`keystatic.ts`, `utils.ts`)

## Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

Use `@/` prefix for imports: `import Header from '@/components/Header'`

## Additional Resources

- [Keystatic Documentation](https://keystatic.com/docs)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [react-markdown](https://github.com/remarkjs/react-markdown)

---

**Last Updated:** 2025-01-XX  
**Maintainer:** Project IMPETUS
