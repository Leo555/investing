'use client';

import Link from 'next/link';
import { useI18n, LocaleToggle } from './I18nProvider';
import { ThemeToggle } from './ThemeProvider';

function SiteLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className}>
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1e40af' }} />
          <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
        </linearGradient>
        <linearGradient id="logo-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#34d399' }} />
          <stop offset="100%" style={{ stopColor: '#fbbf24' }} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#logo-bg)" />
      <polyline points="80,360 160,320 240,340 320,240 400,180 440,120" fill="none" stroke="url(#logo-line)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="440" cy="120" r="20" fill="#fbbf24" />
      <circle cx="440" cy="120" r="32" fill="#fbbf24" opacity="0.3" />
      <rect x="80" y="390" width="48" height="50" rx="8" fill="white" opacity="0.25" />
      <rect x="160" y="370" width="48" height="70" rx="8" fill="white" opacity="0.3" />
      <rect x="240" y="380" width="48" height="60" rx="8" fill="white" opacity="0.25" />
      <rect x="320" y="350" width="48" height="90" rx="8" fill="white" opacity="0.35" />
      <rect x="400" y="330" width="48" height="110" rx="8" fill="white" opacity="0.4" />
    </svg>
  );
}

export function HomeHeader() {
  const { t } = useI18n();

  return (
    <header className="border-b border-border bg-[var(--header-bg)] backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <SiteLogo className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-content-primary">{t.siteName}</h1>
              <p className="text-xs text-content-muted">{t.siteSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
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
            <SiteLogo className="w-6 h-6 sm:w-8 sm:h-8" />
            <div>
              <h1 className="text-sm sm:text-lg font-bold text-content-primary leading-tight">{t.siteName}</h1>
              <p className="text-[10px] sm:text-xs text-content-muted hidden sm:block">{t.siteSubtitle}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <LocaleToggle />
            <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              {prevDate && (
                <Link href={`/barometer/${prevDate}/`} className="text-content-muted hover:text-content-primary px-1.5 sm:px-3 py-1.5 rounded-lg hover:bg-surface-card transition-colors whitespace-nowrap">
                  <span className="hidden sm:inline">← {prevDate}</span>
                  <span className="sm:hidden text-base">←</span>
                </Link>
              )}
              <span className="text-content-primary font-medium px-2 sm:px-3 py-1.5 bg-surface-card rounded-lg border border-border whitespace-nowrap">
                <span className="hidden sm:inline">{date}</span><span className="sm:hidden">{date.slice(5)}</span>
              </span>
              {nextDate && (
                <Link href={`/barometer/${nextDate}/`} className="text-content-muted hover:text-content-primary px-1.5 sm:px-3 py-1.5 rounded-lg hover:bg-surface-card transition-colors whitespace-nowrap">
                  <span className="hidden sm:inline">{nextDate} →</span>
                  <span className="sm:hidden text-base">→</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
