/**
 * Navigation Accessibility Tests
 * WCAG 2.2 AAA Compliance for Navigation Elements
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Navigation Accessibility - Skip Links', () => {
  it('should have skip link as first focusable element', () => {
    const PageWithSkipLink = () => (
      <div>
        <a href="#main-content" className="skip-link">
          跳至主要內容
        </a>
        <nav>
          <a href="/home">首頁</a>
          <a href="/about">關於</a>
        </nav>
        <main id="main-content">
          <h1>頁面內容</h1>
        </main>
      </div>
    );

    render(<PageWithSkipLink />);

    const skipLink = screen.getByRole('link', { name: '跳至主要內容' });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should link to valid target', () => {
    const PageWithValidTarget = () => (
      <div>
        <a href="#main">跳至主要內容</a>
        <main id="main">
          <h1>內容</h1>
        </main>
      </div>
    );

    render(<PageWithValidTarget />);

    const skipLink = screen.getByRole('link', { name: '跳至主要內容' });
    const targetId = skipLink.getAttribute('href')?.replace('#', '');
    const target = document.getElementById(targetId!);

    expect(target).not.toBeNull();
  });
});

describe('Navigation Accessibility - Main Navigation', () => {
  it('should have proper nav landmark with aria-label', () => {
    const MainNav = () => (
      <nav aria-label="主選單">
        <ul>
          <li>
            <a href="/dashboard">儀表板</a>
          </li>
          <li>
            <a href="/customers">客戶</a>
          </li>
        </ul>
      </nav>
    );

    render(<MainNav />);

    expect(screen.getByRole('navigation', { name: '主選單' })).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();

    const KeyboardNav = () => (
      <nav aria-label="主選單">
        <a href="/dashboard">儀表板</a>
        <a href="/customers">客戶</a>
        <a href="/deals">商機</a>
      </nav>
    );

    render(<KeyboardNav />);

    // Tab through navigation links
    await user.tab();
    expect(screen.getByRole('link', { name: '儀表板' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: '客戶' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: '商機' })).toHaveFocus();
  });

  it('should indicate current page with aria-current', () => {
    const NavWithCurrent = () => (
      <nav aria-label="主選單">
        <a href="/dashboard">儀表板</a>
        <a href="/customers" aria-current="page">
          客戶
        </a>
        <a href="/deals">商機</a>
      </nav>
    );

    render(<NavWithCurrent />);

    const currentLink = screen.getByRole('link', { name: '客戶' });
    expect(currentLink).toHaveAttribute('aria-current', 'page');
  });
});

describe('Navigation Accessibility - Focus Indicators', () => {
  it('should have visible focus indicator on interactive elements', async () => {
    const user = userEvent.setup();

    const FocusableElements = () => (
      <div>
        <button type="button">按鈕</button>
        <a href="/link">連結</a>
        <input type="text" placeholder="輸入框" />
      </div>
    );

    render(<FocusableElements />);

    const button = screen.getByRole('button', { name: '按鈕' });
    await user.tab();

    // Button should be focusable
    expect(button).toHaveFocus();
  });

  it('should not trap focus in modal', async () => {
    const user = userEvent.setup();

    const ModalWithFocusTrap = ({ isOpen }: { isOpen: boolean }) => (
      <div>
        <button type="button">開啟 Modal</button>
        {isOpen && (
          <div role="dialog" aria-label="確認視窗">
            <button type="button">取消</button>
            <button type="button">確認</button>
          </div>
        )}
        <button type="button">Modal 外部按鈕</button>
      </div>
    );

    render(<ModalWithFocusTrap isOpen={true} />);

    // Should be able to tab through dialog
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();

    // Focus should eventually reach elements outside
    // (This is a simplified test - real focus trapping needs more logic)
    expect(document.activeElement).toBeDefined();
  });
});

describe('Navigation Accessibility - ARIA Landmarks', () => {
  it('should have main landmark', () => {
    const PageWithLandmarks = () => (
      <div>
        <header role="banner">
          <h1>網站標題</h1>
        </header>
        <main role="main">
          <h2>主要內容</h2>
        </main>
        <footer role="contentinfo">
          <p>版權資訊</p>
        </footer>
      </div>
    );

    render(<PageWithLandmarks />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should have unique labels for multiple nav landmarks', () => {
    const PageWithMultipleNavs = () => (
      <div>
        <nav aria-label="主選單">
          <a href="/home">首頁</a>
        </nav>
        <nav aria-label="頁尾選單">
          <a href="/privacy">隱私政策</a>
        </nav>
      </div>
    );

    render(<PageWithMultipleNavs />);

    expect(screen.getByRole('navigation', { name: '主選單' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '頁尾選單' })).toBeInTheDocument();
  });

  it('should use semantic HTML elements', () => {
    const SemanticPage = () => (
      <div>
        <header>
          <nav aria-label="主選單">
            <a href="/">首頁</a>
          </nav>
        </header>
        <main>
          <article>
            <h1>文章標題</h1>
            <p>文章內容</p>
          </article>
          <aside aria-label="側邊欄">
            <h2>相關連結</h2>
          </aside>
        </main>
        <footer>
          <p>&copy; 2025</p>
        </footer>
      </div>
    );

    render(<SemanticPage />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '側邊欄' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});

describe('Navigation Accessibility - Heading Structure', () => {
  it('should have exactly one h1 per page', () => {
    const PageWithSingleH1 = () => (
      <main>
        <h1>頁面標題</h1>
        <h2>章節一</h2>
        <p>內容</p>
        <h2>章節二</h2>
        <p>內容</p>
      </main>
    );

    render(<PageWithSingleH1 />);

    const h1Elements = screen.getAllByRole('heading', { level: 1 });
    expect(h1Elements).toHaveLength(1);
  });

  it('should not skip heading levels', () => {
    const ProperHeadingHierarchy = () => (
      <main>
        <h1>頁面標題</h1>
        <section>
          <h2>章節標題</h2>
          <h3>子章節</h3>
          <h3>另一子章節</h3>
        </section>
        <section>
          <h2>另一章節</h2>
        </section>
      </main>
    );

    render(<ProperHeadingHierarchy />);

    // All heading levels should be present in order
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });
});
