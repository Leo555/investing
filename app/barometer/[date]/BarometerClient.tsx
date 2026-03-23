'use client';

import React from 'react';
import {
  SentimentGauge,
  ChangeDisplay,
  MetricCard,
  RSIIndicator,
  FearGreedGauge,
  SectorHeatmap,
  NewsCard,
  Sparkline,
  MAStatus,
} from '@/components/Charts';
import { ThemeToggle } from '@/components/ThemeProvider';
import { BarometerData } from '@/lib/types';

export default function BarometerClient({ data }: { data: BarometerData }) {
  const getSentimentClass = () => {
    switch (data.overallSentiment) {
      case 'bullish': return 'gradient-bull';
      case 'bearish': return 'gradient-bear';
      default: return 'gradient-neutral';
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 浮动主题切换按钮 */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* 顶部总览 */}
      <section className={`${getSentimentClass()} border border-border rounded-2xl p-6 sm:p-8 mb-8`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-center lg:text-left">
            <div className="text-sm text-content-secondary mb-1">
              {new Date(data.date + 'T00:00:00').toLocaleDateString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
              })}
            </div>
            <h2 className="text-3xl font-bold text-content-primary mb-2">市场晴雨表</h2>
            <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <span className={`sentiment-badge ${
                data.overallSentiment === 'bullish' ? 'sentiment-bullish' :
                data.overallSentiment === 'bearish' ? 'sentiment-bearish' :
                'sentiment-neutral'
              }`}>
                {data.overallSentiment === 'bullish' ? '🟢 看涨' :
                 data.overallSentiment === 'bearish' ? '🔴 看跌' : '🟡 中性'}
              </span>
              <span className="text-sm text-content-muted">
                更新于 {new Date(data.timestamp).toLocaleTimeString('zh-CN')}
              </span>
            </div>
          </div>
          <SentimentGauge score={data.sentimentScore} sentiment={data.overallSentiment} />
        </div>
      </section>

      {/* 指数概览 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <IndexCard index={data.nasdaq} />
        <IndexCard index={data.sp500} />
      </section>

      {/* 宏观指标 */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <span>🌍</span> 宏观指标
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard
            label="VIX 恐慌指数"
            value={data.indicators.vix}
            change={data.indicators.vixChange}
            description={
              data.indicators.vix
                ? data.indicators.vix > 30 ? '⚠️ 极度恐慌' :
                  data.indicators.vix > 20 ? '⚡ 波动偏高' : '✅ 市场平静'
                : undefined
            }
          />
          <MetricCard
            label="美元指数 (DXY)"
            value={data.indicators.dxy}
            change={data.indicators.dxyChange}
          />
          <MetricCard
            label="10年期美债收益率"
            value={data.indicators.us10y}
            change={data.indicators.us10yChange}
            format="percent"
          />
          <MetricCard
            label="2年期美债收益率"
            value={data.indicators.us2y}
            change={data.indicators.us2yChange}
            format="percent"
          />
          <MetricCard
            label="黄金 (GC)"
            value={data.indicators.gold}
            change={data.indicators.goldChange}
            format="currency"
          />
          <MetricCard
            label="原油 (CL)"
            value={data.indicators.oil}
            change={data.indicators.oilChange}
            format="currency"
          />
          <MetricCard
            label="比特币"
            value={data.indicators.btc}
            change={data.indicators.btcChange}
            format="currency"
          />
          {data.indicators.us10y && data.indicators.us2y && (
            <MetricCard
              label="利差 (10Y-2Y)"
              value={data.indicators.us10y - data.indicators.us2y}
              format="percent"
              description={
                (data.indicators.us10y - data.indicators.us2y) < 0
                  ? '⚠️ 收益率倒挂'
                  : '✅ 正常'
              }
            />
          )}
        </div>
      </section>

      {/* 技术分析 */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <span>📐</span> 技术分析
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 纳指技术指标 */}
          <div>
            <h4 className="text-sm font-medium text-content-secondary mb-3">NASDAQ 技术指标</h4>
            <div className="space-y-4">
              <RSIIndicator value={data.nasdaq.rsi14} />
              <MAStatus
                price={data.nasdaq.price}
                sma20={data.nasdaq.sma20}
                sma50={data.nasdaq.sma50}
                sma200={data.nasdaq.sma200}
              />
              <MACDCard
                line={data.nasdaq.macdLine}
                signal={data.nasdaq.macdSignal}
                histogram={data.nasdaq.macdHistogram}
              />
              <BollingerCard
                price={data.nasdaq.price}
                upper={data.nasdaq.bollingerUpper}
                middle={data.nasdaq.bollingerMiddle}
                lower={data.nasdaq.bollingerLower}
              />
            </div>
          </div>

          {/* 标普技术指标 */}
          <div>
            <h4 className="text-sm font-medium text-content-secondary mb-3">S&P 500 技术指标</h4>
            <div className="space-y-4">
              <RSIIndicator value={data.sp500.rsi14} />
              <MAStatus
                price={data.sp500.price}
                sma20={data.sp500.sma20}
                sma50={data.sp500.sma50}
                sma200={data.sp500.sma200}
              />
              <MACDCard
                line={data.sp500.macdLine}
                signal={data.sp500.macdSignal}
                histogram={data.sp500.macdHistogram}
              />
              <BollingerCard
                price={data.sp500.price}
                upper={data.sp500.bollingerUpper}
                middle={data.sp500.bollingerMiddle}
                lower={data.sp500.bollingerLower}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 恐惧贪婪指数 */}
      {data.fearGreedIndex != null && (
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FearGreedGauge value={data.fearGreedIndex} />
            {data.putCallRatio && (
              <MetricCard
                label="Put/Call Ratio"
                value={data.putCallRatio}
                description={
                  data.putCallRatio > 1 ? '看跌情绪偏重' :
                  data.putCallRatio < 0.7 ? '看涨情绪偏重' : '情绪均衡'
                }
              />
            )}
          </div>
        </section>
      )}

      {/* 板块热力图 */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <span>🏭</span> 板块表现
        </h3>
        <SectorHeatmap sectors={data.sectors} />
      </section>

      {/* 新闻 */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <span>📰</span> 影响市场的新闻 ({data.news.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.news.map((news, index) => (
            <NewsCard key={index} news={news} />
          ))}
        </div>
      </section>

      {/* 免责声明 */}
      <footer className="border-t border-border pt-6 mt-12">
        <div className="text-center text-sm text-content-muted">
          <p>数据来源: Yahoo Finance, CNBC, MarketWatch, Reuters</p>
          <p className="mt-1">
            ⚠️ 本站仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。
          </p>
        </div>
      </footer>
    </main>
  );
}

// 指数卡片组件
function IndexCard({ index }: { index: BarometerData['nasdaq'] }) {
  const isPositive = index.change >= 0;
  const sparkData = index.priceHistory.map(p => p.close);

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-content-primary">{index.name}</h3>
          <div className="text-xs text-content-muted">{index.symbol}</div>
        </div>
        {sparkData.length > 1 && <Sparkline data={sparkData} width={100} height={36} />}
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl font-bold text-content-primary">
          {index.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <ChangeDisplay value={index.change} percent={index.changePercent} size="md" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="开盘" value={index.open} />
        <MiniStat label="前收" value={index.previousClose} />
        <MiniStat label="最高" value={index.high} highlight="green" />
        <MiniStat label="最低" value={index.low} highlight="red" />
        <MiniStat label="成交量" value={index.volume} format="volume" />
        <MiniStat label="平均成交量" value={index.avgVolume} format="volume" />
        <MiniStat label="52周高" value={index.yearHigh} />
        <MiniStat label="52周低" value={index.yearLow} />
        {index.pe && <MiniStat label="P/E" value={index.pe} />}
        {index.atr14 && <MiniStat label="ATR(14)" value={index.atr14} />}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  format = 'price',
  highlight,
}: {
  label: string;
  value: number;
  format?: 'price' | 'volume';
  highlight?: 'green' | 'red';
}) {
  const formatted = format === 'volume'
    ? (value >= 1e9 ? `${(value / 1e9).toFixed(1)}B` : value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value.toLocaleString())
    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const textColor = highlight === 'green'
    ? 'text-green-600 dark:text-green-400'
    : highlight === 'red'
      ? 'text-red-600 dark:text-red-400'
      : 'text-content-primary';

  return (
    <div className="bg-surface-inset rounded-lg p-2.5">
      <div className="text-xs text-content-muted">{label}</div>
      <div className={`text-sm font-medium ${textColor}`}>{formatted}</div>
    </div>
  );
}

function MACDCard({
  line,
  signal,
  histogram,
}: {
  line: number | null;
  signal: number | null;
  histogram: number | null;
}) {
  if (!line) return null;

  const isBullish = histogram && histogram > 0;

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-content-secondary">MACD (12,26,9)</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          isBullish ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {isBullish ? '多头' : '空头'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-content-muted">MACD</div>
          <div className={`text-sm font-medium ${line > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {line.toFixed(2)}
          </div>
        </div>
        {signal !== null && (
          <div>
            <div className="text-xs text-content-muted">Signal</div>
            <div className="text-sm font-medium text-content-secondary">{signal.toFixed(2)}</div>
          </div>
        )}
        {histogram !== null && (
          <div>
            <div className="text-xs text-content-muted">Histogram</div>
            <div className={`text-sm font-medium ${histogram > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {histogram.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BollingerCard({
  price,
  upper,
  middle,
  lower,
}: {
  price: number;
  upper: number | null;
  middle: number | null;
  lower: number | null;
}) {
  if (!upper || !middle || !lower) return null;

  const range = upper - lower;
  const position = range > 0 ? ((price - lower) / range) * 100 : 50;

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-content-secondary">布林带 (20,2)</span>
        <span className="text-xs text-content-muted">
          位置: {position.toFixed(0)}%
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-content-muted">上轨</span>
          <span className="text-xs text-red-600 dark:text-red-400">{upper.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        {/* 可视化位置 */}
        <div className="relative h-2 bg-surface-inset rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20" />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full shadow"
            style={{ left: `${Math.min(97, Math.max(3, position))}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-content-muted">中轨</span>
          <span className="text-xs text-yellow-600 dark:text-yellow-400">{middle.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-content-muted">下轨</span>
          <span className="text-xs text-green-600 dark:text-green-400">{lower.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}
