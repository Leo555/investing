'use client';

import React from 'react';

// 情绪仪表盘
export function SentimentGauge({ score, sentiment }: { score: number; sentiment: string }) {
  // score: -100 到 100
  const normalized = (score + 100) / 200; // 0 到 1
  const angle = -90 + normalized * 180; // -90 到 90 度
  
  const getColor = () => {
    if (score > 20) return '#22c55e';
    if (score < -20) return '#ef4444';
    return '#eab308';
  };

  const getLabel = () => {
    if (score > 60) return '极度看涨';
    if (score > 20) return '看涨';
    if (score > -20) return '中性';
    if (score > -60) return '看跌';
    return '极度看跌';
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-56 h-32">
        {/* 背景弧 */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#1e293b"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* 彩色渐变弧 */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="65%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* 指针 */}
        <g transform={`rotate(${angle}, 100, 100)`}>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke={getColor()}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill={getColor()} />
        </g>
        {/* 刻度标签 */}
        <text x="15" y="115" fill="#64748b" fontSize="10" textAnchor="middle">-100</text>
        <text x="100" y="18" fill="#64748b" fontSize="10" textAnchor="middle">0</text>
        <text x="185" y="115" fill="#64748b" fontSize="10" textAnchor="middle">+100</text>
      </svg>
      <div className="text-center -mt-2">
        <span className="text-3xl font-bold" style={{ color: getColor() }}>
          {score > 0 ? '+' : ''}{score}
        </span>
        <p className="text-sm mt-1" style={{ color: getColor() }}>
          {getLabel()}
        </p>
      </div>
    </div>
  );
}

// 变化显示组件
export function ChangeDisplay({
  value,
  percent,
  size = 'md',
}: {
  value?: number;
  percent?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const isPositive = (value ?? percent ?? 0) >= 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const arrow = isPositive ? '▲' : '▼';

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <span className={`${color} ${sizeClasses[size]} font-semibold inline-flex items-center gap-1`}>
      <span className="text-xs">{arrow}</span>
      {value !== undefined && <span>{Math.abs(value).toFixed(2)}</span>}
      {percent !== undefined && <span>({Math.abs(percent).toFixed(2)}%)</span>}
    </span>
  );
}

// 指标卡片
export function MetricCard({
  label,
  value,
  change,
  changePercent,
  format = 'number',
  description,
}: {
  label: string;
  value: number | null;
  change?: number | null;
  changePercent?: number | null;
  format?: 'number' | 'percent' | 'currency' | 'integer';
  description?: string;
}) {
  if (value === null || value === undefined) return null;

  const formatValue = (v: number) => {
    switch (format) {
      case 'percent':
        return `${v.toFixed(2)}%`;
      case 'currency':
        return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'integer':
        return v.toLocaleString('en-US');
      default:
        return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  return (
    <div className="bg-[#1a2332] border border-[#1e293b] rounded-xl p-4 card-hover">
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-white">{formatValue(value)}</div>
      {(change !== null && change !== undefined) && (
        <div className="mt-1">
          <ChangeDisplay value={change} percent={changePercent ?? undefined} size="sm" />
        </div>
      )}
      {description && (
        <div className="text-xs text-slate-500 mt-2">{description}</div>
      )}
    </div>
  );
}

// RSI 指示器
export function RSIIndicator({ value }: { value: number | null }) {
  if (!value) return null;

  const getZone = () => {
    if (value >= 70) return { label: '超买', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (value <= 30) return { label: '超卖', color: 'text-green-400', bg: 'bg-green-500/20' };
    return { label: '正常', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  };

  const zone = getZone();
  const position = (value / 100) * 100;

  return (
    <div className="bg-[#1a2332] border border-[#1e293b] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">RSI (14)</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${zone.bg} ${zone.color}`}>
          {zone.label}
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-3">{value.toFixed(1)}</div>
      <div className="relative h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-slate-700"
          style={{ left: `${Math.min(98, Math.max(2, position))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>超卖 30</span>
        <span>50</span>
        <span>超买 70</span>
      </div>
    </div>
  );
}

// 恐惧贪婪指数
export function FearGreedGauge({ value }: { value: number | null }) {
  if (!value) return null;

  const getZone = () => {
    if (value <= 25) return { label: '极度恐惧', color: '#ef4444', emoji: '😰' };
    if (value <= 45) return { label: '恐惧', color: '#f97316', emoji: '😟' };
    if (value <= 55) return { label: '中性', color: '#eab308', emoji: '😐' };
    if (value <= 75) return { label: '贪婪', color: '#84cc16', emoji: '😊' };
    return { label: '极度贪婪', color: '#22c55e', emoji: '🤑' };
  };

  const zone = getZone();
  const angle = -90 + (value / 100) * 180;

  return (
    <div className="bg-[#1a2332] border border-[#1e293b] rounded-xl p-4">
      <div className="text-sm text-slate-400 mb-2">恐惧 & 贪婪指数</div>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 120" className="w-40 h-24">
          <defs>
            <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#fgGradient)" strokeWidth="14" strokeLinecap="round" opacity="0.4" />
          <g transform={`rotate(${angle}, 100, 100)`}>
            <line x1="100" y1="100" x2="100" y2="35" stroke={zone.color} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill={zone.color} />
          </g>
        </svg>
        <div className="text-center -mt-1">
          <span className="text-2xl">{zone.emoji}</span>
          <div className="text-xl font-bold" style={{ color: zone.color }}>{value}</div>
          <div className="text-xs" style={{ color: zone.color }}>{zone.label}</div>
        </div>
      </div>
    </div>
  );
}

// 板块热力图
export function SectorHeatmap({ sectors }: { sectors: { name: string; symbol: string; changePercent: number }[] }) {
  const getColor = (change: number) => {
    if (change > 2) return 'bg-green-500/40 border-green-500/50';
    if (change > 0.5) return 'bg-green-500/20 border-green-500/30';
    if (change > -0.5) return 'bg-slate-500/20 border-slate-500/30';
    if (change > -2) return 'bg-red-500/20 border-red-500/30';
    return 'bg-red-500/40 border-red-500/50';
  };

  const getTextColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {sectors.map((sector) => (
        <div
          key={sector.symbol}
          className={`${getColor(sector.changePercent)} border rounded-lg p-3 text-center`}
        >
          <div className="text-xs text-slate-300 mb-1">{sector.name}</div>
          <div className={`text-sm font-bold ${getTextColor(sector.changePercent)}`}>
            {sector.changePercent > 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  );
}

// 新闻卡片
export function NewsCard({ news }: { news: { title: string; summary: string; source: string; url: string; sentiment: string } }) {
  const sentimentConfig = {
    positive: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '📈' },
    negative: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '📉' },
    neutral: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: '📊' },
  };

  const config = sentimentConfig[news.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block ${config.bg} border ${config.border} rounded-xl p-4 card-hover`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white leading-snug mb-1">
            {news.title}
          </h4>
          {news.summary && (
            <p className="text-xs text-slate-400 line-clamp-2 mb-2">{news.summary}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{news.source}</span>
          </div>
        </div>
        <span className="text-lg flex-shrink-0">{config.icon}</span>
      </div>
    </a>
  );
}

// 价格迷你图 (Mini Sparkline)
export function Sparkline({
  data,
  width = 120,
  height = 40,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? '#22c55e' : '#ef4444';

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 移动平均线状态
export function MAStatus({
  price,
  sma20,
  sma50,
  sma200,
}: {
  price: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
}) {
  const items = [
    { label: 'SMA 20', value: sma20 },
    { label: 'SMA 50', value: sma50 },
    { label: 'SMA 200', value: sma200 },
  ];

  return (
    <div className="bg-[#1a2332] border border-[#1e293b] rounded-xl p-4">
      <div className="text-sm text-slate-400 mb-3">均线系统</div>
      <div className="space-y-2">
        {items.map((item) => {
          if (!item.value) return null;
          const aboveMA = price > item.value;
          const diff = ((price - item.value) / item.value) * 100;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">
                  {item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    aboveMA
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {aboveMA ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
