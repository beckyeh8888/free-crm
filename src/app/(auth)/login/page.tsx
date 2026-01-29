'use client';

/**
 * Login Page - Calm CRM Dark Theme
 * WCAG 2.2 AAA Compliant
 */

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    error === 'CredentialsSignin' ? '電子郵件或密碼錯誤' : null
  );

  const performLogin = async () => {
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setFormError('電子郵件或密碼錯誤');
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setFormError('登入失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-tertiary border border-border rounded-xl shadow-xl p-8">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          登入 Free CRM
        </h1>
        <p className="mt-2 text-text-secondary">
          請輸入您的帳號資訊
        </p>
      </header>

      {/* Error Alert */}
      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg"
        >
          <p className="text-error text-sm">
            {formError}
          </p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void performLogin();
        }}
        noValidate
      >
        {/* Email Field */}
        <div className="mb-6">
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
            aria-describedby={formError ? 'form-error' : undefined}
            className="form-input"
            placeholder="your@email.com"
          />
        </div>

        {/* Password Field */}
        <div className="mb-6">
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
            autoComplete="current-password"
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
          {isLoading ? '登入中...' : '登入'}
        </button>
      </form>

      {/* Register Link */}
      <p className="mt-6 text-center text-sm text-text-secondary">
        還沒有帳號？{' '}
        <Link
          href="/register"
          className="text-accent-600 hover:text-accent-500
                   font-medium underline underline-offset-2"
        >
          立即註冊
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-background"
    >
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="bg-background-tertiary border border-border rounded-xl shadow-xl p-8 animate-pulse">
              <div className="h-8 bg-background-hover rounded w-48 mx-auto mb-8" />
              <div className="space-y-6">
                <div className="h-12 bg-background-hover rounded" />
                <div className="h-12 bg-background-hover rounded" />
                <div className="h-12 bg-accent-600/50 rounded" />
              </div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
