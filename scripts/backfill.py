#!/usr/bin/env python3
"""
回填缺失交易日数据
用法: python3 scripts/backfill.py 2026-03-27 2026-04-06
"""

import sys
import os
import json
import time
from datetime import datetime
from pathlib import Path

# 将项目根目录加入 path 以复用 fetch_data 中的函数
sys.path.insert(0, str(Path(__file__).parent))
from fetch_data import (
    fetch_index_data,
    fetch_market_indicators,
    fetch_sector_performance,
    fetch_news,
    fetch_fear_greed,
    fetch_valuation_data,
    calculate_sentiment,
    update_index,
    _next_trading_date,
    _clean_nan,
    DATA_DIR,
)


def backfill_date(target_date: str):
    """为指定交易日生成数据文件"""
    output_path = DATA_DIR / f"{target_date}.json"
    if output_path.exists():
        print(f"⏭️  {target_date} 已存在，跳过")
        return

    d = datetime.strptime(target_date, "%Y-%m-%d")
    if d.weekday() >= 5:
        print(f"⏭️  {target_date} 是周末，跳过")
        return

    print(f"\n{'='*50}")
    print(f"📊 回填 {target_date} 数据")
    print(f"{'='*50}")

    # 获取指数数据（yfinance 历史数据包含这些日期的行情）
    print("  → 获取纳斯达克数据...")
    nasdaq = fetch_index_data("^IXIC", "NASDAQ Composite")
    time.sleep(1)

    print("  → 获取标普500数据...")
    sp500 = fetch_index_data("^GSPC", "S&P 500")
    time.sleep(1)

    if nasdaq.get("price", 0) == 0 and sp500.get("price", 0) == 0:
        print(f"  ❌ {target_date} 核心数据获取失败，跳过")
        return

    # 从历史数据中找到目标日期的收盘价
    # 尝试覆盖 price 等字段为目标日期的实际值
    for idx_data in [nasdaq, sp500]:
        history = idx_data.get("priceHistory", [])
        for h in history:
            if h["date"] == target_date:
                idx_data["price"] = h["close"]
                idx_data["tradingDate"] = target_date
                # priceHistory 可能只有 close/volume，用 close 填充
                idx_data["open"] = h.get("open", h["close"])
                idx_data["high"] = h.get("high", h["close"])
                idx_data["low"] = h.get("low", h["close"])
                idx_data["volume"] = h.get("volume", 0)
                break

    print("  → 获取宏观指标...")
    indicators = fetch_market_indicators()

    print("  → 获取板块表现...")
    sectors = fetch_sector_performance()

    print("  → 获取恐惧贪婪指数...")
    fear_greed = fetch_fear_greed()

    print("  → 获取估值数据...")
    valuation = fetch_valuation_data()

    # 新闻无法回溯，使用空列表
    news = []

    # 计算情绪
    sentiment_score, sentiment = calculate_sentiment(nasdaq, sp500, indicators, news)

    forecast_date = _next_trading_date(d)

    data = {
        "date": target_date,
        "dataDate": target_date,
        "forecastDate": forecast_date,
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
        "valuation": valuation,
        "advanceDeclineRatio": None,
        "putCallRatio": None,
    }

    data = _clean_nan(data)

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ 已保存 {output_path.name}")

    # 更新索引
    index_path = str(DATA_DIR / "index.json")
    update_index(index_path, data)


def main():
    if len(sys.argv) < 2:
        print("用法: python3 scripts/backfill.py <date1> [date2] ...")
        print("示例: python3 scripts/backfill.py 2026-03-27 2026-04-06")
        sys.exit(1)

    dates = sys.argv[1:]
    for date_str in dates:
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            print(f"❌ 无效日期格式: {date_str}，需要 YYYY-MM-DD")
            continue
        backfill_date(date_str)
        time.sleep(2)

    print(f"\n✅ 回填完成")


if __name__ == "__main__":
    main()
