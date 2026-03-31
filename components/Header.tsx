'use client';

import Link from 'next/link';
import { useI18n } from './I18nProvider';
import { LocaleToggle } from './I18nProvider';

export function HomeHeader() {
  const { t } = useI18n();

  return (
    <header className="border-b border-border bg-[var(--header-bg)] backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h1 className="text-lg font-bold text-content-primary">{t.siteName}</h1>
              <p className="text-xs text-content-muted">{t.siteSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LocaleToggle />
            <a
              href="https://github.com/Leo555/investing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-content-muted hover:text-content-primary transition-colors text-sm"
            >
              {t.github}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export function BarometerHeader({
  date,
  prevDate,
  nextDate,
}: {
  date: string;
  prevDate: string | null;
  nextDate: string | null;
}) {
  const { t } = useI18n();

  return (
    <header className="border-b border-border bg-[var(--header-bg)] backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity shrink-0">
            <span className="text-xl sm:text-2xl">📊</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-content-primary leading-tight">{t.siteName}</h1>
              <p className="text-[10px] sm:text-xs text-content-muted hidden sm:block">{t.siteSubtitle}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              {prevDate && (
                <Link
                  href={`/barometer/${prevDate}/`}
                  className="text-content-muted hover:text-content-primary px-2 sm:px-3 py-1.5 rounded-lg hover:bg-surface-card transition-colors whitespace-nowrap"
                >
                  ← <span className="hidden sm:inline">{prevDate}</span><span className="sm:hidden">{prevDate.slice(5)}</span>
                </Link>
              )}
              <span className="text-content-primary font-medium px-2 sm:px-3 py-1.5 bg-surface-card rounded-lg border border-border whitespace-nowrap">
                <span className="hidden sm:inline">{date}</span><span className="sm:hidden">{date.slice(5)}</span>
              </span>
              {nextDate && (
                <Link
                  href={`/barometer/${nextDate}/`}
                  className="text-content-muted hover:text-content-primary px-2 sm:px-3 py-1.5 rounded-lg hover:bg-surface-card transition-colors whitespace-nowrap"
                >
                  <span className="hidden sm:inline">{nextDate}</span><span className="sm:hidden">{nextDate.slice(5)}</span> →
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
