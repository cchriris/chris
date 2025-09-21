import './globals.css';
import Link from 'next/link';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/settings';

export const metadata = {
  title: SITE_NAME,
  description: SITE_TAGLINE,
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <div className="container">
            <div className="branding">
              <Link href="/" className="brand">
                {SITE_NAME}
              </Link>
              <p className="tagline">{SITE_TAGLINE}</p>
            </div>
            <nav className="site-nav">
              <Link href="/">首页</Link>
              <Link href="/admin">创作后台</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>保持记录与创作，让灵感日日更新 ✨</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
