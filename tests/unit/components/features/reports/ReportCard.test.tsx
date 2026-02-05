/**
 * ReportCard Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { ReportCard } from '@/components/features/reports/ReportCard';

describe('ReportCard Component', () => {
  it('renders title', () => {
    render(<ReportCard title="Test Title"><p>Content</p></ReportCard>);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<ReportCard title="Title"><p>Child Content</p></ReportCard>);

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders as a section element', () => {
    render(<ReportCard title="Section"><p>Body</p></ReportCard>);

    const section = screen.getByText('Section').closest('section');
    expect(section).toBeInTheDocument();
  });

  it('renders title as h3', () => {
    render(<ReportCard title="Heading"><p>Body</p></ReportCard>);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Heading');
  });

  it('applies custom className', () => {
    render(<ReportCard title="Title" className="custom-cls"><p>Body</p></ReportCard>);

    const section = screen.getByText('Title').closest('section');
    expect(section?.className).toContain('custom-cls');
  });

  it('applies default styling', () => {
    render(<ReportCard title="Title"><p>Body</p></ReportCard>);

    const section = screen.getByText('Title').closest('section');
    expect(section?.className).toContain('rounded-xl');
    expect(section?.className).toContain('p-5');
  });
});
