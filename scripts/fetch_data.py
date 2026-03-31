#!/usr/bin/env python3
"""
投资晴雨表数据抓取脚本
每日从 Yahoo Finance 和 RSS 新闻源获取市场数据
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import yfinance as yf
import feedparser
import requests
from bs4 import BeautifulSoup

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


def fetch_index_data(symbol: str, name: str) -> dict:
    """获取指数数据和技术指标"""
    try:
        ticker = yf.Ticker(symbol)
    except Exception as e:
        print(f"⚠️ 创建 {symbol} Ticker 失败: {e}")
        return _empty_index(symbol, name)
    
    # 获取最近60天的历史数据用于计算技术指标
    try:
        hist = ticker.history(period="3mo")
    except Exception as e:
        print(f"⚠️ 获取 {symbol} 3个月历史失败: {e}")
        return _empty_index(symbol, name)
    
    if hist.empty:
        print(f"警告: 无法获取 {symbol} 的历史数据")
        return _empty_index(symbol, name)
    
    # 获取 1 年历史数据，用于查找 52 周高低价对应日期
    try:
        hist_1y = ticker.history(period="1y")
    except Exception as e:
        print(f"⚠️ 获取 {symbol} 1年历史失败: {e}")
        hist_1y = hist  # 降级使用 3 个月数据
    
    try:
        info = ticker.info or {}
    except Exception as e:
        print(f"⚠️ 获取 {symbol} info 失败: {e}")
        info = {}
    
    current = hist.iloc[-1]
    prev = hist.iloc[-2] if len(hist) > 1 else current
    
    # 记录当天最高/最低价对应的交易日期
    trading_date = hist.index[-1].strftime("%Y-%m-%d")
    
    price = float(current["Close"])
    prev_close = float(prev["Close"])
    change = price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close != 0 else 0
    
    # 计算技术指标
    closes = hist["Close"].values.tolist()
    volumes = hist["Volume"].values.tolist()
    highs = hist["High"].values.tolist()
    lows = hist["Low"].values.tolist()
    
    # 查找 52 周高低价对应日期
    year_high_date = None
    year_low_date = None
    try:
        if not hist_1y.empty:
            high_idx = hist_1y["High"].idxmax()
            low_idx = hist_1y["Low"].idxmin()
            year_high_date = high_idx.strftime("%Y-%m-%d") if high_idx is not None else None
            year_low_date = low_idx.strftime("%Y-%m-%d") if low_idx is not None else None
    except Exception as e:
        print(f"⚠️ 计算 {symbol} 52周高低日期失败: {e}")
    
    # 技术指标（每个独立计算，互不影响）
    sma20 = None
    sma50 = None
    sma200 = None
    rsi14 = None
    macd_line = None
    macd_signal = None
    macd_hist = None
    bb_upper = None
    bb_middle = None
    bb_lower = None
    atr14 = None
    
    try:
        sma20 = _sma(closes, 20)
        sma50 = _sma(closes, 50)
        sma200 = _sma(closes, 200) if len(closes) >= 200 else None
    except Exception as e:
        print(f"⚠️ 计算 {symbol} SMA 失败: {e}")
    
    try:
        rsi14 = _rsi(closes, 14)
    except Exception as e:
        print(f"⚠️ 计算 {symbol} RSI 失败: {e}")
    
    try:
        macd_line, macd_signal, macd_hist = _macd(closes)
    except Exception as e:
        print(f"⚠️ 计算 {symbol} MACD 失败: {e}")
    
    try:
        bb_upper, bb_middle, bb_lower = _bollinger(closes, 20)
    except Exception as e:
        print(f"⚠️ 计算 {symbol} Bollinger 失败: {e}")
    
    try:
        atr14 = _atr(highs, lows, closes, 14)
    except Exception as e:
        print(f"⚠️ 计算 {symbol} ATR 失败: {e}")
    
    # 最近30天价格历史
    dates = hist.index[-30:].strftime("%Y-%m-%d").tolist()
    price_history = []
    for i, d in enumerate(dates):
        idx = len(hist) - 30 + i
        if idx >= 0:
            price_history.append({
                "date": d,
                "close": round(float(hist.iloc[idx]["Close"]), 2),
                "volume": int(hist.iloc[idx]["Volume"]),
            })
    
    return {
        "symbol": symbol,
        "name": name,
        "price": round(price, 2),
        "change": round(change, 2),
        "changePercent": round(change_pct, 2),
        "tradingDate": trading_date,
        "open": round(float(current["Open"]), 2),
        "high": round(float(current["High"]), 2),
        "low": round(float(current["Low"]), 2),
        "previousClose": round(prev_close, 2),
        "volume": int(current["Volume"]),
        "avgVolume": int(sum(volumes[-20:]) / min(20, len(volumes))),
        "yearHigh": round(float(info.get("fiftyTwoWeekHigh", max(highs))), 2),
        "yearHighDate": year_high_date,
        "yearLow": round(float(info.get("fiftyTwoWeekLow", min(lows))), 2),
        "yearLowDate": year_low_date,
        "pe": _safe_round(info.get("trailingPE")),
        "marketCap": info.get("marketCap"),
        "sma20": _safe_round(sma20),
        "sma50": _safe_round(sma50),
        "sma200": _safe_round(sma200),
        "rsi14": _safe_round(rsi14, 1),
        "macdLine": _safe_round(macd_line, 4),
        "macdSignal": _safe_round(macd_signal, 4),
        "macdHistogram": _safe_round(macd_hist, 4),
        "bollingerUpper": _safe_round(bb_upper),
        "bollingerMiddle": _safe_round(bb_middle),
        "bollingerLower": _safe_round(bb_lower),
        "atr14": _safe_round(atr14),
        "priceHistory": price_history,
    }


def fetch_market_indicators() -> dict:
    """获取市场宏观指标（含近30天历史）"""
    symbols = {
        "vix": "^VIX",
        "dxy": "DX-Y.NYB",
        "us10y": "^TNX",
        "us2y": "^IRX",
        "gold": "GC=F",
        "oil": "CL=F",
        "btc": "BTC-USD",
        "eth": "ETH-USD",
    }
    
    result = {}
    for key, sym in symbols.items():
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="2mo")
            if len(hist) >= 2:
                current = float(hist.iloc[-1]["Close"])
                prev = float(hist.iloc[-2]["Close"])
                change = current - prev
                result[key] = round(current, 2)
                result[f"{key}Change"] = round(change, 2)
                # 最近 30 个交易日收盘价
                recent = hist.iloc[-30:] if len(hist) >= 30 else hist
                result[f"{key}History"] = [round(float(v), 2) for v in recent["Close"].values]
                result[f"{key}HistoryStart"] = recent.index[0].strftime("%Y-%m-%d")
                result[f"{key}HistoryEnd"] = recent.index[-1].strftime("%Y-%m-%d")
            elif len(hist) == 1:
                result[key] = round(float(hist.iloc[-1]["Close"]), 2)
                result[f"{key}Change"] = 0
                result[f"{key}History"] = [round(float(hist.iloc[-1]["Close"]), 2)]
            else:
                result[key] = None
                result[f"{key}Change"] = None
                result[f"{key}History"] = []
        except Exception as e:
            print(f"获取 {sym} 失败: {e}")
            result[key] = None
            result[f"{key}Change"] = None
            result[f"{key}History"] = []
    
    return result


def fetch_valuation_data() -> dict:
    """获取估值和回撤数据，用于定投参考
    
    使用 SPY/QQQ ETF 获取:
    - 当前 PE (trailing)
    - 前瞻 PE (forward, 基于预估盈利增长率)
    - 1年/5年/10年 PE 历史分位数
    - 距最高点回撤
    """
    import numpy as np
    
    # SPY 跟踪 S&P 500, QQQ 跟踪 NASDAQ 100
    # PE 历史范围来自长期数据 (用于 10 年分位计算)
    # earningsGrowth: 预估年盈利增长率, 用于估算 forward PE
    etf_map = {
        "sp500": {"symbol": "SPY", "pe_10y_range": (14, 35), "pe_5y_range": (18, 30), "earningsGrowth": 0.10},
        "nasdaq": {"symbol": "QQQ", "pe_10y_range": (18, 45), "pe_5y_range": (22, 38), "earningsGrowth": 0.15},
    }
    
    result = {}
    for key, cfg in etf_map.items():
        sym = cfg["symbol"]
        try:
            ticker = yf.Ticker(sym)
            try:
                info = ticker.info or {}
            except Exception as e:
                print(f"⚠️ 获取 {sym} info 失败: {e}")
                info = {}
            
            pe = _safe_round(info.get("trailingPE"), 2)
            
            # 前瞻 PE: 优先用 yfinance 提供的, 否则用预估增长率估算
            forward_pe = _safe_round(info.get("forwardPE"), 2)
            if not forward_pe and pe:
                growth = cfg["earningsGrowth"]
                forward_pe = _safe_round(pe / (1 + growth), 2)
            
            # 计算历史 PE 分位数
            # 方法: 用当前 PE 和 ETF 价格反推隐含 EPS
            # 再用历史价格 / 隐含 EPS 得到历史 PE 序列
            # 最后计算当前 PE 在该序列中的百分位
            # 注意: 这假设 EPS 恒定, 1年内较准确, 5年/10年会因盈利增长而偏高
            #       但这已比硬编码经验范围更准确
            percentile_1y = None
            percentile_5y = None
            percentile_10y = None
            
            pe_low, pe_high = cfg["pe_10y_range"]
            
            if pe and pe > 0:
                hist_latest = ticker.history(period="1d")
                if not hist_latest.empty:
                    current_etf_price = float(hist_latest.iloc[-1]["Close"])
                    implied_eps = current_etf_price / pe
                    
                    if implied_eps > 0:
                        for period, label in [("1y", "1y"), ("5y", "5y"), ("10y", "10y")]:
                            try:
                                interval = "1d" if period == "1y" else "1wk"
                                hist_p = ticker.history(period=period, interval=interval)
                                if not hist_p.empty and len(hist_p) > 10:
                                    pe_series = hist_p["Close"].values / implied_eps
                                    pct = float(np.sum(pe_series < pe) / len(pe_series) * 100)
                                    if label == "1y":
                                        percentile_1y = round(pct)
                                    elif label == "5y":
                                        percentile_5y = round(pct)
                                    else:
                                        percentile_10y = round(pct)
                            except Exception:
                                pass
            
            # 回撤计算
            current_price = 0
            high_52w = 0
            drawdown_52w = None
            all_time_high = 0
            drawdown_ath = None
            
            try:
                hist_1y = ticker.history(period="1y")
                if not hist_1y.empty:
                    current_price = float(hist_1y.iloc[-1]["Close"])
                    high_52w = float(hist_1y["High"].max())
                    drawdown_52w = round((current_price - high_52w) / high_52w * 100, 2) if high_52w > 0 else None
            except Exception as e:
                print(f"⚠️ 获取 {sym} 52周回撤失败: {e}")
            
            try:
                hist_max = ticker.history(period="max", interval="1wk")
                if not hist_max.empty:
                    all_time_high = float(hist_max["High"].max())
                else:
                    all_time_high = high_52w
                drawdown_ath = round((current_price - all_time_high) / all_time_high * 100, 2) if all_time_high > 0 else None
            except Exception as e:
                print(f"⚠️ 获取 {sym} ATH回撤失败: {e}")
                all_time_high = high_52w
                drawdown_ath = drawdown_52w
            
            result[key] = {
                "pe": pe,
                "forwardPE": forward_pe,
                "pePercentile1y": percentile_1y,
                "pePercentile5y": percentile_5y,
                "pePercentile10y": percentile_10y,
                "peRangeLow": pe_low,
                "peRangeHigh": pe_high,
                "drawdown52w": drawdown_52w,
                "high52w": _safe_round(high_52w),
                "drawdownATH": drawdown_ath,
                "allTimeHigh": _safe_round(all_time_high),
                "currentPrice": _safe_round(current_price),
            }
        except Exception as e:
            print(f"获取 {sym} 估值数据失败: {e}")
            pe_low, pe_high = cfg["pe_10y_range"]
            result[key] = {
                "pe": None, "forwardPE": None,
                "pePercentile1y": None, "pePercentile5y": None, "pePercentile10y": None,
                "peRangeLow": pe_low, "peRangeHigh": pe_high,
                "drawdown52w": None, "high52w": None,
                "drawdownATH": None, "allTimeHigh": None,
                "currentPrice": None,
            }
    
    return result


def fetch_sector_performance() -> list:
    """获取板块表现"""
    sectors = {
        "科技": "XLK",
        "医疗": "XLV",
        "金融": "XLF",
        "消费": "XLY",
        "工业": "XLI",
        "能源": "XLE",
        "公用事业": "XLU",
        "材料": "XLB",
        "房地产": "XLRE",
        "通信": "XLC",
        "日常消费品": "XLP",
    }
    
    result = []
    for name, sym in sectors.items():
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="5d")
            if len(hist) >= 2:
                current = float(hist.iloc[-1]["Close"])
                prev = float(hist.iloc[-2]["Close"])
                change_pct = ((current - prev) / prev) * 100
                result.append({
                    "name": name,
                    "symbol": sym,
                    "changePercent": round(change_pct, 2),
                })
        except Exception as e:
            print(f"获取板块 {name} ({sym}) 失败: {e}")
    
    result.sort(key=lambda x: x["changePercent"], reverse=True)
    return result


def fetch_news() -> list:
    """从多个RSS源获取财经新闻"""
    feeds = [
        ("https://feeds.finance.yahoo.com/rss/2.0/headline?s=^IXIC,^GSPC&region=US&lang=en-US", "Yahoo Finance"),
        ("https://www.cnbc.com/id/100003114/device/rss/rss.html", "CNBC"),
        ("https://feeds.marketwatch.com/marketwatch/topstories/", "MarketWatch"),
        ("https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", "Reuters"),
    ]
    
    all_news = []
    
    for feed_url, source_name in feeds:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:5]:
                title = entry.get("title", "").strip()
                summary = entry.get("summary", entry.get("description", "")).strip()
                # 清理 HTML 标签
                if summary:
                    summary = BeautifulSoup(summary, "html.parser").get_text()[:300]
                
                link = entry.get("link", "")
                published = entry.get("published", entry.get("updated", ""))
                
                if title:
                    sentiment = _analyze_sentiment(title + " " + summary)
                    all_news.append({
                        "title": title,
                        "summary": summary,
                        "source": source_name,
                        "url": link,
                        "publishedAt": published,
                        "sentiment": sentiment,
                    })
        except Exception as e:
            print(f"获取 {source_name} 新闻失败: {e}")
    
    # 去重并限制数量
    seen_titles = set()
    unique_news = []
    for news in all_news:
        title_key = news["title"][:50].lower()
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_news.append(news)
    
    return unique_news[:15]


def _analyze_sentiment(text: str) -> str:
    """简单的情绪分析"""
    text_lower = text.lower()
    
    positive_words = [
        "surge", "rally", "gain", "jump", "soar", "rise", "bull", "record",
        "high", "growth", "profit", "beat", "exceed", "optimism", "recovery",
        "boost", "strong", "upgrade", "outperform", "breakout",
    ]
    negative_words = [
        "fall", "drop", "crash", "plunge", "decline", "loss", "bear", "fear",
        "recession", "inflation", "crisis", "sell", "warning", "risk", "down",
        "cut", "weak", "downgrade", "underperform", "slump",
    ]
    
    pos_count = sum(1 for w in positive_words if w in text_lower)
    neg_count = sum(1 for w in negative_words if w in text_lower)
    
    if pos_count > neg_count:
        return "positive"
    elif neg_count > pos_count:
        return "negative"
    return "neutral"


def calculate_sentiment(nasdaq: dict, sp500: dict, indicators: dict, news: list) -> tuple:
    """综合计算市场情绪分数 (-100 到 100)"""
    score = 0
    
    # 1. 价格变动 (权重 30%)
    nasdaq_chg = nasdaq.get("changePercent", 0) or 0
    sp500_chg = sp500.get("changePercent", 0) or 0
    avg_chg = (nasdaq_chg + sp500_chg) / 2
    score += max(-30, min(30, avg_chg * 15))
    
    # 2. RSI (权重 15%)
    nasdaq_rsi = nasdaq.get("rsi14")
    sp500_rsi = sp500.get("rsi14")
    if nasdaq_rsi and sp500_rsi:
        avg_rsi = (nasdaq_rsi + sp500_rsi) / 2
        if avg_rsi > 70:
            score += 10  # 超买但显示强势
        elif avg_rsi < 30:
            score -= 15  # 超卖
        else:
            score += (avg_rsi - 50) * 0.3
    
    # 3. VIX 恐慌指数 (权重 20%)
    vix = indicators.get("vix")
    if vix:
        if vix < 15:
            score += 20
        elif vix < 20:
            score += 10
        elif vix < 25:
            score -= 5
        elif vix < 30:
            score -= 15
        else:
            score -= 20
    
    # 4. 均线位置 (权重 15%)
    for idx_data in [nasdaq, sp500]:
        price = idx_data.get("price", 0)
        sma20 = idx_data.get("sma20")
        sma50 = idx_data.get("sma50")
        sma200 = idx_data.get("sma200")
        
        if sma20 and price > sma20:
            score += 2.5
        elif sma20:
            score -= 2.5
        if sma50 and price > sma50:
            score += 2.5
        elif sma50:
            score -= 2.5
        if sma200 and price > sma200:
            score += 2.5
        elif sma200:
            score -= 2.5
    
    # 5. 新闻情绪 (权重 20%)
    if news:
        pos = sum(1 for n in news if n["sentiment"] == "positive")
        neg = sum(1 for n in news if n["sentiment"] == "negative")
        total = len(news)
        news_score = ((pos - neg) / total) * 20 if total > 0 else 0
        score += news_score
    
    score = max(-100, min(100, score))
    
    if score > 20:
        sentiment = "bullish"
    elif score < -20:
        sentiment = "bearish"
    else:
        sentiment = "neutral"
    
    return round(score), sentiment


def fetch_fear_greed() -> int | None:
    """尝试获取恐惧贪婪指数"""
    try:
        url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return int(data.get("fear_and_greed", {}).get("score", 50))
    except Exception:
        pass
    return None


# ---- 技术指标计算函数 ----

def _sma(prices: list, period: int):
    if len(prices) < period:
        return None
    return sum(prices[-period:]) / period


def _rsi(prices: list, period: int = 14):
    if len(prices) < period + 1:
        return None
    
    gains = []
    losses = []
    for i in range(1, len(prices)):
        delta = prices[i] - prices[i - 1]
        gains.append(max(0, delta))
        losses.append(max(0, -delta))
    
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    
    if avg_loss == 0:
        return 100.0
    
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def _macd(prices: list, fast=12, slow=26, signal=9):
    if len(prices) < slow + signal:
        return None, None, None
    
    ema_fast = _ema(prices, fast)
    ema_slow = _ema(prices, slow)
    
    if ema_fast is None or ema_slow is None:
        return None, None, None
    
    macd_line = ema_fast - ema_slow
    
    # 简化: 用最新值
    macd_values = []
    fast_ema_series = _ema_series(prices, fast)
    slow_ema_series = _ema_series(prices, slow)
    
    if fast_ema_series and slow_ema_series:
        min_len = min(len(fast_ema_series), len(slow_ema_series))
        macd_series = [fast_ema_series[-(min_len-i)] - slow_ema_series[-(min_len-i)] 
                       for i in range(min_len)]
        if len(macd_series) >= signal:
            signal_val = sum(macd_series[-signal:]) / signal
            histogram = macd_series[-1] - signal_val
            return macd_series[-1], signal_val, histogram
    
    return macd_line, None, None


def _ema(prices: list, period: int):
    if len(prices) < period:
        return None
    multiplier = 2 / (period + 1)
    ema = sum(prices[:period]) / period
    for price in prices[period:]:
        ema = (price - ema) * multiplier + ema
    return ema


def _ema_series(prices: list, period: int):
    if len(prices) < period:
        return None
    multiplier = 2 / (period + 1)
    ema = sum(prices[:period]) / period
    result = [ema]
    for price in prices[period:]:
        ema = (price - ema) * multiplier + ema
        result.append(ema)
    return result


def _bollinger(prices: list, period: int = 20, std_dev: int = 2):
    if len(prices) < period:
        return None, None, None
    
    sma = sum(prices[-period:]) / period
    variance = sum((p - sma) ** 2 for p in prices[-period:]) / period
    std = variance ** 0.5
    
    return sma + std_dev * std, sma, sma - std_dev * std


def _atr(highs: list, lows: list, closes: list, period: int = 14):
    if len(highs) < period + 1:
        return None
    
    tr_values = []
    for i in range(1, len(highs)):
        tr = max(
            highs[i] - lows[i],
            abs(highs[i] - closes[i - 1]),
            abs(lows[i] - closes[i - 1])
        )
        tr_values.append(tr)
    
    if len(tr_values) < period:
        return None
    return sum(tr_values[-period:]) / period


def _safe_round(value, decimals=2):
    if value is None:
        return None
    try:
        return round(float(value), decimals)
    except (TypeError, ValueError):
        return None


def _empty_index(symbol: str, name: str) -> dict:
    return {
        "symbol": symbol, "name": name,
        "price": 0, "change": 0, "changePercent": 0,
        "tradingDate": None,
        "open": 0, "high": 0, "low": 0, "previousClose": 0,
        "volume": 0, "avgVolume": 0, "yearHigh": 0, "yearHighDate": None, "yearLow": 0, "yearLowDate": None,
        "pe": None, "marketCap": None,
        "sma20": None, "sma50": None, "sma200": None,
        "rsi14": None, "macdLine": None, "macdSignal": None, "macdHistogram": None,
        "bollingerUpper": None, "bollingerMiddle": None, "bollingerLower": None,
        "atr14": None, "priceHistory": [],
    }


def update_index(summaries_path: str, data: dict):
    """更新 index.json"""
    summaries = []
    if os.path.exists(summaries_path):
        with open(summaries_path) as f:
            summaries = json.load(f)
    
    summary = {
        "date": data["date"],
        "overallSentiment": data["overallSentiment"],
        "sentimentScore": data["sentimentScore"],
        "nasdaqPrice": data["nasdaq"]["price"],
        "nasdaqChange": data["nasdaq"]["change"],
        "nasdaqChangePercent": data["nasdaq"]["changePercent"],
        "sp500Price": data["sp500"]["price"],
        "sp500Change": data["sp500"]["change"],
        "sp500ChangePercent": data["sp500"]["changePercent"],
        "vix": data["indicators"]["vix"],
        "newsCount": len(data["news"]),
    }
    
    # 替换或新增
    found = False
    for i, s in enumerate(summaries):
        if s["date"] == data["date"]:
            summaries[i] = summary
            found = True
            break
    if not found:
        summaries.append(summary)
    
    summaries.sort(key=lambda x: x["date"], reverse=True)
    
    with open(summaries_path, "w") as f:
        json.dump(summaries, f, indent=2, ensure_ascii=False)


def _next_trading_date(d: datetime) -> str:
    """计算下一个美股交易日（跳过周末）"""
    next_d = d + timedelta(days=1)
    # 跳过周末: 5=Saturday, 6=Sunday
    while next_d.weekday() in (5, 6):
        next_d += timedelta(days=1)
    return next_d.strftime("%Y-%m-%d")


def main():
    now = datetime.now()
    print(f"📊 脚本运行时间: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   将获取最近交易日收盘数据，生成下一交易日预测晴雨表\n")
    
    max_retries = 3
    
    # 1. 获取指数数据（带重试）
    print("  → 获取纳斯达克数据...")
    nasdaq = None
    for attempt in range(max_retries):
        try:
            nasdaq = fetch_index_data("^IXIC", "NASDAQ Composite")
            if nasdaq and nasdaq.get("price", 0) > 0:
                break
        except Exception as e:
            print(f"    ⚠️ 第 {attempt + 1} 次尝试失败: {e}")
    if not nasdaq or nasdaq.get("price", 0) == 0:
        nasdaq = _empty_index("^IXIC", "NASDAQ Composite")
        print("    ⚠️ 纳指数据获取失败，使用空数据")
    
    print("  → 获取标普500数据...")
    sp500 = None
    for attempt in range(max_retries):
        try:
            sp500 = fetch_index_data("^GSPC", "S&P 500")
            if sp500 and sp500.get("price", 0) > 0:
                break
        except Exception as e:
            print(f"    ⚠️ 第 {attempt + 1} 次尝试失败: {e}")
    if not sp500 or sp500.get("price", 0) == 0:
        sp500 = _empty_index("^GSPC", "S&P 500")
        print("    ⚠️ 标普数据获取失败，使用空数据")
    
    # 如果两个核心指数的数据都获取失败，退出
    if nasdaq.get("price", 0) == 0 and sp500.get("price", 0) == 0:
        print("❌ 核心指数数据全部获取失败，退出")
        sys.exit(1)
    
    # 确定数据对应的交易日和下一个交易日（预测目标）
    # tradingDate 来自 yfinance 返回的实际最近交易日
    data_date = nasdaq.get("tradingDate") or sp500.get("tradingDate") or now.strftime("%Y-%m-%d")
    data_date_dt = datetime.strptime(data_date, "%Y-%m-%d")
    forecast_date = _next_trading_date(data_date_dt)
    
    print(f"\n  📅 数据交易日: {data_date}")
    print(f"  🔮 预测目标日: {forecast_date}\n")
    
    # 2. 获取市场指标
    print("  → 获取市场宏观指标...")
    try:
        indicators = fetch_market_indicators()
    except Exception as e:
        print(f"    ⚠️ 宏观指标获取失败: {e}")
        indicators = {}
    
    # 3. 获取板块表现
    print("  → 获取板块表现...")
    try:
        sectors = fetch_sector_performance()
    except Exception as e:
        print(f"    ⚠️ 板块数据获取失败: {e}")
        sectors = []
    
    # 4. 获取新闻
    print("  → 获取财经新闻...")
    try:
        news = fetch_news()
    except Exception as e:
        print(f"    ⚠️ 新闻获取失败: {e}")
        news = []
    
    # 5. 获取恐惧贪婪指数
    print("  → 获取恐惧贪婪指数...")
    fear_greed = fetch_fear_greed()
    
    # 6. 获取估值和回撤数据（定投参考）
    print("  → 获取估值和回撤数据...")
    try:
        valuation = fetch_valuation_data()
    except Exception as e:
        print(f"    ⚠️ 估值数据获取失败: {e}")
        valuation = {}
    
    # 7. 计算综合情绪
    sentiment_score, sentiment = calculate_sentiment(nasdaq, sp500, indicators, news)
    
    # 8. 组装数据
    # date: 文件日期使用预测目标日（方便按日期查看）
    # dataDate: 数据实际对应的交易日
    # forecastDate: 预测的下一个交易日
    data = {
        "date": forecast_date,
        "dataDate": data_date,
        "forecastDate": forecast_date,
        "timestamp": now.isoformat(),
        "marketStatus": "closed",
        "overallSentiment": sentiment,
        "sentimentScore": sentiment_score,
        "nasdaq": nasdaq,
        "sp500": sp500,
        "indicators": indicators,
        "sectors": sectors,
        "news": news,
        "fearGreedIndex": fear_greed,
        "valuation": valuation,
        "advanceDeclineRatio": None,
        "putCallRatio": None,
    }
    
    # 8. 保存数据（文件名使用预测日期）
    output_path = DATA_DIR / f"{forecast_date}.json"
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ 数据已保存到 {output_path}")
    
    # 9. 更新索引
    index_path = DATA_DIR / "index.json"
    update_index(str(index_path), data)
    print(f"  ✅ 索引已更新 {index_path}")
    
    print(f"\n🎯 市场情绪: {sentiment.upper()} (得分: {sentiment_score})")
    print(f"   基于 {data_date} 收盘数据 → 预测 {forecast_date} 走势")
    print(f"   纳指: {nasdaq['price']} ({nasdaq['changePercent']:+.2f}%)")
    print(f"   标普: {sp500['price']} ({sp500['changePercent']:+.2f}%)")
    if indicators.get("vix"):
        print(f"   VIX:  {indicators['vix']}")
    print(f"   新闻: {len(news)} 条")


if __name__ == "__main__":
    main()
