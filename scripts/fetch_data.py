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
    ticker = yf.Ticker(symbol)
    
    # 获取最近60天的历史数据用于计算技术指标
    hist = ticker.history(period="3mo")
    if hist.empty:
        print(f"警告: 无法获取 {symbol} 的历史数据")
        return _empty_index(symbol, name)
    
    info = ticker.info or {}
    
    current = hist.iloc[-1]
    prev = hist.iloc[-2] if len(hist) > 1 else current
    
    price = float(current["Close"])
    prev_close = float(prev["Close"])
    change = price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close != 0 else 0
    
    # 计算技术指标
    closes = hist["Close"].values.tolist()
    volumes = hist["Volume"].values.tolist()
    highs = hist["High"].values.tolist()
    lows = hist["Low"].values.tolist()
    
    sma20 = _sma(closes, 20)
    sma50 = _sma(closes, 50)
    sma200 = _sma(closes, 200) if len(closes) >= 200 else None
    rsi14 = _rsi(closes, 14)
    macd_line, macd_signal, macd_hist = _macd(closes)
    bb_upper, bb_middle, bb_lower = _bollinger(closes, 20)
    atr14 = _atr(highs, lows, closes, 14)
    
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
        "open": round(float(current["Open"]), 2),
        "high": round(float(current["High"]), 2),
        "low": round(float(current["Low"]), 2),
        "previousClose": round(prev_close, 2),
        "volume": int(current["Volume"]),
        "avgVolume": int(sum(volumes[-20:]) / min(20, len(volumes))),
        "yearHigh": round(float(info.get("fiftyTwoWeekHigh", max(highs))), 2),
        "yearLow": round(float(info.get("fiftyTwoWeekLow", min(lows))), 2),
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
    """获取市场宏观指标"""
    symbols = {
        "vix": "^VIX",
        "dxy": "DX-Y.NYB",
        "us10y": "^TNX",
        "us2y": "^IRX",
        "gold": "GC=F",
        "oil": "CL=F",
        "btc": "BTC-USD",
    }
    
    result = {}
    for key, sym in symbols.items():
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="5d")
            if len(hist) >= 2:
                current = float(hist.iloc[-1]["Close"])
                prev = float(hist.iloc[-2]["Close"])
                change = current - prev
                result[key] = round(current, 2)
                result[f"{key}Change"] = round(change, 2)
            elif len(hist) == 1:
                result[key] = round(float(hist.iloc[-1]["Close"]), 2)
                result[f"{key}Change"] = 0
            else:
                result[key] = None
                result[f"{key}Change"] = None
        except Exception as e:
            print(f"获取 {sym} 失败: {e}")
            result[key] = None
            result[f"{key}Change"] = None
    
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
        "open": 0, "high": 0, "low": 0, "previousClose": 0,
        "volume": 0, "avgVolume": 0, "yearHigh": 0, "yearLow": 0,
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


def main():
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"📊 正在获取 {today} 的市场数据...")
    
    # 1. 获取指数数据
    print("  → 获取纳斯达克数据...")
    nasdaq = fetch_index_data("^IXIC", "NASDAQ Composite")
    
    print("  → 获取标普500数据...")
    sp500 = fetch_index_data("^GSPC", "S&P 500")
    
    # 2. 获取市场指标
    print("  → 获取市场宏观指标...")
    indicators = fetch_market_indicators()
    
    # 3. 获取板块表现
    print("  → 获取板块表现...")
    sectors = fetch_sector_performance()
    
    # 4. 获取新闻
    print("  → 获取财经新闻...")
    news = fetch_news()
    
    # 5. 获取恐惧贪婪指数
    print("  → 获取恐惧贪婪指数...")
    fear_greed = fetch_fear_greed()
    
    # 6. 计算综合情绪
    sentiment_score, sentiment = calculate_sentiment(nasdaq, sp500, indicators, news)
    
    # 7. 组装数据
    data = {
        "date": today,
        "timestamp": datetime.now().isoformat(),
        "marketStatus": "closed",
        "overallSentiment": sentiment,
        "sentimentScore": sentiment_score,
        "nasdaq": nasdaq,
        "sp500": sp500,
        "indicators": indicators,
        "sectors": sectors,
        "news": news,
        "fearGreedIndex": fear_greed,
        "advanceDeclineRatio": None,
        "putCallRatio": None,
    }
    
    # 8. 保存数据
    output_path = DATA_DIR / f"{today}.json"
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ 数据已保存到 {output_path}")
    
    # 9. 更新索引
    index_path = DATA_DIR / "index.json"
    update_index(str(index_path), data)
    print(f"  ✅ 索引已更新 {index_path}")
    
    print(f"\n🎯 市场情绪: {sentiment.upper()} (得分: {sentiment_score})")
    print(f"   纳指: {nasdaq['price']} ({nasdaq['changePercent']:+.2f}%)")
    print(f"   标普: {sp500['price']} ({sp500['changePercent']:+.2f}%)")
    if indicators.get("vix"):
        print(f"   VIX:  {indicators['vix']}")
    print(f"   新闻: {len(news)} 条")


if __name__ == "__main__":
    main()
