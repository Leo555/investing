<div align="center">

# 📊 投资晴雨表

**美股纳斯达克 & 标普500 每日市场分析仪表盘**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Leo555/investing)
[![GitHub Actions](https://github.com/Leo555/investing/actions/workflows/daily-fetch.yml/badge.svg)](https://github.com/Leo555/investing/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🔗 **在线访问**: [investing.lz5z.com](https://investing.lz5z.com)

</div>

---

每天自动抓取美股数据，生成包含技术指标、估值分析、市场情绪的综合仪表盘。无需任何后端服务，纯静态部署，GitHub Actions 定时驱动。

## ✨ 功能亮点

| 模块 | 说明 |
|------|------|
| 📈 **指数概览** | 纳指/标普实时价格、涨跌幅、52周高低、P/E、30日走势图 |
| 💰 **定投参考** | PE 估值、前瞻PE、1/5/10年历史分位数、市场回撤深度 |
| 🌍 **宏观指标** | VIX、美元、美债收益率、黄金、原油、BTC、ETH（含走势图） |
| 📐 **技术分析** | RSI、MACD、布林带、SMA20/50/200 均线系统 |
| 😱 **恐惧贪婪指数** | CNN Fear & Greed 指数 + Put/Call Ratio |
| 🏭 **板块表现** | 11大行业板块涨跌热力图 |
| 📰 **财经新闻** | 每日影响市场的关键新闻聚合（含情绪标注） |
| 🌓 **暗色/亮色主题** | 自动适配系统偏好，支持手动切换 |
| 🌐 **中英双语** | 完整的国际化支持 |

## 🏗️ 技术架构

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  GitHub      │     │  Python       │     │  Next.js 14  │
│  Actions     │────▶│  yfinance     │────▶│  Static      │────▶ Vercel
│  (定时触发)   │     │  feedparser   │     │  Export      │
└──────────────┘     └───────────────┘     └──────────────┘
   每日 10:00           抓取 & 分析           生成纯静态页面
   (北京时间)            生成 JSON            零服务器成本
```

- **前端**: Next.js 14 (Static Export) + Tailwind CSS + CSS Variables 主题系统
- **数据**: Python + yfinance（Yahoo Finance API）+ feedparser（RSS 新闻）
- **部署**: Vercel（免费额度即可）
- **自动化**: GitHub Actions Cron（每日自动更新 + 企业微信推送通知）
- **依赖极简**: 运行时仅 `next` + `react` + `@vercel/analytics`，无图表库

## 🚀 快速开始

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Leo555/investing)

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Leo555/investing.git
cd investing

# 安装前端依赖
npm install

# 安装 Python 依赖
pip install -r requirements.txt

# 抓取最新数据
python3 scripts/fetch_data.py

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可预览。

### 配置自动化

1. Fork 本仓库到你的 GitHub
2. 在 **Settings → Secrets → Actions** 中添加（可选）：
   - `WECOM_WEBHOOK_URL` — 企业微信机器人 Webhook，用于每日推送通知
3. GitHub Actions 会在每天北京时间 10:00 自动运行

## 📁 项目结构

```
investing/
├── app/                        # Next.js App Router 页面
│   ├── layout.tsx              # 根布局（SEO、主题、字体）
│   ├── page.tsx                # 首页（历史列表）
│   ├── HomeClient.tsx          # 首页客户端组件
│   └── barometer/[date]/       # 晴雨表详情页（SSG）
│       ├── page.tsx            # 服务端页面
│       └── BarometerClient.tsx # 客户端交互组件
├── components/                 # 通用组件
│   ├── Charts.tsx              # 图表组件（纯 SVG，零依赖）
│   ├── Header.tsx              # 页头导航
│   ├── ThemeProvider.tsx       # 暗色/亮色主题
│   └── I18nProvider.tsx        # 国际化
├── lib/                        # 工具库
│   ├── data.ts                 # 数据加载（构建时）
│   ├── types.ts                # TypeScript 类型定义
│   └── i18n/                   # 中英文翻译
├── scripts/
│   └── fetch_data.py           # Python 数据抓取（900+ 行）
├── data/                       # 每日 JSON 数据文件
└── .github/workflows/
    └── daily-fetch.yml         # GitHub Actions 自动化
```

## 📊 数据来源

| 数据 | 来源 |
|------|------|
| 指数行情、技术指标 | Yahoo Finance (yfinance) |
| 宏观指标（VIX、美元、债券等） | Yahoo Finance |
| PE 估值 / 前瞻PE | SPY、QQQ ETF |
| 行业板块 | SPDR Sector ETFs |
| 财经新闻 | CNBC、MarketWatch、Reuters (RSS) |

## 🤝 贡献

欢迎提交 Issue 和 PR！

- 🐛 发现 Bug → [提交 Issue](https://github.com/Leo555/investing/issues)
- 💡 功能建议 → [提交 Issue](https://github.com/Leo555/investing/issues)
- 🔧 代码贡献 → Fork → 修改 → 提交 PR

## 📄 License

[MIT](LICENSE) © [tickli](https://github.com/Leo555)

---

<div align="center">

**如果觉得有用，请给个 ⭐ Star 支持一下！**

</div>
