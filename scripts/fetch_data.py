#!/usr/bin/env python3
"""
投资晴雨表数据抓取脚本
数据源优先级:
  1. Yahoo Finance Chart API (直接 HTTP, 无需 yfinance 库)
  2. 东方财富 API (备选)
  3. CoinGecko (加密货币)
  4. RSS (新闻)
完全免费，无需 API Key
"""

import json
import os
import sys
import time
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

import requests
import feedparser
from bs4 import BeautifulSoup

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# ============================
# HTTP 配置
# ============================
_session = requests.Session()
_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
})

# 东方财富 secid 映射 (备选数据源)
EM_SECID = {
    "^IXIC": "100.NDX", "^GSPC": "100.SPX",
    "^VIX": None,  # 东财没有 VIX
    "DX-Y.NYB": "100.UDI", "^TNX": "171.US10Y",
    "GC=F": "101.GC00Y", "CL=F": "102.CL00Y",
}

# 板块 ETF
SECTOR_MAP = {
    "XLK": "科技", "XLV": "医疗", "XLF": "金融", "XLY": "消费",
    "XLI": "工业", "XLE": "能源", "XLU": "公用事业", "XLB": "材料",
    "XLRE": "房地产", "XLC": "通信", "XLP": "日常消费品",
}


# ============================
# Yahoo Finance Chart API
# ============================

def _yf_chart(symbol: str, range_: str = "3mo", interval: str = "1d", max_retries: int = 3) -> dict | None:
    """从 Yahoo Finance Chart API 获取数据
    优先使用 curl (绕过 Python requests 被限速的问题)，fallback 到 requests
    """
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range={range_}&interval={interval}"

    for attempt in range(max_retries):
        # 方法 1: 使用 curl (更可靠，不会被 YF 识别限速)
        try:
            result = subprocess.run(
                ["curl", "-s", "--max-time", "20", "-H", "User-Agent: Mozilla/5.0", url],
                capture_output=True, text=True, timeout=25,
            )
            if result.returncode == 0 and result.stdout:
                data = json.loads(result.stdout)
                results = data.get("chart", {}).get("result", [])
                if results:
                    return results[0]
                err = data.get("chart", {}).get("error", {})
                if err:
                    print(f"    ⚠️ YF {symbol}: {err.get('description', 'unknown error')}")
        except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
            pass

        # 方法 2: fallback 到 requests
        try:
            resp = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            }, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("chart", {}).get("result", [])
                if results:
                    return results[0]
        except Exception:
            pass

        if attempt < max_retries - 1:
            time.sleep((attempt + 1) * 3)

    print(f"    ⚠️ YF chart {symbol} 全部尝试失败")
    return None


def _yf_extract_ohlcv(chart_data: dict) -> list[dict]:
    """从 chart API 结果提取 OHLCV 数据"""
    if not chart_data:
        return []
    timestamps = chart_data.get("timestamp", [])
    quotes = chart_data.get("indicators", {}).get("quote", [{}])[0]
    opens = quotes.get("open", [])
    highs = quotes.get("high", [])
    lows = quotes.get("low", [])
    closes = quotes.get("close", [])
    volumes = quotes.get("volume", [])

    result = []
    for i, ts in enumerate(timestamps):
        c = closes[i] if i < len(closes) else None
        if c is None:
            continue
        result.append({
            "date": datetime.fromtimestamp(ts).strftime("%Y-%m-%d"),
            "open": round(float(opens[i]), 2) if opens[i] else 0,
            "close": round(float(c), 2),
            "high": round(float(highs[i]), 2) if highs[i] else 0,
            "low": round(float(lows[i]), 2) if lows[i] else 0,
            "volume": int(volumes[i]) if volumes[i] else 0,
        })
    return result


# ============================
# 东方财富 API (备选)
# ============================

