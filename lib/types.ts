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
  vixHistory?: number[];
  vixHistoryStart?: string;
  vixHistoryEnd?: string;
  dxy: number | null;
  dxyChange: number | null;
  dxyHistory?: number[];
  dxyHistoryStart?: string;
  dxyHistoryEnd?: string;
  us10y: number | null;
  us10yChange: number | null;
  us10yHistory?: number[];
  us10yHistoryStart?: string;
  us10yHistoryEnd?: string;
  us2y: number | null;
  us2yChange: number | null;
  us2yHistory?: number[];
  us2yHistoryStart?: string;
  us2yHistoryEnd?: string;
  gold: number | null;
  goldChange: number | null;
  goldHistory?: number[];
  goldHistoryStart?: string;
  goldHistoryEnd?: string;
  oil: number | null;
  oilChange: number | null;
  oilHistory?: number[];
  oilHistoryStart?: string;
  oilHistoryEnd?: string;
  btc: number | null;
  btcChange: number | null;
  btcHistory?: number[];
  btcHistoryStart?: string;
  btcHistoryEnd?: string;
  eth: number | null;
  ethChange: number | null;
  ethHistory?: number[];
  ethHistoryStart?: string;
  ethHistoryEnd?: string;
}

export interface SectorPerformance {
  name: string;
  symbol: string;
  changePercent: number;
}

export interface ValuationItem {
  pe: number | null;
  forwardPE: number | null;       // 前瞻 PE
  pePercentile1y: number | null;  // 1 年 PE 分位数 0-100
  pePercentile5y: number | null;  // 5 年 PE 分位数 0-100
  pePercentile10y: number | null; // 10 年 PE 分位数 0-100
  peRangeLow: number;
  peRangeHigh: number;
  drawdown52w: number | null;     // 距 52 周高点回撤 %
  high52w: number | null;
  drawdownATH: number | null;     // 距历史最高点回撤 %
  allTimeHigh: number | null;
  currentPrice: number | null;
}

export interface ValuationData {
  sp500?: ValuationItem;
  nasdaq?: ValuationItem;
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
  valuation?: ValuationData;
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
