'use client';

import Link from 'next/link';
import { BarometerSummary } from '@/lib/types';
import { Sparkline } from '@/components/Charts';

export default function HomeClient({ summaries }: { summaries: BarometerSummary[] }) {
  const latestSummary = summaries[0];

  const getSentimentConfig = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return { label: '看涨', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', emoji: '🟢' };
      case 'bearish':
        return { label: '看跌', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', emoji: '🔴' };
      default:
        return { label: '中性', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', emoji: '🟡' };
    }
  };

  return (
    <div>
      {/* 最新摘要卡片 */}
      {latestSummary && (
        <div className="mb-10">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">最新晴雨表</h3>
          <Link href={`/barometer/${latestSummary.date}/`}>
            <div className="bg-gradient-to-r from-[#1a2332] to-[#111827] border border-[#1e293b] rounded-2xl p-6 sm:p-8 card-hover cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">{latestSummary.date}</div>
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
                      <span className="text-xs text-slate-400">
                        VIX: {latestSummary.vix}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-8">
                  <IndexMini
                    name="NASDAQ"
                    price={latestSummary.nasdaqPrice}
                    change={latestSummary.nasdaqChange}
                    changePercent={latestSummary.nasdaqChangePercent}
                  />
                  <IndexMini
                    name="S&P 500"
                    price={latestSummary.sp500Price}
                    change={latestSummary.sp500Change}
                    changePercent={latestSummary.sp500ChangePercent}
                  />
                </div>
              </div>
              <div className="mt-4 text-xs text-blue-400 flex items-center gap-1">
                查看详细晴雨表 →
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 历史列表 */}
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">历史记录</h3>
      <div className="space-y-3">
        {summaries.map((summary) => {
          const config = getSentimentConfig(summary.overallSentiment);
          return (
            <Link key={summary.date} href={`/barometer/${summary.date}/`}>
              <div className="bg-[#1a2332] border border-[#1e293b] rounded-xl p-4 sm:p-5 card-hover cursor-pointer mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* 左侧: 日期和情绪 */}
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold text-white">
                        {new Date(summary.date + 'T00:00:00').getDate()}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(summary.date + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'short' })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {['日', '一', '二', '三', '四', '五', '六'][new Date(summary.date + 'T00:00:00').getDay()]}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                        {config.emoji} {config.label}
                      </span>
                      <div className="text-xs text-slate-500 mt-1">
                        情绪分: {summary.sentimentScore > 0 ? '+' : ''}{summary.sentimentScore} | 新闻: {summary.newsCount}条
                      </div>
                    </div>
                  </div>

                  {/* 右侧: 指数数据 */}
                  <div className="flex gap-6 sm:gap-8">
                    <IndexMini
                      name="NASDAQ"
                      price={summary.nasdaqPrice}
                      change={summary.nasdaqChange}
                      changePercent={summary.nasdaqChangePercent}
                    />
                    <IndexMini
                      name="S&P 500"
                      price={summary.sp500Price}
                      change={summary.sp500Change}
                      changePercent={summary.sp500ChangePercent}
                    />
                    {summary.vix && (
                      <div className="hidden sm:block min-w-[70px]">
                        <div className="text-xs text-slate-400">VIX</div>
                        <div className={`text-sm font-bold ${
                          summary.vix > 25 ? 'text-red-400' :
                          summary.vix > 20 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {summary.vix.toFixed(2)}
                        </div>
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

function IndexMini({
  name,
  price,
  change,
  changePercent,
}: {
  name: string;
  price: number;
  change: number;
  changePercent: number;
}) {
  const isPositive = change >= 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <div className="min-w-[100px]">
      <div className="text-xs text-slate-400">{name}</div>
      <div className="text-base font-bold text-white">
        {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={`text-xs font-medium ${color}`}>
        {arrow} {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
      </div>
    </div>
  );
}
