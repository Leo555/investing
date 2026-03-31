// 晴雨表数据的类型定义

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  tradingDate: string | null;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  yearHigh: number;
  yearHighDate: string | null;
  yearLow: number;
  yearLowDate: string | null;
  pe: number | null;
  marketCap: number | null;
  // 技术指标
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  atr14: number | null;
  // 历史价格 (最近30天)
  priceHistory: { date: string; close: number; volume: number }[];
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface MarketIndicators {
  vix: number | null;
  vixChange: number | null;
  dxy: number | null;         // 美元指数
  dxyChange: number | null;
  us10y: number | null;       // 10年期美债收益率
  us10yChange: number | null;
  us2y: number | null;        // 2年期美债收益率
  us2yChange: number | null;
  gold: number | null;
  goldChange: number | null;
  oil: number | null;
  oilChange: number | null;
  btc: number | null;
  btcChange: number | null;
}

export interface SectorPerformance {
  name: string;
  symbol: string;
  changePercent: number;
}

export interface BarometerData {
  date: string;
  dataDate?: string;        // 数据实际对应的交易日
  forecastDate?: string;    // 预测的下一个交易日
  timestamp: string;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -100 到 100
  nasdaq: IndexData;
  sp500: IndexData;
  indicators: MarketIndicators;
  sectors: SectorPerformance[];
  news: NewsItem[];
  fearGreedIndex: number | null; // 0-100
  advanceDeclineRatio: number | null;
  putCallRatio: number | null;
}

export interface BarometerSummary {
  date: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  nasdaqPrice: number;
  nasdaqChange: number;
  nasdaqChangePercent: number;
  sp500Price: number;
  sp500Change: number;
  sp500ChangePercent: number;
  vix: number | null;
  newsCount: number;
}
