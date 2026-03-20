import { getAllDates, getBarometerData } from '@/lib/data';
import BarometerClient from './BarometerClient';
import Link from 'next/link';

export async function generateStaticParams() {
  const dates = getAllDates();
  return dates.map((date) => ({ date }));
}

export default function BarometerPage({ params }: { params: { date: string } }) {
  const data = getBarometerData(params.date);
  const allDates = getAllDates();
  const currentIndex = allDates.indexOf(params.date);
  const prevDate = currentIndex < allDates.length - 1 ? allDates[currentIndex + 1] : null;
  const nextDate = currentIndex > 0 ? allDates[currentIndex - 1] : null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📭</div>
          <h1 className="text-2xl font-bold text-content-primary mb-2">未找到数据</h1>
          <p className="text-content-secondary mb-6">日期 {params.date} 的晴雨表数据不存在</p>
          <Link href="/" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
            ← 返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-[var(--header-bg)] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="text-2xl">📊</span>
              <div>
                <h1 className="text-lg font-bold text-content-primary">投资晴雨表</h1>
                <p className="text-xs text-content-muted">NASDAQ & S&P 500</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {prevDate && (
                <Link
                  href={`/barometer/${prevDate}/`}
                  className="text-sm text-content-muted hover:text-content-primary px-3 py-1.5 rounded-lg hover:bg-surface-card transition-colors"
                >
                  ← {prevDate}
                </Link>
              )}
              <span className="text-sm text-content-primary font-medium px-3 py-1.5 bg-surface-card rounded-lg border border-border">
                {params.date}
              </span>
              {nextDate && (
                <Link
                  href={`/barometer/${nextDate}/`}
                  className="text-sm text-content-muted hover:text-content-primary px-3 py-1.5 rounded-lg hover:bg-surface-card transition-colors"
                >
                  {nextDate} →
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <BarometerClient data={data} />
    </div>
  );
}
