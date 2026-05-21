import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/components/I18nProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const siteUrl = 'https://investing.lz5z.com';

export const metadata: Metadata = {
  title: {
    default: '投资晴雨表 | 美股纳指标普每日行情分析与定投参考',
    template: '%s | 投资晴雨表',
  },
  description: '免费美股每日数据分析工具。追踪纳斯达克、标普500指数实时走势、PE估值、RSI技术指标、MACD、布林带、VIX恐惧贪婪指数、行业板块热力图。提供历史分位数、市场回撤深度等专业定投参考数据，每日自动更新。',
  keywords: [
    // 核心品牌词
    '投资晴雨表', 'investing barometer',
    // 指数相关
    '纳斯达克', '纳指', 'NASDAQ', '标普500', 'S&P 500', '美股指数', '美股行情',
    // 投资策略
    '定投', '定投参考', '美股定投', '基金定投', '指数基金', 'ETF定投',
    // 估值指标
    'PE估值', '市盈率', '历史分位', '估值分位数', 'QQQ', 'SPY',
    // 技术分析
    '技术指标', 'RSI', 'MACD', '布林带', '均线', 'SMA', '技术分析',
    // 市场情绪
    'VIX', '恐惧贪婪指数', 'Fear Greed Index', '市场情绪', '波动率',
    // 宏观数据
    '美债收益率', '黄金', '原油', '比特币', '美元指数',
    // 场景词（用户搜索意图）
    '今天美股', '美股数据', '纳斯达克今日行情', '标普500走势',
    '美股分析工具', '美股技术分析', '市场分析', '股市晴雨表',
  ],
  authors: [{ name: 'tickli' }],
  creator: 'tickli',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: siteUrl,
    siteName: '投资晴雨表',
    title: '投资晴雨表 | 美股纳指标普每日行情分析与定投参考',
    description: '免费美股每日分析工具：纳斯达克/标普500走势、PE估值分位、VIX恐惧贪婪、技术指标、行业板块。数据每日自动更新。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '投资晴雨表 | 美股纳指标普每日行情分析与定投参考',
    description: '免费美股每日分析：纳指标普走势、PE估值、VIX恐惧贪婪、RSI/MACD技术指标。每日自动更新。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`dark ${inter.className}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: '投资晴雨表',
              alternateName: ['Investing Barometer', '美股晴雨表', '股市晴雨表'],
              url: siteUrl,
              description: '免费美股每日数据分析工具。追踪纳斯达克、标普500指数走势、PE估值、技术指标、VIX恐惧贪婪指数，提供专业定投参考。',
              author: { '@type': 'Person', name: 'tickli' },
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
              keywords: '美股,纳斯达克,标普500,定投,PE估值,VIX,技术分析,MACD,RSI',
            }),
          }}
        />
        {/* 避免闪烁：在页面加载时立即应用存储的主题 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else if (!theme && window.matchMedia('(prefers-color-scheme: light)').matches) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider><I18nProvider>{children}</I18nProvider></ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
