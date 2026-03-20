import Link from 'next/link';
import { getAllBarometerSummaries } from '@/lib/data';
import HomeClient from './HomeClient';

export default function HomePage() {
  const summaries = getAllBarometerSummaries();

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="border-b border-[#1e293b] bg-[#0a0e17]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h1 className="text-lg font-bold text-white">投资晴雨表</h1>
                <p className="text-xs text-slate-400">NASDAQ & S&P 500 Daily Barometer</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            每日市场<span className="text-blue-400">晴雨表</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            从专业交易员的视角，追踪纳斯达克和标普500的每日走势、
            技术指标和市场情绪。数据每日自动更新。
          </p>
        </div>

        {summaries.length === 0 ? (
          <EmptyState />
        ) : (
          <HomeClient summaries={summaries} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-500">
            <p>数据来源: Yahoo Finance, CNBC, MarketWatch, Reuters</p>
            <p className="mt-1">
              ⚠️ 本站仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🔄</div>
      <h3 className="text-xl font-semibold text-white mb-2">暂无数据</h3>
      <p className="text-slate-400 mb-6">
        数据将在每日自动更新后出现。你也可以手动运行数据抓取脚本：
      </p>
      <code className="bg-[#1a2332] text-blue-400 px-4 py-2 rounded-lg text-sm">
        python3 scripts/fetch_data.py
      </code>
    </div>
  );
}
