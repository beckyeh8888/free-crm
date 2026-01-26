/**
 * Dashboard Page - WCAG 2.2 AAA Compliant
 * Protected route - requires authentication
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Fetch dashboard statistics
  const [customerCount, dealCount, documentCount] = await Promise.all([
    prisma.customer.count({
      where: { userId: session.user.id },
    }),
    prisma.deal.count({
      where: {
        customer: { userId: session.user.id },
      },
    }),
    prisma.document.count({
      where: { userId: session.user.id },
    }),
  ]);

  // Fetch recent customers
  const recentCustomers = await prisma.customer.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      company: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a href="#main-content" className="skip-link">
        跳至主要內容
      </a>

      {/* Header */}
      <header role="banner" className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Free CRM</h1>
            <nav role="navigation" aria-label="主選單">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {session.user.name || session.user.email}
                </span>
                <Link
                  href="/api/auth/signout"
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  登出
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <section aria-labelledby="welcome-heading" className="mb-8">
          <h2 id="welcome-heading" className="text-2xl font-bold text-foreground">
            歡迎回來，{session.user.name || '使用者'}
          </h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            這是您的 CRM 儀表板概覽
          </p>
        </section>

        {/* Statistics Cards */}
        <section aria-labelledby="stats-heading" className="mb-8">
          <h3 id="stats-heading" className="sr-only">
            統計數據
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Customers Card */}
            <article className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    客戶數量
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {customerCount}
                  </p>
                </div>
                <div
                  className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </article>

            {/* Deals Card */}
            <article className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    商機數量
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {dealCount}
                  </p>
                </div>
                <div
                  className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="text-2xl">💼</span>
                </div>
              </div>
            </article>

            {/* Documents Card */}
            <article className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    文件數量
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {documentCount}
                  </p>
                </div>
                <div
                  className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="text-2xl">📄</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Recent Customers */}
        <section aria-labelledby="recent-customers-heading">
          <h3
            id="recent-customers-heading"
            className="text-lg font-semibold text-foreground mb-4"
          >
            最近新增的客戶
          </h3>
          {recentCustomers.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      名稱
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      公司
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      狀態
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      建立日期
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {customer.company || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : customer.status === 'lead'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {customer.status === 'active'
                            ? '活躍'
                            : customer.status === 'lead'
                              ? '潛在'
                              : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(customer.createdAt).toLocaleDateString('zh-TW')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                尚無客戶資料，開始新增您的第一位客戶吧！
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="mt-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Free CRM - ISO 27001 Compliant
          </p>
        </div>
      </footer>
    </div>
  );
}
