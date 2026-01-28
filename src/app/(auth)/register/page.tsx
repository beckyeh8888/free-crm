'use client';

/**
 * Register Page - WCAG 2.2 AAA Compliant
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
    // Client-side validation
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    void performRegister();
  };

  if (success) {
    return (
      <main
        id="main-content"
        role="main"
        className="min-h-screen flex items-center justify-center px-4 py-12 bg-background"
      >
        <div className="w-full max-w-md text-center">
          <div
            role="status"
            aria-live="polite"
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8"
          >
            <h1 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
              註冊成功！
            </h1>
            <p className="text-green-600 dark:text-green-500">
              正在導向登入頁面...
            </p>
          </div>
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
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              建立帳號
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              開始使用 Free CRM
            </p>
          </header>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-red-700 dark:text-red-400 text-sm">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Name Field */}
            <div className="mb-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg
                         bg-white dark:bg-gray-800 text-foreground
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-colors"
                placeholder="您的姓名"
              />
            </div>

            {/* Email Field */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg
                         bg-white dark:bg-gray-800 text-foreground
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Field */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg
                         bg-white dark:bg-gray-800 text-foreground
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-colors"
                placeholder="••••••••"
              />
              <p
                id="password-hint"
                className="mt-2 text-xs text-gray-500 dark:text-gray-400"
              >
                至少 8 字元，包含大小寫字母、數字及特殊字元
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground mb-2"
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg
                         bg-white dark:bg-gray-800 text-foreground
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700
                       disabled:bg-blue-400 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       transition-colors"
            >
              {isLoading ? '註冊中...' : '建立帳號'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            已有帳號？{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400
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
