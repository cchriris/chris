import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, getSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage({ searchParams }) {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (session === getSessionToken()) {
    redirect('/admin');
  }
  const showError = Boolean(searchParams?.error);

  return (
    <section className="card" style={{ maxWidth: '540px', margin: '4rem auto 0' }}>
      <h1 className="card-title">创作后台登录</h1>
      <p className="card-excerpt">
        使用在环境变量中配置的账户密码登录，开始管理内容与分类。
      </p>
      {showError ? <p className="alert alert-error">登录失败，请检查用户名或密码。</p> : null}
      <form className="styled-form" action="/api/admin/login" method="post">
        <label>
          用户名
          <input type="text" name="username" required autoComplete="username" />
        </label>
        <label>
          密码
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        <input type="hidden" name="redirect" value="/admin" />
        <button type="submit">登录后台</button>
      </form>
    </section>
  );
}
