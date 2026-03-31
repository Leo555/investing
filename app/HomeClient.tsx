'use client';

import Link from 'next/link';
import { BarometerSummary } from '@/lib/types';
import { ThemeToggle } from '@/components/ThemeProvider';
import { useI18n } from '@/components/I18nProvider';
import { getDateLocale } from '@/lib/i18n';

export default function HomeClient({ summaries }: { summaries: BarometerSummary[] }) {
  const { t, locale } = useI18n();
  const dateLoc = getDateLocale(locale);
  const latestSummary = summaries[0];

  const getSentimentConfig = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return { label: t.bullish, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', emoji: '🔴' };
      case 'bearish':
        return { label: t.bearish, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', emoji: '🟢' };
      default:
        return { label: t.neutral, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', emoji: '🟡' };
    }
  };

  const weekdays = locale === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div>
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {latestSummary && (
        <div className="mb-10">
          <h3 className="text-sm font-medium text-content-muted uppercase tracking-wider mb-4">{t.latestBarometer}</h3>
          <Link href={`/barometer/${latestSummary.date}/`}>
            <div className="bg-gradient-to-r from-surface-card to-surface-secondary border border-border rounded-2xl p-6 sm:p-8 card-hover cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="text-sm text-content-secondary mb-1">{latestSummary.date}</div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`sentiment-badge ${
                      latestSummary.overallSentiment === 'bullish' ? 'sentiment-bullish' :
                      latestSummary.overallSentiment === 'bearish' ? 'sentiment-bearish' :
                      'sentiment-neutral'
                    }`}>
                      {getSentimentConfig(latestSummary.overallSentiment).emoji}{' '}
                      {getSentimentConfig(latestSummary.overallSentiment).label}
                      {' '}({latestSummary.sentimentScore > 0 ? '+' : ''}{latestSummary.sentimentScore})
                    </span>
                    {latestSummary.vix && (
                      <span className="text-xs text-content-muted">VIX: {latestSummary.vix}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-8">
                  <IndexMini name="NASDAQ" price={latestSummary.nasdaqPrice} change={latestSummary.nasdaqChange} changePercent={latestSummary.nasdaqChangePercent} />
                  <IndexMini name="S&P 500" price={latestSummary.sp500Price} change={latestSummary.sp500Change} changePercent={latestSummary.sp500ChangePercent} />
                </div>
              </div>
              <div className="mt-4 text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                {t.viewDetail}
              </div>
            </div>
          </Link>
        </div>
      )}

      <h3 className="text-sm font-medium text-content-muted uppercase tracking-wider mb-4">{t.historyRecords}</h3>
      <div className="space-y-3">
        {summaries.map((summary) => {
          const config = getSentimentConfig(summary.overallSentiment);
          const d = new Date(summary.date + 'T00:00:00');
          return (
            <Link key={summary.date} href={`/barometer/${summary.date}/`}>
              <div className="bg-surface-card border border-border rounded-xl p-4 sm:p-5 card-hover cursor-pointer mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold text-content-primary">{d.getDate()}</div>
                      <div className="text-xs text-content-secondary">
                        {d.toLocaleDateString(dateLoc, { month: 'short' })}
                      </div>
                      <div className="text-xs text-content-muted">{weekdays[d.getDay()]}</div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                        {config.emoji} {config.label}
                      </span>
                      <div className="text-xs text-content-muted mt-1">
                        {t.sentimentScore}: {summary.sentimentScore > 0 ? '+' : ''}{summary.sentimentScore} | {t.news}: {summary.newsCount}{t.newsCount}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 sm:gap-8">
                    <IndexMini name="NASDAQ" price={summary.nasdaqPrice} change={summary.nasdaqChange} changePercent={summary.nasdaqChangePercent} />
                    <IndexMini name="S&P 500" price={summary.sp500Price} change={summary.sp500Change} changePercent={summary.sp500ChangePercent} />
                    {summary.vix && (
                      <div className="hidden sm:block min-w-[70px]">
                        <div className="text-xs text-content-secondary">VIX</div>
                        <div className={`text-sm font-bold ${
                          summary.vix > 25 ? 'text-red-600 dark:text-red-400' :
                          summary.vix > 20 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-content-primary'
                        }`}>{summary.vix.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function IndexMini({ name, price, change, changePercent }: { name: string; price: number; change: number; changePercent: number }) {
  const isPositive = change >= 0;
  const color = isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <div className="min-w-[100px]">
      <div className="text-xs text-content-secondary">{name}</div>
      <div className="text-base font-bold text-content-primary">
        {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={`text-xs font-medium ${color}`}>
        {arrow} {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
      </div>
    </div>
  );
}
