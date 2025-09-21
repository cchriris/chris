import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="card" style={{ maxWidth: '720px', margin: '6rem auto 0', textAlign: 'center' }}>
      <h1 className="card-title">页面未找到</h1>
      <p className="card-excerpt">也许它已经被移动，或许这是一个新的灵感入口。</p>
      <div className="hero-actions" style={{ justifyContent: 'center' }}>
        <Link href="/">回到首页</Link>
        <Link href="/admin">打开后台</Link>
      </div>
    </section>
  );
}