def _em_klines(secid: str, beg: str, end: str, klt: int = 101, max_retries: int = 3) -> list[dict]:
    """从东方财富获取历史 K 线"""
    url = (
        f"https://push2his.eastmoney.com/api/qt/stock/kline/get"
        f"?secid={secid}"
        f"&fields1=f1,f2,f3,f4,f5,f6"
        f"&fields2=f51,f52,f53,f54,f55,f56,f57"
        f"&klt={klt}&fqt=0"
        f"&beg={beg}&end={end}"
    )
    headers = {
        "Referer": "https://quote.eastmoney.com",
        "Accept": "application/json",
    }
    for attempt in range(max_retries):
        try:
            resp = _session.get(url, headers=headers, timeout=15)
            data = resp.json()
            data_obj = data.get("data")
            if data_obj is None:
                return []
            raw = data_obj.get("klines", [])
            result = []
            for k in raw:
                parts = k.split(",")
                result.append({
                    "date": parts[0],
                    "open": float(parts[1]),
                    "close": float(parts[2]),
                    "high": float(parts[3]),
                    "low": float(parts[4]),
                    "volume": int(float(parts[5])),
                })
            return result
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep((attempt + 1) * 3)
            else:
                print(f"    ⚠️ 东财 {secid} K线失败: {e}")
    return []


# ============================
# 通用数据获取 (多数据源)
# ============================

def _get_klines(symbol: str, days: int = 100) -> list[dict]:
    """获取 K 线数据，优先 Yahoo Finance，备选东方财富"""
    # 尝试 Yahoo Finance
    range_ = "3mo" if days <= 100 else "1y" if days <= 370 else "5y"
    chart = _yf_chart(symbol, range_=range_)
    if chart:
        klines = _yf_extract_ohlcv(chart)
        if klines:
            return klines

    # 备选: 东方财富
    secid = EM_SECID.get(symbol)
    if secid:
        now = datetime.now()
        beg = (now - timedelta(days=days + 10)).strftime("%Y%m%d")
        end = now.strftime("%Y%m%d")
        klines = _em_klines(secid, beg, end)
        if klines:
            return klines

    return []


# ============================
# 业务数据获取函数
# ============================

