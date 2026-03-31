'use client';

import { useI18n } from '@/components/I18nProvider';

export function HomeHero() {
  const { t } = useI18n();
  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl sm:text-5xl font-extrabold text-content-primary mb-4">
        {t.heroTitle}<span className="text-blue-500 dark:text-blue-400">{t.heroHighlight}</span>
      </h2>
      <p className="text-lg text-content-secondary max-w-2xl mx-auto">
        {t.heroDesc}
      </p>
    </div>
  );
}

export function HomeFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-content-muted">
          <p>{t.dataSource}</p>
          <p className="mt-1">{t.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}

export function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🔄</div>
      <h3 className="text-xl font-semibold text-content-primary mb-2">{t.emptyTitle}</h3>
      <p className="text-content-secondary mb-6">{t.emptyDesc}</p>
      <code className="bg-surface-card text-blue-500 dark:text-blue-400 px-4 py-2 rounded-lg text-sm border border-border">
        python3 scripts/fetch_data.py
      </code>
    </div>
  );
}
