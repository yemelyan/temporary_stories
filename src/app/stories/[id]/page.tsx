import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { getStoryById, getAllStories } from '@/lib/keystatic';

// This route is statically generated via generateStaticParams()
// Static routes should NOT use edge runtime - they're pre-rendered at build time
export async function generateStaticParams() {
  const stories = await getAllStories();
  return stories.map((story) => ({
    id: story.id,
  }));
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await getStoryById(id);

  if (!story) {
    notFound();
  }

  const formattedDate = story.date ? format(new Date(story.date), 'dd MMM yyyy') : null;

  return (
    <article className="bg-white">
      {/* Hero Section with Cover Image */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-gray-900">
        {story.image ? (
          <Image
            src={story.image}
            alt={story.title || 'Story cover image'}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-800">
            <svg
              className="h-24 w-24 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        {/* Title overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full bg-gradient-to-t from-black/80 to-transparent pb-12 pt-32">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl lg:text-6xl">
                {story.title || 'Untitled Story'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Metadata */}
        {formattedDate && (
          <div className="mb-8 flex flex-col gap-2 border-b border-gray-200 pb-8 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <time dateTime={story.date || ''}>{formattedDate}</time>
              <span className="hidden sm:inline">•</span>
              <span className="font-medium">By project IMPETUS</span>
            </div>
          </div>
        )}

        {/* Summary */}
        {story.summary && (
          <div className="mb-12 rounded-lg border-l-4 border-[#003399] bg-blue-50 p-6">
            <p className="text-lg leading-relaxed text-gray-800">
              {story.summary}
            </p>
          </div>
        )}

        {/* Main Content - MDX */}
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:!text-black prose-p:leading-relaxed prose-a:text-[#003399] prose-a:no-underline hover:prose-a:underline prose-strong:!text-black prose-ul:!text-black prose-li:!text-black prose-ol:!text-black prose-img:rounded-lg prose-img:shadow-md [&_p]:!text-black [&_strong]:!text-black [&_li]:!text-black [&_ul]:!text-black [&_ol]:!text-black [&_span]:!text-black [&_div]:!text-black [&_*:not(a)]:!text-black">
          {/* Render MDX content - use rawMarkdown if available, otherwise try component */}
          {story.rawMarkdown ? (
            <ReactMarkdown>{story.rawMarkdown}</ReactMarkdown>
          ) : story.content && typeof story.content === 'function' ? (
            <story.content />
          ) : story.content && React.isValidElement(story.content) ? (
            story.content
          ) : story.content && typeof story.content === 'object' && story.content !== null ? (
            (() => {
              const contentWithDefault = story.content as { default?: unknown };
              if ('default' in contentWithDefault) {
                const contentDefault = contentWithDefault.default;
                if (typeof contentDefault === 'function') {
                  const Component = contentDefault as React.ComponentType;
                  return <Component />;
                } else if (typeof contentDefault === 'string') {
                  return <ReactMarkdown>{contentDefault}</ReactMarkdown>;
                } else {
                  return <div className="text-black">{String(contentDefault || '')}</div>;
                }
              }
              return null;
            })()
          ) : typeof story.content === 'string' ? (
            <ReactMarkdown>{story.content}</ReactMarkdown>
          ) : (
            <div className="text-black">
              <p>Content not available</p>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-16 border-t border-gray-200 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#003399] transition-colors hover:text-[#002a7a]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            <span className="font-medium">Back to all stories</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
