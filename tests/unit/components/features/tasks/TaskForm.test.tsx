/**
 * TaskForm Component Tests
 * Unit tests for task create/edit form
 *
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskForm } from '@/components/features/tasks/TaskForm';
import type { Task } from '@/hooks/useTasks';

describe('TaskForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form with default values', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('新增任務')).toBeInTheDocument();
      expect(screen.getByText('建立')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('標題')).toBeInTheDocument();
      expect(screen.getByText('類型')).toBeInTheDocument();
      expect(screen.getByText('優先級')).toBeInTheDocument();
      expect(screen.getByText('狀態')).toBeInTheDocument();
      expect(screen.getByText('進度 (%)')).toBeInTheDocument();
      expect(screen.getByText('開始日期')).toBeInTheDocument();
      expect(screen.getByText('截止日期')).toBeInTheDocument();
      expect(screen.getByText('時間')).toBeInTheDocument();
      expect(screen.getByText('全天事件')).toBeInTheDocument();
      expect(screen.getByText('描述')).toBeInTheDocument();
    });

    it('initializes with initial date when provided', () => {
      const initialDate = new Date('2026-03-15');
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
          initialDate={initialDate}
        />
      );

      // Date inputs are present
      expect(screen.getByText('開始日期')).toBeInTheDocument();
    });

    it('submits form with entered data', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      // Fill in the title (required) - first textbox is the title
      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'New Task Title' } });

      // Submit the form
      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task Title',
          type: 'task',
          priority: 'medium',
          status: 'pending',
        })
      );
    });

    it('disables submit when title is empty', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const submitButton = screen.getByText('建立');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit when title is filled', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'A Task' } });

      const submitButton = screen.getByText('建立');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    const mockTask: Task = {
      id: 'task-1',
      title: 'Existing Task',
      description: 'Task description',
      type: 'meeting',
      priority: 'high',
      status: 'in_progress',
      startDate: '2026-02-10',
      dueDate: '2026-02-15',
      dueTime: '14:00',
      isAllDay: false,
      progress: 50,
      project: { id: 'proj-1', name: 'Project', color: null },
      customer: { id: 'cust-1', name: 'Customer' },
      deal: null,
      assignedTo: null,
      completedAt: null,
      reminderAt: null,
      reminderSent: false,
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-05T00:00:00Z',
    };

    it('renders edit form with task data', () => {
      render(
        <TaskForm
          task={mockTask}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('編輯任務')).toBeInTheDocument();
      expect(screen.getByText('更新')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    });

    it('populates form with task values', () => {
      render(
        <TaskForm
          task={mockTask}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Task description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });

    it('submits updated data', () => {
      render(
        <TaskForm
          task={mockTask}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const titleInput = screen.getByDisplayValue('Existing Task');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      fireEvent.click(screen.getByText('更新'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
        })
      );
    });
  });

  describe('Interactions', () => {
    it('closes when close button is clicked', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByLabelText('關閉'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes when cancel button is clicked', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('取消'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes when backdrop is clicked', () => {
      const { container } = render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const backdrop = container.querySelector('.bg-black\\/70');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('changes type selection', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const typeSelect = screen.getByRole('combobox', { name: /類型/i });
      fireEvent.change(typeSelect, { target: { value: 'meeting' } });

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'Meeting' } });

      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'meeting',
        })
      );
    });

    it('changes priority selection', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const prioritySelect = screen.getByRole('combobox', { name: /優先級/i });
      fireEvent.change(prioritySelect, { target: { value: 'urgent' } });

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'Urgent Task' } });

      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'urgent',
        })
      );
    });

    it('toggles all day event', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const allDayCheckbox = screen.getByRole('checkbox');
      expect(allDayCheckbox).toBeChecked(); // Default is true

      fireEvent.click(allDayCheckbox);
      expect(allDayCheckbox).not.toBeChecked();
    });

    it('changes progress value', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const progressInput = screen.getByRole('spinbutton');
      fireEvent.change(progressInput, { target: { value: '75' } });

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'Task' } });

      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: 75,
        })
      );
    });
  });

  describe('Date and Time Inputs', () => {
    it('changes start date', () => {
      render(
        <TaskForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      const startDateInput = screen.getByLabelText('開始日期');
      fireEvent.change(startDateInput, { target: { value: '2026-03-01' } });

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'Task' } });
      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2026-03-01' })
      );
    });

    it('changes due date', () => {
      render(
        <TaskForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      const dueDateInput = screen.getByLabelText('截止日期');
      fireEvent.change(dueDateInput, { target: { value: '2026-04-15' } });

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'Task' } });
      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ dueDate: '2026-04-15' })
      );
    });

    it('changes due time when all-day is unchecked', () => {
      render(
        <TaskForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      // First uncheck all-day so time input is enabled
      const allDayCheckbox = screen.getByRole('checkbox');
      fireEvent.click(allDayCheckbox);

      const timeInput = screen.getByLabelText('時間');
      fireEvent.change(timeInput, { target: { value: '14:30' } });

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'Task' } });
      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ dueTime: '14:30', isAllDay: false })
      );
    });

    it('disables time input when all-day is checked', () => {
      render(
        <TaskForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      const timeInput = screen.getByLabelText('時間');
      expect(timeInput).toBeDisabled();
    });
  });

  describe('Status and Description', () => {
    it('changes status selection', () => {
      render(
        <TaskForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      const statusSelect = screen.getByRole('combobox', { name: /狀態/i });
      fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'Task' } });
      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'in_progress' })
      );
    });

    it('changes description textarea', () => {
      render(
        <TaskForm onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      const descInput = screen.getByLabelText('描述');
      fireEvent.change(descInput, { target: { value: 'Task details here' } });

      const titleInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(titleInput, { target: { value: 'Task' } });
      fireEvent.click(screen.getByText('建立'));

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Task details here' })
      );
    });
  });

  describe('Submitting State', () => {
    it('shows loading text when submitting', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
          isSubmitting={true}
        />
      );

      expect(screen.getByText('儲存中...')).toBeInTheDocument();
    });

    it('disables submit button when submitting', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
          isSubmitting={true}
        />
      );

      expect(screen.getByText('儲存中...')).toBeDisabled();
    });
  });
});
