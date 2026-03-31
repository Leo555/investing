import { getAllBarometerSummaries } from '@/lib/data';
import HomeClient from './HomeClient';
import { HomeHeader } from '@/components/Header';
import { HomeHero, HomeFooter, EmptyState } from './HomeShell';

export default function HomePage() {
  const summaries = getAllBarometerSummaries();

  return (
    <div className="min-h-screen">
      <HomeHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HomeHero />

        {summaries.length === 0 ? (
          <EmptyState />
        ) : (
          <HomeClient summaries={summaries} />
        )}
      </main>

      <HomeFooter />
    </div>
  );
}
