import { getAllDates, getBarometerData } from '@/lib/data';
import BarometerClient from './BarometerClient';
import Link from 'next/link';
import type { Metadata } from 'next';
import { BarometerHeader } from '@/components/Header';

export async function generateStaticParams() {
  const dates = getAllDates();
  return dates.map((date) => ({ date }));
}

export async function generateMetadata({ params }: { params: { date: string } }): Promise<Metadata> {
  const data = getBarometerData(params.date);
  if (!data) {
    return { title: `${params.date} - 未找到数据` };
  }

  const sentiment = data.overallSentiment === 'bullish' ? '看涨' : data.overallSentiment === 'bearish' ? '看跌' : '中性';
  const title = `${params.date} 美股晴雨表 - ${sentiment} | 纳指 ${data.nasdaq.price.toLocaleString()} 标普 ${data.sp500.price.toLocaleString()}`;
  const description = `${params.date} 美股市场${sentiment}，纳斯达克 ${data.nasdaq.price.toLocaleString()}（${data.nasdaq.changePercent >= 0 ? '+' : ''}${data.nasdaq.changePercent.toFixed(2)}%），标普500 ${data.sp500.price.toLocaleString()}（${data.sp500.changePercent >= 0 ? '+' : ''}${data.sp500.changePercent.toFixed(2)}%）。PE估值、历史分位、市场回撤等定投参考数据。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
  };
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
      <BarometerHeader date={params.date} prevDate={prevDate} nextDate={nextDate} />

      <BarometerClient data={data} />
    </div>
  );
}