def fetch_index_data(symbol: str, name: str) -> dict:
    """获取指数数据和技术指标"""
    klines = _get_klines(symbol, days=100)

    if len(klines) < 2:
        print(f"  ⚠️ {symbol} 历史数据不足 (仅 {len(klines)} 条)")
        return _empty_index(symbol, name)

    current = klines[-1]
    prev = klines[-2]

    price = current["close"]
    prev_close = prev["close"]
    change = price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close != 0 else 0

    closes = [k["close"] for k in klines]
    volumes = [k["volume"] for k in klines]
    highs = [k["high"] for k in klines]
    lows = [k["low"] for k in klines]

    # 52 周高低
    time.sleep(0.5)
    klines_1y = _get_klines(symbol, days=370)
    if not klines_1y:
        klines_1y = klines

    year_high = max(k["high"] for k in klines_1y)
    year_low = min(k["low"] for k in klines_1y)
    year_high_date = next((k["date"] for k in klines_1y if k["high"] == year_high), None)
    year_low_date = next((k["date"] for k in klines_1y if k["low"] == year_low), None)

    # 技术指标
    sma20 = _sma(closes, 20)
    sma50 = _sma(closes, 50)
    sma200 = _sma(closes, 200) if len(closes) >= 200 else None
    rsi14 = _rsi(closes, 14)

    try:
        macd_line, macd_signal, macd_hist = _macd(closes)
    except Exception:
        macd_line = macd_signal = macd_hist = None

    try:
        bb_upper, bb_middle, bb_lower = _bollinger(closes, 20)
    except Exception:
        bb_upper = bb_middle = bb_lower = None

    try:
        atr14 = _atr(highs, lows, closes, 14)
    except Exception:
        atr14 = None

    # 最近 30 天价格历史
    price_history = [
        {"date": k["date"], "close": round(k["close"], 2), "volume": k["volume"]}
        for k in klines[-30:]
    ]

    return {
        "symbol": symbol,
        "name": name,
        "price": round(price, 2),
        "change": round(change, 2),
        "changePercent": round(change_pct, 2),
        "tradingDate": current["date"],
        "open": round(current["open"], 2),
        "high": round(current["high"], 2),
        "low": round(current["low"], 2),
        "previousClose": round(prev_close, 2),
        "volume": current["volume"],
        "avgVolume": int(sum(volumes[-20:]) / min(20, len(volumes))),
        "yearHigh": round(year_high, 2),
        "yearHighDate": year_high_date,
        "yearLow": round(year_low, 2),
        "yearLowDate": year_low_date,
        "pe": None, "marketCap": None,
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
    """获取市场宏观指标（含近 30 天历史）"""
    result = {}

    # Yahoo Finance symbols
    symbols = {
        "vix": "^VIX",
        "dxy": "DX-Y.NYB",
        "us10y": "^TNX",
        "us2y": "^IRX",
        "gold": "GC=F",
        "oil": "CL=F",
    }

    for key, sym in symbols.items():
        try:
            klines = _get_klines(sym, days=70)
            if klines and len(klines) >= 2:
                current = klines[-1]["close"]
                prev = klines[-2]["close"]
                change = current - prev
                result[key] = round(current, 2)
                result[f"{key}Change"] = round(change, 2)
                recent = klines[-30:] if len(klines) >= 30 else klines
                result[f"{key}History"] = [round(k["close"], 2) for k in recent]
                result[f"{key}HistoryStart"] = recent[0]["date"]
                result[f"{key}HistoryEnd"] = recent[-1]["date"]
            elif klines and len(klines) == 1:
                result[key] = round(klines[0]["close"], 2)
                result[f"{key}Change"] = 0
                result[f"{key}History"] = [round(klines[0]["close"], 2)]
            else:
                result[key] = None
                result[f"{key}Change"] = None
                result[f"{key}History"] = []
        except Exception as e:
            print(f"  ⚠️ 获取 {key} ({sym}) 失败: {e}")
            result[key] = None
            result[f"{key}Change"] = None
            result[f"{key}History"] = []
        time.sleep(0.3)

    # 加密货币: CoinGecko
    for coin_id, key in [("bitcoin", "btc"), ("ethereum", "eth")]:
        try:
            # 获取 30 天历史
            hist_url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days=30"
            hist_resp = requests.get(hist_url, timeout=15)
            hist_data = hist_resp.json()
            prices = hist_data.get("prices", [])
            if prices:
                # 按天去重
                daily = {}
                for ts_ms, p in prices:
                    day = datetime.fromtimestamp(ts_ms / 1000).strftime("%Y-%m-%d")
                    daily[day] = round(p, 2)
                days_sorted = sorted(daily.keys())
                history = [daily[d] for d in days_sorted]

                current_val = history[-1] if history else None
                prev_val = history[-2] if len(history) >= 2 else None
                change_val = round(current_val - prev_val, 2) if current_val and prev_val else None

                result[key] = current_val
                result[f"{key}Change"] = change_val
                result[f"{key}History"] = history[-30:]
                result[f"{key}HistoryStart"] = days_sorted[0] if days_sorted else None
                result[f"{key}HistoryEnd"] = days_sorted[-1] if days_sorted else None
            else:
                result[key] = None
                result[f"{key}Change"] = None
                result[f"{key}History"] = []
        except Exception as e:
            print(f"  ⚠️ 获取 {coin_id} 失败: {e}")
            result[key] = None
            result[f"{key}Change"] = None
            result[f"{key}History"] = []
        time.sleep(0.5)

    return result


def fetch_valuation_data() -> dict:
    """获取估值和回撤数据"""
    etf_configs = {
        "sp500": {"symbol": "SPY", "pe_10y_range": (14, 35), "earningsGrowth": 0.10},
        "nasdaq": {"symbol": "QQQ", "pe_10y_range": (18, 45), "earningsGrowth": 0.15},
    }

    result = {}
    for key, cfg in etf_configs.items():
        pe_low, pe_high = cfg["pe_10y_range"]
        try:
            # 获取 1 年历史
            klines_1y = _get_klines(cfg["symbol"], days=370)
            if not klines_1y:
                raise ValueError(f"无法获取 {cfg['symbol']} 数据")

            current_price = klines_1y[-1]["close"]
            high_52w = max(k["high"] for k in klines_1y)
            drawdown_52w = round((current_price - high_52w) / high_52w * 100, 2) if high_52w > 0 else None

            # ATH (使用更长历史)
            time.sleep(0.5)
            klines_max = _get_klines(cfg["symbol"], days=3650)
            all_time_high = max(k["high"] for k in klines_max) if klines_max else high_52w
            drawdown_ath = round((current_price - all_time_high) / all_time_high * 100, 2) if all_time_high > 0 else None

            # PE: 尝试从 YF chart meta 获取
            pe = None
            forward_pe = None
            chart = _yf_chart(cfg["symbol"], range_="1d")
            if chart:
                meta = chart.get("meta", {})
                # YF chart meta 不直接提供 PE，但可以尝试
                pe = None  # Chart API 不提供 PE

            if pe:
                forward_pe = round(pe / (1 + cfg["earningsGrowth"]), 2)

            # 价格分位数估算
            closes_1y = [k["close"] for k in klines_1y]
            pct_1y = round(sum(1 for c in closes_1y if c < current_price) / len(closes_1y) * 100)

            result[key] = {
                "pe": pe, "forwardPE": forward_pe,
                "pePercentile1y": pct_1y,
                "pePercentile5y": None, "pePercentile10y": None,
                "peRangeLow": pe_low, "peRangeHigh": pe_high,
                "drawdown52w": drawdown_52w,
                "high52w": _safe_round(high_52w),
                "drawdownATH": drawdown_ath,
                "allTimeHigh": _safe_round(all_time_high),
                "currentPrice": _safe_round(current_price),
            }
        except Exception as e:
            print(f"  ⚠️ 获取 {key} 估值失败: {e}")
            result[key] = {
                "pe": None, "forwardPE": None,
                "pePercentile1y": None, "pePercentile5y": None, "pePercentile10y": None,
                "peRangeLow": pe_low, "peRangeHigh": pe_high,
                "drawdown52w": None, "high52w": None,
                "drawdownATH": None, "allTimeHigh": None,
                "currentPrice": None,
            }
        time.sleep(0.5)

    return result


def fetch_sector_performance() -> list:
    """获取板块表现"""
    result = []
    for sym, name in SECTOR_MAP.items():
        try:
            klines = _get_klines(sym, days=10)
            if klines and len(klines) >= 2:
                current = klines[-1]["close"]
                prev = klines[-2]["close"]
                change_pct = ((current - prev) / prev) * 100
                result.append({
                    "name": name,
                    "symbol": sym,
                    "changePercent": round(change_pct, 2),
                })
        except Exception as e:
            print(f"  ⚠️ 获取板块 {name} ({sym}) 失败: {e}")
        time.sleep(0.3)

    result.sort(key=lambda x: x["changePercent"], reverse=True)
    return result


def fetch_news() -> list:
    """从 RSS 源获取财经新闻"""
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
                if summary:
                    summary = BeautifulSoup(summary, "html.parser").get_text()[:300]
                link = entry.get("link", "")
                published = entry.get("published", entry.get("updated", ""))
                if title:
                    all_news.append({
                        "title": title,
                        "summary": summary,
                        "source": source_name,
                        "url": link,
                        "publishedAt": published,
                        "sentiment": _analyze_sentiment(title + " " + summary),
                    })
        except Exception as e:
            print(f"  ⚠️ 获取 {source_name} 新闻失败: {e}")

    seen = set()
    unique = []
    for n in all_news:
        k = n["title"][:50].lower()
        if k not in seen:
            seen.add(k)
            unique.append(n)
    return unique[:15]


def _analyze_sentiment(text: str) -> str:
    t = text.lower()
    pos = ["surge", "rally", "gain", "jump", "soar", "rise", "bull", "record",
           "high", "growth", "profit", "beat", "exceed", "optimism", "recovery",
           "boost", "strong", "upgrade", "outperform", "breakout"]
    neg = ["fall", "drop", "crash", "plunge", "decline", "loss", "bear", "fear",
           "recession", "inflation", "crisis", "sell", "warning", "risk", "down",
           "cut", "weak", "downgrade", "underperform", "slump"]
    p = sum(1 for w in pos if w in t)
    n = sum(1 for w in neg if w in t)
    return "positive" if p > n else ("negative" if n > p else "neutral")


def calculate_sentiment(nasdaq: dict, sp500: dict, indicators: dict, news: list) -> tuple:
    """综合计算市场情绪 (-100 到 100)"""
    score = 0

    # 价格变动 (30%)
    avg_chg = ((nasdaq.get("changePercent", 0) or 0) + (sp500.get("changePercent", 0) or 0)) / 2
    score += max(-30, min(30, avg_chg * 15))

    # RSI (15%)
    rsi_n, rsi_s = nasdaq.get("rsi14"), sp500.get("rsi14")
    if rsi_n and rsi_s:
        avg_rsi = (rsi_n + rsi_s) / 2
        if avg_rsi > 70:
            score += 10
        elif avg_rsi < 30:
            score -= 15
        else:
            score += (avg_rsi - 50) * 0.3

    # VIX (20%)
    vix = indicators.get("vix")
    if vix:
        if vix < 15: score += 20
        elif vix < 20: score += 10
        elif vix < 25: score -= 5
        elif vix < 30: score -= 15
        else: score -= 20

    # 均线 (15%)
    for d in [nasdaq, sp500]:
        p = d.get("price", 0)
        for ma in ["sma20", "sma50", "sma200"]:
            v = d.get(ma)
            if v:
                score += 2.5 if p > v else -2.5

    # 新闻 (20%)
    if news:
        pos = sum(1 for n in news if n["sentiment"] == "positive")
        neg = sum(1 for n in news if n["sentiment"] == "negative")
        score += ((pos - neg) / len(news)) * 20

    score = max(-100, min(100, score))
    if score > 20: s = "bullish"
    elif score < -20: s = "bearish"
    else: s = "neutral"
    return round(score), s


def fetch_fear_greed() -> int | None:
    """获取恐惧贪婪指数"""
    for url, parser in [
        ("https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
         lambda d: int(d.get("fear_and_greed", {}).get("score", 50))),
        ("https://api.alternative.me/fng/?limit=1",
         lambda d: int(d.get("data", [{}])[0].get("value", 50))),
    ]:
        try:
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if resp.status_code == 200:
                return parser(resp.json())
        except Exception:
            continue
    return None


# ---- 技术指标 ----

def _sma(prices, period):
    return sum(prices[-period:]) / period if len(prices) >= period else None

def _rsi(prices, period=14):
    if len(prices) < period + 1: return None
    gains, losses = [], []
    for i in range(1, len(prices)):
        d = prices[i] - prices[i-1]
        gains.append(max(0, d)); losses.append(max(0, -d))
    ag = sum(gains[-period:]) / period
    al = sum(losses[-period:]) / period
    return 100.0 if al == 0 else 100 - (100 / (1 + ag / al))

def _ema(prices, period):
    if len(prices) < period: return None
    m = 2 / (period + 1)
    e = sum(prices[:period]) / period
    for p in prices[period:]: e = (p - e) * m + e
    return e

def _ema_series(prices, period):
    if len(prices) < period: return None
    m = 2 / (period + 1)
    e = sum(prices[:period]) / period
    r = [e]
    for p in prices[period:]: e = (p - e) * m + e; r.append(e)
    return r

def _macd(prices, fast=12, slow=26, signal=9):
    if len(prices) < slow + signal: return None, None, None
    fs = _ema_series(prices, fast)
    ss = _ema_series(prices, slow)
    if not fs or not ss: return None, None, None
    ml = min(len(fs), len(ss))
    ms = [fs[-(ml-i)] - ss[-(ml-i)] for i in range(ml)]
    if len(ms) >= signal:
        sv = sum(ms[-signal:]) / signal
        return ms[-1], sv, ms[-1] - sv
    ef, es = _ema(prices, fast), _ema(prices, slow)
    return (ef - es if ef and es else None), None, None

def _bollinger(prices, period=20, std_dev=2):
    if len(prices) < period: return None, None, None
    s = sum(prices[-period:]) / period
    v = sum((p - s) ** 2 for p in prices[-period:]) / period
    d = v ** 0.5
    return s + std_dev * d, s, s - std_dev * d

def _atr(highs, lows, closes, period=14):
    if len(highs) < period + 1: return None
    tr = [max(highs[i]-lows[i], abs(highs[i]-closes[i-1]), abs(lows[i]-closes[i-1])) for i in range(1, len(highs))]
    return sum(tr[-period:]) / period if len(tr) >= period else None

def _safe_round(v, d=2):
    try: return round(float(v), d) if v is not None else None
    except: return None

def _empty_index(symbol, name):
    return {
        "symbol": symbol, "name": name,
        "price": 0, "change": 0, "changePercent": 0, "tradingDate": None,
        "open": 0, "high": 0, "low": 0, "previousClose": 0,
        "volume": 0, "avgVolume": 0,
        "yearHigh": 0, "yearHighDate": None, "yearLow": 0, "yearLowDate": None,
        "pe": None, "marketCap": None,
        "sma20": None, "sma50": None, "sma200": None,
        "rsi14": None, "macdLine": None, "macdSignal": None, "macdHistogram": None,
        "bollingerUpper": None, "bollingerMiddle": None, "bollingerLower": None,
        "atr14": None, "priceHistory": [],
    }


def update_index(path, data):
    summaries = json.load(open(path)) if os.path.exists(path) else []
    s = {
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
    found = False
    for i, x in enumerate(summaries):
        if x["date"] == data["date"]:
            summaries[i] = s; found = True; break
    if not found:
        summaries.append(s)
    summaries.sort(key=lambda x: x["date"], reverse=True)
    with open(path, "w") as f:
        json.dump(summaries, f, indent=2, ensure_ascii=False)


def _next_trading_date(d):
    n = d + timedelta(days=1)
    while n.weekday() in (5, 6): n += timedelta(days=1)
    return n.strftime("%Y-%m-%d")


def main():
    from zoneinfo import ZoneInfo
    now = datetime.now(ZoneInfo("Asia/Shanghai"))
    print(f"📊 脚本运行时间: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   数据源: Yahoo Finance Chart API + CoinGecko + RSS\n")

    # 1. 指数
    print("  → 获取纳斯达克数据...")
    nasdaq = fetch_index_data("^IXIC", "NASDAQ Composite")
    time.sleep(1)

    print("  → 获取标普500数据...")
    sp500 = fetch_index_data("^GSPC", "S&P 500")
    time.sleep(1)

    if nasdaq.get("price", 0) == 0 and sp500.get("price", 0) == 0:
        print("❌ 核心指数数据全部获取失败，退出")
        sys.exit(1)

    data_date = nasdaq.get("tradingDate") or sp500.get("tradingDate") or now.strftime("%Y-%m-%d")
    forecast_date = _next_trading_date(datetime.strptime(data_date, "%Y-%m-%d"))

    print(f"\n  📅 数据交易日: {data_date}")
    print(f"  🔮 预测目标日: {forecast_date}\n")

    # 2. 宏观指标
    print("  → 获取市场宏观指标...")
    indicators = fetch_market_indicators()

    # 3. 板块
    print("  → 获取板块表现...")
    sectors = fetch_sector_performance()

    # 4. 新闻
    print("  → 获取财经新闻...")
    news = fetch_news()

    # 5. 恐惧贪婪
    print("  → 获取恐惧贪婪指数...")
    fear_greed = fetch_fear_greed()

    # 6. 估值
    print("  → 获取估值和回撤数据...")
    valuation = fetch_valuation_data()

    # 7. 情绪
    sentiment_score, sentiment = calculate_sentiment(nasdaq, sp500, indicators, news)

    # 8. 组装
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

    # 9. 保存
    output_path = DATA_DIR / f"{forecast_date}.json"
    if output_path.exists():
        print(f"  ⚠️ 覆盖已有文件 {output_path.name}")
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ 数据已保存到 {output_path}")

    # 10. 清理重复
    for fp in DATA_DIR.glob("*.json"):
        if fp.name in ("index.json", f"{forecast_date}.json"):
            continue
        try:
            existing = json.load(open(fp))
            if existing.get("dataDate") == data_date and existing.get("date") != forecast_date:
                print(f"  🗑️ 清理重复: {fp.name}")
                fp.unlink()
        except Exception:
            pass

    # 11. 更新索引
    index_path = str(DATA_DIR / "index.json")
    update_index(index_path, data)

    # 清理孤立索引记录
    try:
        summaries = json.load(open(index_path))
        cleaned = [s for s in summaries if os.path.exists(str(DATA_DIR / f"{s['date']}.json")) or s["date"] == forecast_date]
        if len(cleaned) != len(summaries):
            with open(index_path, "w") as f:
                json.dump(cleaned, f, indent=2, ensure_ascii=False)
    except Exception:
        pass

    print(f"  ✅ 索引已更新")

    print(f"\n🎯 市场情绪: {sentiment.upper()} (得分: {sentiment_score})")
    print(f"   基于 {data_date} 收盘数据 → 预测 {forecast_date} 走势")
    print(f"   纳指: {nasdaq['price']} ({nasdaq['changePercent']:+.2f}%)")
    print(f"   标普: {sp500['price']} ({sp500['changePercent']:+.2f}%)")
    if indicators.get("vix"):
        print(f"   VIX:  {indicators['vix']}")
    print(f"   新闻: {len(news)} 条")


if __name__ == "__main__":
    main()
