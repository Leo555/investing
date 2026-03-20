import fs from 'fs';
import path from 'path';
import { BarometerData, BarometerSummary } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

export function getAllDates(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  
  return fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .map(f => f.replace('.json', ''))
    .sort((a, b) => b.localeCompare(a)); // 最新的在前
}

export function getBarometerData(date: string): BarometerData | null {
  const filePath = path.join(DATA_DIR, `${date}.json`);
  if (!fs.existsSync(filePath)) return null;
  
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as BarometerData;
}

export function getAllBarometerSummaries(): BarometerSummary[] {
  const indexPath = path.join(DATA_DIR, 'index.json');
  if (fs.existsSync(indexPath)) {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw) as BarometerSummary[];
  }

  // 如果 index.json 不存在，从各个日期文件生成
  const dates = getAllDates();
  return dates.map(date => {
    const data = getBarometerData(date);
    if (!data) return null;
    return {
      date: data.date,
      overallSentiment: data.overallSentiment,
      sentimentScore: data.sentimentScore,
      nasdaqPrice: data.nasdaq.price,
      nasdaqChange: data.nasdaq.change,
      nasdaqChangePercent: data.nasdaq.changePercent,
      sp500Price: data.sp500.price,
      sp500Change: data.sp500.change,
      sp500ChangePercent: data.sp500.changePercent,
      vix: data.indicators.vix,
      newsCount: data.news.length,
    } as BarometerSummary;
  }).filter(Boolean) as BarometerSummary[];
}
