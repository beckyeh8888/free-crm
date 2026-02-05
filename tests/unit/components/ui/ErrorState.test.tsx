/**
 * ErrorState Component Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorState } from '@/components/ui/ErrorState/ErrorState';

describe('ErrorState', () => {
  describe('Default (generic) Error', () => {
    it('renders default title', () => {
      render(<ErrorState />);

      expect(screen.getByText('發生錯誤')).toBeInTheDocument();
    });

    it('renders default description', () => {
      render(<ErrorState />);

      expect(screen.getByText('處理您的請求時發生問題，請稍後再試。')).toBeInTheDocument();
    });

    it('has alert role', () => {
      render(<ErrorState />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live assertive', () => {
      const { container } = render(<ErrorState />);

      expect(container.querySelector('[aria-live="assertive"]')).toBeInTheDocument();
    });
  });

  describe('Error Types', () => {
    it('shows network error content', () => {
      render(<ErrorState type="network" />);

      expect(screen.getByText('網路連線錯誤')).toBeInTheDocument();
      expect(screen.getByText('無法連線到伺服器，請檢查網路連線後再試。')).toBeInTheDocument();
    });

    it('shows notFound error content', () => {
      render(<ErrorState type="notFound" />);

      expect(screen.getByText('找不到資源')).toBeInTheDocument();
      expect(screen.getByText('您要尋找的頁面或資源不存在。')).toBeInTheDocument();
    });

    it('shows unauthorized error content', () => {
      render(<ErrorState type="unauthorized" />);

      expect(screen.getByText('存取被拒絕')).toBeInTheDocument();
      expect(screen.getByText('您沒有權限存取此資源，請聯繫管理員。')).toBeInTheDocument();
    });

    it('shows server error content', () => {
      render(<ErrorState type="server" />);

      expect(screen.getByText('伺服器錯誤')).toBeInTheDocument();
      expect(screen.getByText('伺服器發生內部錯誤，我們正在處理中。')).toBeInTheDocument();
    });
  });

  describe('Custom Content', () => {
    it('renders custom title', () => {
      render(<ErrorState title="自訂標題" />);

      expect(screen.getByText('自訂標題')).toBeInTheDocument();
    });

    it('renders custom description', () => {
      render(<ErrorState description="自訂描述" />);

      expect(screen.getByText('自訂描述')).toBeInTheDocument();
    });

    it('renders custom icon', () => {
      render(<ErrorState icon={<span data-testid="custom-icon">!</span>} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('renders retry button when onRetry is provided', () => {
      render(<ErrorState onRetry={vi.fn()} />);

      expect(screen.getByRole('button', { name: '重試' })).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorState />);

      expect(screen.queryByRole('button', { name: '重試' })).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorState onRetry={onRetry} />);

      fireEvent.click(screen.getByRole('button', { name: '重試' }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('renders custom retry text', () => {
      render(<ErrorState onRetry={vi.fn()} retryText="再試一次" />);

      expect(screen.getByRole('button', { name: '再試一次' })).toBeInTheDocument();
    });

    it('has type button on retry button', () => {
      render(<ErrorState onRetry={vi.fn()} />);

      expect(screen.getByRole('button', { name: '重試' })).toHaveAttribute('type', 'button');
    });
  });

  describe('Action', () => {
    it('renders custom action', () => {
      render(
        <ErrorState action={<button type="button">回首頁</button>} />
      );

      expect(screen.getByRole('button', { name: '回首頁' })).toBeInTheDocument();
    });
  });
});
