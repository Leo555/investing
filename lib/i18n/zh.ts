const zh = {
  // 通用
  siteName: '投资晴雨表',
  siteDesc: '每日追踪纳斯达克和标普500指数走势、PE估值、历史分位、市场回撤，提供专业的定投参考数据。',
  siteSubtitle: 'NASDAQ & S&P 500',
  dataSource: '数据来源: Yahoo Finance, CNBC, MarketWatch, Reuters',
  disclaimer: '⚠️ 本站仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。',
  github: 'GitHub',
  backHome: '← 返回首页',
  noData: '未找到数据',
  noDataDesc: (date: string) => `日期 ${date} 的晴雨表数据不存在`,

  // 首页
  heroTitle: '每日市场',
  heroHighlight: '晴雨表',
  heroDesc: '从专业交易员的视角，追踪纳斯达克和标普500的每日走势、技术指标和市场情绪。数据每日自动更新。',
  latestBarometer: '最新晴雨表',
  historyRecords: '历史记录',
  viewDetail: '查看详细晴雨表 →',
  emptyTitle: '暂无数据',
  emptyDesc: '数据将在每日自动更新后出现。你也可以手动运行数据抓取脚本：',
  sentimentScore: '情绪分',
  newsCount: '条',
  news: '新闻',

  // 情绪
  bullish: '看涨',
  bearish: '看跌',
  neutral: '中性',

  // 概览
  basedOn: '基于',
  closingData: '收盘数据',
  forecast: '预测',
  marketBarometer: '市场晴雨表',
  updatedAt: '更新于',

  // 模块标题
  indexOverview: '📈 指数概览',
  investRef: '💰 定投参考',
  macroIndicators: '🌍 宏观指标',
  techAnalysis: '📐 技术分析',
  sectorPerf: '🏭 板块表现',
  marketNews: '📰 影响市场的新闻',

  // 指数卡片
  open: '开盘',
  high: '最高',
  low: '最低',
  close: '收盘',
  week52High: '52周高',
  week52Low: '52周低',
  closing: '收盘',

  // 宏观指标
  vix: 'VIX 恐慌指数',
  vixExtremeFear: '⚠️ 极度恐慌',
  vixHighVol: '⚡ 波动偏高',
  vixCalm: '✅ 市场平静',
  dxy: '美元指数 (DXY)',
  us10y: '10年期美债收益率',
  us2y: '2年期美债收益率',
  gold: '黄金 (GC)',
  oil: '原油 (CL)',
  bitcoin: '比特币',
  ethereum: '以太坊',

  // 技术分析
  nasdaqTech: 'NASDAQ 技术指标',
  sp500Tech: 'S&P 500 技术指标',

  // 定投参考
  latestValuation: '最新估值',
  basedOnETF: '基于',
  etfSuffix: 'ETF',
  coreValuation: '估值核心数据',
  latestPE: '最新PE',
  forwardPE: '前瞻PE',
  histPercentile: '历史分位值对比',
  past1y: '过去1年的',
  past5y: '过去5年的',
  past10y: '过去10年的',
  position: '位置',
  marketDrawdown: '市场回撤',
  drawdownFromATH: '距最高点已下跌',
  drawdownFrom52w: '距52周高点',
  ath: '最高',
  highPoint: '高点',
  valuationRef: '估值合理性参考',
  valuationRefText: [
    '估值是否合理请参考：',
    '1. 历史分位值水平（越低越值得关注）',
    '2. 恐慌指数 VIX（越高市场越恐慌）',
    '3. 回撤幅度（回撤越深定投价值越高）',
  ],

  // 新闻
  showAll: (n: number) => `查看全部 ${n} 条新闻`,
  collapse: '收起',

  // 恐惧贪婪
  fearGreed: '恐惧 & 贪婪指数',
  extremeFear: '极度恐惧',
  fear: '恐惧',
  greed: '贪婪',
  extremeGreed: '极度贪婪',

  // 均线
  maSystem: '均线系统',
  bullTag: '多头',
  bearTag: '空头',

  // 布林带
  bollingerBand: '布林带',
  upperBand: '上轨',
  middleBand: '中轨',
  lowerBand: '下轨',
  positionLabel: '位置',

  // RSI
  overbought: '超买',
  oversold: '超卖',
  normal: '正常',

  // Put/Call
  putCallBearish: '看跌情绪偏重',
  putCallBullish: '看涨情绪偏重',
  putCallNeutral: '情绪均衡',
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Translations = Record<string, any>;
export default zh as Translations;
