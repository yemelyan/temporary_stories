import { getAllStories } from '@/lib/keystatic';
import StoryCard from '@/components/StoryCard';

export default async function Home() {
  const stories = await getAllStories();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-[#003399] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Good Practices
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-blue-100 sm:text-xl">
            Explore inspiring and tested policy solutions for temporary use of
            spaces identified by our cooperation projects and beyond.
          </p>
        </div>
      </section>

      {/* Stories Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {stories.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-gray-600">
              No stories available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stories.map((story) => {
              const entry = story.entry;
              return (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={(entry.title as string | null | undefined) ?? null}
                  summary={(entry.summary as string | null | undefined) ?? null}
                  date={(entry.date as string | null | undefined) ?? null}
                  image={(entry.image as string | null | undefined) ?? null}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Newsletter
          </h2>
          <p className="mb-6 text-gray-600">
            Subscribe to receive new stories and project updates.
          </p>
          <div className="w-full overflow-hidden rounded-md bg-white shadow-sm">
            <iframe
              title="Newsletter signup form"
              width={540}
              height={305}
              src="https://fa742c10.sibforms.com/serve/MUIFAAPDvJ2bIHsokYbTs_DCjCjlLyomKSt1ETG2tIiFUScaKXgq7bpmbaZzrG3aFeaf71p20m4eqS8i9wbY5QdKgLrlvCTkoPIl9FzdpQ9fV_J0p_AgRe9zTKSLd0fNi2yHcPo1PzKZBu3LCfJKJIxbHRQPD_HcrZCXHXPlSOLtcPM90A1ziT0VvLFWcShajuLbRk-PRXfw1J6pgQ=="
              frameBorder="0"
              scrolling="auto"
              allowFullScreen
              style={{
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
                maxWidth: '100%',
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
