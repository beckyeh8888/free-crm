'use client';

/**
 * Register Page - Calm CRM Dark Theme
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const performRegister = async () => {
    if (password !== confirmPassword) {
      setError('密碼不一致');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '註冊失敗');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('註冊失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main
        id="main-content"
        role="main"
        className="min-h-screen flex items-center justify-center px-4 py-12 bg-background"
      >
        <div className="w-full max-w-md text-center">
          <output
            aria-live="polite"
            className="block bg-success/10 border border-success/30 rounded-xl p-8"
          >
            <h1 className="text-xl font-bold text-success mb-2">
              註冊成功！
            </h1>
            <p className="text-success/80">
              正在導向登入頁面...
            </p>
          </output>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-background"
    >
      <div className="w-full max-w-md">
        <div className="bg-background-tertiary border border-border rounded-xl shadow-xl p-8">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">
              建立帳號
            </h1>
            <p className="mt-2 text-text-secondary">
              開始使用 Free CRM
            </p>
          </header>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg"
            >
              <p className="text-error text-sm">
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              void performRegister();
            }}
            noValidate
          >
            {/* Name Field */}
            <div className="mb-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                姓名
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                aria-required="true"
                className="form-input"
                placeholder="您的姓名"
              />
            </div>

            {/* Email Field */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                電子郵件
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-required="true"
                className="form-input"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Field */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                密碼
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                aria-required="true"
                aria-describedby="password-hint"
                className="form-input"
                placeholder="••••••••"
              />
              <p
                id="password-hint"
                className="mt-2 text-xs text-text-muted"
              >
                至少 8 字元，包含大小寫字母、數字及特殊字元
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                確認密碼
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                aria-required="true"
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full py-3 px-4 bg-accent-600 hover:bg-accent-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg
                       transition-colors min-h-[44px]"
            >
              {isLoading ? '註冊中...' : '建立帳號'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            已有帳號？{' '}
            <Link
              href="/login"
              className="text-accent-600 hover:text-accent-500
                       font-medium underline underline-offset-2"
            >
              立即登入
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
