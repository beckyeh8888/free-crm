/**
 * StatCard Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/features/dashboard/StatCard';
import { Users } from 'lucide-react';

describe('StatCard Component', () => {
  describe('Rendering', () => {
    it('renders label and string value', () => {
      render(<StatCard label="客戶數" value="128" icon={Users} />);

      expect(screen.getByText('客戶數')).toBeInTheDocument();
      expect(screen.getByText('128')).toBeInTheDocument();
    });

    it('renders numeric value', () => {
      render(<StatCard label="商機數" value={42} icon={Users} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders as article element', () => {
      render(<StatCard label="測試" value="0" icon={Users} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('renders icon container with aria-hidden', () => {
      const { container } = render(<StatCard label="測試" value="0" icon={Users} />);

      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Trend', () => {
    it('shows trend when provided', () => {
      render(<StatCard label="收入" value="NT$2,340,000" icon={Users} trend="較上月 +12%" />);

      expect(screen.getByText('較上月 +12%')).toBeInTheDocument();
    });

    it('does not show trend when not provided', () => {
      render(<StatCard label="收入" value="NT$2,340,000" icon={Users} />);

      expect(screen.queryByText(/較上月/)).not.toBeInTheDocument();
    });
  });
});
