import { createReader } from '@keystatic/core/reader';
import { readFileSync } from 'fs';
import { join } from 'path';
import keystaticConfig from '../../keystatic.config';

// This code only runs at BUILD TIME (during static generation via generateStaticParams)
// It never runs at runtime, so fs is safe to use here
export const reader = createReader(process.cwd(), keystaticConfig);

export async function getAllStories() {
  try {
    const stories = await reader.collections.stories.all();
    
    return stories
      .map((story) => {
        // story.slug is the filename (e.g., "001"), which is what we use for routing
        // Use story.slug as the ID for routing (it's reliable and URL-safe)
        const id = story.slug;
        const entry = story.entry;
        
        // Normalize nullable fields to ensure type safety for StoryCard component
        return {
          id, // Use story.slug (filename-based) which is reliable
          entry: {
            ...entry,
            title: (entry.title ?? null) as string | null,
            summary: (entry.summary ?? null) as string | null,
            date: (entry.date ?? null) as string | null,
            image: (entry.image ?? null) as string | null,
          },
        };
      })
      .sort((a, b) => {
        // Handle null/undefined dates - put them at the end
        const dateA = a.entry.date ? new Date(a.entry.date).getTime() : 0;
        const dateB = b.entry.date ? new Date(b.entry.date).getTime() : 0;
        return dateB - dateA; // Sort by date, newest first
      });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

export async function getStoryById(id: string) {
  try {
    // Get all stories and find the matching one by slug
    // This is more reliable than read() when slugField might not match exactly
    const allStories = await reader.collections.stories.all();
    
    // Find story by matching slug (which should be the filename "001")
    const matchingStory = allStories.find(s => s.slug === id);
    
    if (!matchingStory) {
      return null;
    }
    
    const entry = matchingStory.entry;
    
    if (!entry || typeof entry !== 'object') {
      return null;
    }
    
    // Use the slug as the ID (it's the filename "001")
    const storyId = matchingStory.slug;
    
    // Read raw markdown from file at BUILD TIME (this only runs during static generation)
    // This is safe because generateStaticParams() runs at build time, not runtime
    let rawMarkdown: string | undefined;
    try {
      const filePath = join(process.cwd(), 'src', 'content', 'stories', `${storyId}.mdx`);
      const fileContent = readFileSync(filePath, 'utf-8');
      
      // Extract content after frontmatter (everything after the second --- line)
      const lines = fileContent.split('\n');
      let frontmatterEndIndex = -1;
      let dashCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          dashCount++;
          if (dashCount === 2) {
            frontmatterEndIndex = i;
            break;
          }
        }
      }
      
      if (frontmatterEndIndex !== -1) {
        rawMarkdown = lines.slice(frontmatterEndIndex + 1).join('\n').trim();
      } else {
        rawMarkdown = fileContent.trim();
      }
    } catch (e) {
      console.error(`Error reading MDX file for story ${storyId}:`, e);
      // Fallback: try to use entry.content if it's a string
      if (typeof entry.content === 'string') {
        rawMarkdown = entry.content;
      }
    }
    
    return {
      id: storyId,
      title: entry.title || '',
      summary: entry.summary || '',
      date: entry.date || '',
      image: entry.image || undefined,
      content: entry.content, // Keep original content (component or other)
      rawMarkdown: rawMarkdown, // Raw markdown string for react-markdown
    };
  } catch (error) {
    console.error(`Error fetching story with id ${id}:`, error);
    return null;
  }
}
