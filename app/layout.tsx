import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/components/I18nProvider';

const siteUrl = 'https://investing.lz5z.com';

export const metadata: Metadata = {
  title: {
    default: '投资晴雨表 | 美股纳指标普每日定投参考',
    template: '%s | 投资晴雨表',
  },
  description: '每日追踪纳斯达克和标普500指数走势、PE估值、历史分位、市场回撤，提供专业的定投参考数据。数据每日自动更新。',
  keywords: ['投资晴雨表', '纳斯达克', '标普500', 'NASDAQ', 'S&P 500', '定投', 'PE估值', '美股', '市场分析', 'VIX', '恐惧贪婪指数', 'QQQ', 'SPY'],
  authors: [{ name: 'tickli' }],
  creator: 'tickli',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: siteUrl,
    siteName: '投资晴雨表',
    title: '投资晴雨表 | 美股纳指标普每日定投参考',
    description: '每日追踪纳斯达克和标普500指数走势、PE估值、历史分位、市场回撤，提供专业的定投参考数据。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '投资晴雨表 | 美股纳指标普每日定投参考',
    description: '每日追踪纳斯达克和标普500指数走势、PE估值、历史分位、市场回撤。',
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
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '投资晴雨表',
              url: siteUrl,
              description: '每日追踪纳斯达克和标普500指数走势、PE估值、历史分位、市场回撤，提供专业的定投参考数据。',
              author: { '@type': 'Person', name: 'tickli' },
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
      </body>
    </html>
  );
}
