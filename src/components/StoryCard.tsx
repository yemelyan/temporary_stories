import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface StoryCardProps {
  id: string;
  title: string;
  summary: string;
  date: string;
  image?: string;
}

export default function StoryCard({
  id,
  title,
  summary,
  date,
  image,
}: StoryCardProps) {
  const formattedDate = format(new Date(date), 'dd MMM yyyy');

  return (
    <Link
      href={`/stories/${id}`}
      className="group relative block h-full overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
    >
      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-200">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-300">
            <svg
              className="h-12 w-12 text-gray-400"
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
        {/* Subtle overlay on hover - ensure it doesn't block clicks */}
        <div className="pointer-events-none absolute inset-0 bg-[#003399] opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
        {/* Optional icon badge - ensure it doesn't block clicks */}
        <div className="pointer-events-none absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <svg
            className="h-5 w-5 text-[#003399]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="mb-2 text-lg font-semibold leading-tight text-gray-900 transition-colors group-hover:text-[#003399]">
          {title}
        </h3>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
          {summary}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formattedDate}</span>
          <span className="font-medium">By project IMPETUS</span>
        </div>
      </div>
    </Link>
  );
}
