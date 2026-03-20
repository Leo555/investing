# 投资晴雨表 | NASDAQ & S&P 500

每日纳斯达克和标普500指数的投资晴雨表，从专业交易员视角分析市场。

## 特性

- 📊 每日自动抓取纳指和标普500数据
- 📈 专业技术指标（RSI、MACD、布林带、均线等）
- 🌡️ 综合市场情绪评分
- 📰 实时财经新闻聚合
- 🏭 行业板块表现
- 🔄 通过 GitHub Actions 每日自动更新

## 技术栈

- **前端**: Next.js 14 (Static Export) + TailwindCSS + Recharts
- **数据获取**: Python + yfinance + feedparser
- **部署**: Vercel (Static)
- **自动化**: GitHub Actions

## 本地开发

```bash
# 安装前端依赖
npm install

# 安装 Python 依赖
pip install -r requirements.txt

# 抓取数据
python3 scripts/fetch_data.py

# 启动开发服务器
npm run dev
```

## 部署到 Vercel

1. 将仓库推送到 GitHub
2. 在 Vercel 中导入该 GitHub 仓库
3. 构建设置:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `out`
4. GitHub Actions 会每天自动更新数据并触发重新部署

## 项目结构

```
investing/
├── app/                    # Next.js 页面
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 门户首页
│   └── barometer/[date]/   # 晴雨表详情页
├── components/             # React 组件
├── lib/                    # 工具函数和类型
├── data/                   # 每日数据 (JSON)
├── scripts/                # Python 数据抓取脚本
└── .github/workflows/      # GitHub Actions
```
