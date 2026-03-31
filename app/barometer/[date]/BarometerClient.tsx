'use client';

import React, { useState } from 'react';
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
import { BarometerData, ValuationItem } from '@/lib/types';

// 将 "2026-03-20" 格式化为 "3月20日"
function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

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
            {data.forecastDate ? (
              <>
                <div className="text-sm text-content-secondary mb-1">
                  基于{' '}
                  <span className="font-medium text-content-primary">
                    {new Date((data.dataDate || data.date) + 'T00:00:00').toLocaleDateString('zh-CN', {
                      month: 'long', day: 'numeric', weekday: 'short'
                    })}
                  </span>
                  {' '}收盘数据
                </div>
                <h2 className="text-3xl font-bold text-content-primary mb-1">
                  {new Date(data.forecastDate + 'T00:00:00').toLocaleDateString('zh-CN', {
                    month: 'long', day: 'numeric', weekday: 'long'
                  })}
                  {' '}预测
                </h2>
              </>
            ) : (
              <>
                <div className="text-sm text-content-secondary mb-1">
                  {new Date(data.date + 'T00:00:00').toLocaleDateString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
                  })}
                </div>
                <h2 className="text-3xl font-bold text-content-primary mb-2">市场晴雨表</h2>
              </>
            )}
            <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <span className={`sentiment-badge ${
                data.overallSentiment === 'bullish' ? 'sentiment-bullish' :
                data.overallSentiment === 'bearish' ? 'sentiment-bearish' :
                'sentiment-neutral'
              }`}>
                {data.overallSentiment === 'bullish' ? '🔴 看涨' :
                 data.overallSentiment === 'bearish' ? '🟢 看跌' : '🟡 中性'}
              </span>
              <span className="text-sm text-content-muted">
                更新于 {new Date(data.timestamp).toLocaleString('zh-CN', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
              </span>
            </div>
          </div>
          <SentimentGauge score={data.sentimentScore} sentiment={data.overallSentiment} />
        </div>
      </section>

      {/* 指数概览 */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <span>📈</span> 指数概览
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IndexCard index={data.nasdaq} />
          <IndexCard index={data.sp500} />
        </div>
      </section>

      {/* 定投参考 */}
      {data.valuation && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
            <span>💰</span> 定投参考
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.valuation.nasdaq && (
              <ValuationCard name="纳斯达克 100" etf="QQQ" data={data.valuation.nasdaq} indexPrice={data.nasdaq.price} />
            )}
            {data.valuation.sp500 && (
              <ValuationCard name="标普 500" etf="SPY" data={data.valuation.sp500} indexPrice={data.sp500.price} />
            )}
          </div>
        </section>
      )}

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
            history={data.indicators.vixHistory}
            historyStart={data.indicators.vixHistoryStart}
            historyEnd={data.indicators.vixHistoryEnd}
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
            history={data.indicators.dxyHistory}
            historyStart={data.indicators.dxyHistoryStart}
            historyEnd={data.indicators.dxyHistoryEnd}
          />
          <MetricCard
            label="10年期美债收益率"
            value={data.indicators.us10y}
            change={data.indicators.us10yChange}
            history={data.indicators.us10yHistory}
            historyStart={data.indicators.us10yHistoryStart}
            historyEnd={data.indicators.us10yHistoryEnd}
            format="percent"
          />
          <MetricCard
            label="2年期美债收益率"
            value={data.indicators.us2y}
            change={data.indicators.us2yChange}
            history={data.indicators.us2yHistory}
            historyStart={data.indicators.us2yHistoryStart}
            historyEnd={data.indicators.us2yHistoryEnd}
            format="percent"
          />
          <MetricCard
            label="黄金 (GC)"
            value={data.indicators.gold}
            change={data.indicators.goldChange}
            history={data.indicators.goldHistory}
            historyStart={data.indicators.goldHistoryStart}
            historyEnd={data.indicators.goldHistoryEnd}
            format="currency"
          />
          <MetricCard
            label="原油 (CL)"
            value={data.indicators.oil}
            change={data.indicators.oilChange}
            history={data.indicators.oilHistory}
            historyStart={data.indicators.oilHistoryStart}
            historyEnd={data.indicators.oilHistoryEnd}
            format="currency"
          />
          <MetricCard
            label="比特币"
            value={data.indicators.btc}
            change={data.indicators.btcChange}
            history={data.indicators.btcHistory}
            historyStart={data.indicators.btcHistoryStart}
            historyEnd={data.indicators.btcHistoryEnd}
            format="currency"
          />
          <MetricCard
            label="以太坊"
            value={data.indicators.eth}
            change={data.indicators.ethChange}
            history={data.indicators.ethHistory}
            historyStart={data.indicators.ethHistoryStart}
            historyEnd={data.indicators.ethHistoryEnd}
            format="currency"
          />
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
      <NewsSection news={data.news} />

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

  // 当日最高/最低的副标题：交易日期 + 美股常规交易时段
  const tradingSubtitle = index.tradingDate
    ? `${formatDateShort(index.tradingDate)} 9:30-16:00 ET`
    : undefined;

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-content-primary">{index.name}</h3>
          <div className="text-xs text-content-muted">
            {index.symbol}
            {index.tradingDate && (
              <span className="ml-1.5">· {new Date(index.tradingDate + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })} 收盘</span>
            )}
          </div>
        </div>
        {sparkData.length > 1 && (
          <div className="text-right">
            <Sparkline data={sparkData} width={100} height={36} />
            <div className="flex justify-between text-[9px] text-content-muted mt-0.5" style={{ width: 100 }}>
              <span>{formatDateShort(index.priceHistory[0].date)}</span>
              <span>{formatDateShort(index.priceHistory[index.priceHistory.length - 1].date)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl font-bold text-content-primary">
          {index.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <ChangeDisplay value={index.change} percent={index.changePercent} size="md" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="开盘" value={index.open} />
        <MiniStat label="最高" value={index.high} highlight="green" />
        <MiniStat label="最低" value={index.low} highlight="red" />
        <MiniStat label="收盘" value={index.price} />
        <MiniStat label="52周高" value={index.yearHigh} subtitle={index.yearHighDate ? formatDateShort(index.yearHighDate) : undefined} />
        <MiniStat label="52周低" value={index.yearLow} subtitle={index.yearLowDate ? formatDateShort(index.yearLowDate) : undefined} />
        {index.pe && <MiniStat label="P/E" value={index.pe} />}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  format = 'price',
  highlight,
  subtitle,
}: {
  label: string;
  value: number;
  format?: 'price' | 'volume';
  highlight?: 'green' | 'red';
  subtitle?: string;
}) {
  const formatted = format === 'volume'
    ? (value >= 1e9 ? `${(value / 1e9).toFixed(1)}B` : value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value.toLocaleString())
    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const textColor = highlight === 'green'
    ? 'text-red-600 dark:text-red-400'
    : highlight === 'red'
      ? 'text-green-600 dark:text-green-400'
      : 'text-content-primary';

  return (
    <div className="bg-surface-inset rounded-lg p-2.5">
      <div className="text-xs text-content-muted">{label}</div>
      <div className={`text-sm font-medium ${textColor}`}>{formatted}</div>
      {subtitle && <div className="text-[10px] text-content-muted mt-0.5">{subtitle}</div>}
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
          isBullish ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-500/20 text-green-600 dark:text-green-400'
        }`}>
          {isBullish ? '多头' : '空头'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-content-muted">MACD</div>
          <div className={`text-sm font-medium ${line > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
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
            <div className={`text-sm font-medium ${histogram > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
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

// 新闻模块：默认显示前 3 条，点击展开显示全部
const NEWS_PREVIEW_COUNT = 3;

function NewsSection({ news }: { news: BarometerData['news'] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = news.length > NEWS_PREVIEW_COUNT;
  const visibleNews = expanded ? news : news.slice(0, NEWS_PREVIEW_COUNT);

  return (
    <section className="mb-8">
      <h3 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
        <span>📰</span> 影响市场的新闻 ({news.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleNews.map((item, index) => (
          <NewsCard key={index} news={item} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-content-secondary bg-surface-card border border-border rounded-full hover:bg-surface-inset hover:text-content-primary transition-colors"
          >
            {expanded ? (
              <>
                收起
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                查看全部 {news.length} 条新闻
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

// 定投参考卡片 — 信息图风格
function ValuationCard({ name, etf, data, indexPrice }: { name: string; etf: string; data: ValuationItem; indexPrice: number }) {
  const markers = [
    { label: '1年', value: data.pePercentile1y, color: '#3b82f6' },
    { label: '5年', value: data.pePercentile5y, color: '#eab308' },
    { label: '10年', value: data.pePercentile10y, color: '#f97316' },
  ].filter(m => m.value != null) as { label: string; value: number; color: string }[];

  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
      {/* 标题区 */}
      <div className="text-center py-4 px-5 border-b border-border">
        <h4 className="text-lg font-bold text-content-primary">{name}最新估值</h4>
        <span className="text-xs text-content-muted">基于 {etf} ETF</span>
      </div>

      <div className="p-5 space-y-4">
        {/* ── 估值核心数据 ── */}
        {(data.pe != null || data.forwardPE != null) && (
          <div className="relative border border-border rounded-xl p-4">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 bg-surface-card text-[11px] font-semibold text-content-secondary whitespace-nowrap">估值核心数据</div>
            <div className="grid grid-cols-2 divide-x divide-border mt-1">
              {data.pe != null && (
                <div className="text-center pr-4">
                  <div className="text-xs text-content-muted mb-1">最新PE</div>
                  <div className="text-3xl font-extrabold text-content-primary tracking-tight">{data.pe.toFixed(2)}</div>
                </div>
              )}
              {data.forwardPE != null && (
                <div className="text-center pl-4">
                  <div className="text-xs text-content-muted mb-1">前瞻PE</div>
                  <div className="text-3xl font-extrabold text-content-primary tracking-tight">{data.forwardPE.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 历史分位值对比 ── */}
        {markers.length > 0 && (
          <div className="relative border border-border rounded-xl p-4 pt-5">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 bg-surface-card text-[11px] font-semibold text-content-secondary whitespace-nowrap">历史分位值对比</div>
            <div className="relative mt-2 mb-6">
              {/* 分段色条 */}
              <div className="flex h-5 rounded-full overflow-hidden shadow-inner">
                <div className="flex-1" style={{ background: 'linear-gradient(to right, #22c55e, #4ade80)' }} />
                <div className="flex-1" style={{ background: 'linear-gradient(to right, #4ade80, #a3e635)' }} />
                <div className="flex-1" style={{ background: 'linear-gradient(to right, #a3e635, #facc15)' }} />
                <div className="flex-1" style={{ background: 'linear-gradient(to right, #facc15, #fb923c)' }} />
                <div className="flex-1" style={{ background: 'linear-gradient(to right, #fb923c, #ef4444)' }} />
              </div>
              {/* 指针标记 */}
              {markers.map((m) => (
                <div key={m.label} className="absolute" style={{ left: `${Math.min(95, Math.max(5, m.value))}%`, top: '-4px' }}>
                  <div className="relative -translate-x-1/2">
                    <div className="w-0 h-0 mx-auto" style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `10px solid ${m.color}`, filter: `drop-shadow(0 1px 2px ${m.color}60)` }} />
                    <div className="w-1.5 h-4 mx-auto rounded-b-sm" style={{ backgroundColor: m.color, marginTop: '-1px' }} />
                  </div>
                </div>
              ))}
            </div>
            {/* 标签 */}
            <div className="grid grid-cols-3 text-center gap-1">
              {markers.map((m) => (
                <div key={m.label}>
                  <div className="text-[11px] text-content-secondary">过去{m.label}的</div>
                  <div className="text-base font-bold" style={{ color: m.color }}>
                    {m.value}%<span className="text-[10px] font-normal text-content-muted ml-0.5">位置</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 市场回撤 ── */}
        {(data.drawdown52w != null || data.drawdownATH != null) && (
          <div className="relative border border-border rounded-xl p-4 pt-5">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 bg-surface-card text-[11px] font-semibold text-content-secondary whitespace-nowrap">市场回撤</div>
            <div className="grid grid-cols-2 divide-x divide-border mt-1">
              {data.drawdownATH != null && (
                <div className="text-center pr-3">
                  <div className="text-xs text-content-muted mb-2">距最高点已下跌</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-red-500 text-lg">↓</span>
                    <span className={`text-2xl font-extrabold ${data.drawdownATH < -10 ? 'text-red-500 dark:text-red-400' : data.drawdownATH < -5 ? 'text-orange-500' : 'text-yellow-600'}`}>
                      {Math.abs(data.drawdownATH).toFixed(2)}%
                    </span>
                  </div>
                  {data.allTimeHigh && <div className="text-[10px] text-content-muted mt-1">最高 {data.allTimeHigh.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>}
                </div>
              )}
              {data.drawdown52w != null && (
                <div className="text-center pl-3">
                  <div className="text-xs text-content-muted mb-2">距52周高点</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-red-500 text-lg">↓</span>
                    <span className={`text-2xl font-extrabold ${data.drawdown52w < -10 ? 'text-red-500 dark:text-red-400' : data.drawdown52w < -5 ? 'text-orange-500' : 'text-yellow-600'}`}>
                      {Math.abs(data.drawdown52w).toFixed(2)}%
                    </span>
                  </div>
                  {data.high52w && <div className="text-[10px] text-content-muted mt-1">高点 {data.high52w.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 估值合理性参考 ── */}
        <div className="relative border border-border rounded-xl p-4 pt-5">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 bg-surface-card text-[11px] font-semibold text-content-secondary whitespace-nowrap">估值合理性参考</div>
          <div className="text-xs text-content-muted leading-relaxed mt-1">
            <p>估值是否合理请参考：</p>
            <p>1. 历史分位值水平（越低越值得关注）</p>
            <p>2. 恐慌指数 VIX（越高市场越恐慌）</p>
            <p>3. 回撤幅度（回撤越深定投价值越高）</p>
          </div>
        </div>
      </div>
    </div>
  );
}
