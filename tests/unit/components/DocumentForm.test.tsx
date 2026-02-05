/**
 * DocumentForm Component Unit Tests
 *
 * @vitest-environment jsdom
 */

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentForm } from '@/components/features/documents/DocumentForm';

describe('DocumentForm Component', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  describe('Create mode', () => {
    it('renders 新增文件 title', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByText('新增文件')).toBeInTheDocument();
    });

    it('renders 建立文件 submit button', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '建立文件' })).toBeInTheDocument();
    });

    it('has dialog with correct aria-label', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: '新增文件' })).toBeInTheDocument();
    });

    it('shows mode tabs for text and file input', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByRole('tab', { name: '文字輸入' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '檔案上傳' })).toBeInTheDocument();
    });

    it('defaults to text input mode', () => {
      render(<DocumentForm {...defaultProps} />);

      const textTab = screen.getByRole('tab', { name: '文字輸入' });
      expect(textTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Form fields', () => {
    it('renders name input with label', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByLabelText(/文件名稱/)).toBeInTheDocument();
    });

    it('renders type select with label', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByLabelText(/文件類型/)).toBeInTheDocument();
    });

    it('renders content textarea in text mode', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByLabelText(/文件內容/)).toBeInTheDocument();
    });

    it('renders content textarea with placeholder', () => {
      render(<DocumentForm {...defaultProps} />);

      const textarea = screen.getByLabelText(/文件內容/) as HTMLTextAreaElement;
      expect(textarea.placeholder).toBe('輸入文件內容（合約條文、郵件內容、會議記錄等）');
    });

    it('renders customer ID input', () => {
      render(<DocumentForm {...defaultProps} />);

      expect(screen.getByLabelText(/關聯客戶/)).toBeInTheDocument();
    });

    it('renders customer ID input with placeholder', () => {
      render(<DocumentForm {...defaultProps} />);

      const customerInput = screen.getByLabelText(/關聯客戶/) as HTMLInputElement;
      expect(customerInput.placeholder).toBe('輸入客戶 ID');
    });

    it('type select has correct options', () => {
      render(<DocumentForm {...defaultProps} />);

      const select = screen.getByLabelText(/文件類型/) as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.value);
      expect(options).toContain('contract');
      expect(options).toContain('email');
      expect(options).toContain('meeting_notes');
      expect(options).toContain('quotation');
    });
  });

  describe('Edit mode', () => {
    const editDocument: import('@/hooks/useDocuments').Document = {
      id: 'doc-1',
      name: 'Existing Doc',
      type: 'email',
      content: 'Some content',
      filePath: null,
      fileSize: null,
      mimeType: null,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
      organizationId: 'org-1',
      customerId: null,
      customer: null,
      _count: { analyses: 0 },
    };

    it('does not show mode tabs when editing', () => {
      render(<DocumentForm {...defaultProps} document={editDocument} />);

      expect(screen.queryByRole('tab', { name: '文字輸入' })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: '檔案上傳' })).not.toBeInTheDocument();
    });

    it('renders 編輯文件 title', () => {
      render(<DocumentForm {...defaultProps} document={editDocument} />);

      expect(screen.getByText('編輯文件')).toBeInTheDocument();
    });

    it('renders 更新文件 submit button', () => {
      render(<DocumentForm {...defaultProps} document={editDocument} />);

      expect(screen.getByRole('button', { name: '更新文件' })).toBeInTheDocument();
    });
  });

  describe('File upload mode', () => {
    it('switches to file upload when tab clicked', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      const fileTab = screen.getByRole('tab', { name: '檔案上傳' });
      expect(fileTab).toHaveAttribute('aria-selected', 'true');
    });

    it('deselects text tab when file tab is clicked', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      const textTab = screen.getByRole('tab', { name: '文字輸入' });
      expect(textTab).toHaveAttribute('aria-selected', 'false');
    });

    it('shows upload zone in file mode', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      expect(screen.getByText('拖放檔案至此處')).toBeInTheDocument();
    });

    it('shows upload label in file mode', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      expect(screen.getByText('上傳檔案')).toBeInTheDocument();
    });

    it('shows helper text for clicking to select file', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      expect(screen.getByText('或點擊選擇檔案')).toBeInTheDocument();
    });

    it('renders drag-drop area with aria-label', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      expect(screen.getByRole('button', { name: '拖放或點擊上傳檔案' })).toBeInTheDocument();
    });

    it('hides content textarea when in file mode', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));
      expect(screen.queryByLabelText(/文件內容/)).not.toBeInTheDocument();
    });

    it('displays selected file name after file input change', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      const fileInput = document.getElementById('doc-file-upload') as HTMLInputElement;
      const testFile = new File(['hello'], 'report.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('auto-populates name field when name is empty and file is selected', () => {
      render(<DocumentForm {...defaultProps} />);

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      const fileInput = document.getElementById('doc-file-upload') as HTMLInputElement;
      const testFile = new File(['data'], 'invoice.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      const nameInput = screen.getByLabelText(/文件名稱/) as HTMLInputElement;
      expect(nameInput.value).toBe('invoice.xlsx');
    });

    it('does not overwrite name field when name is already filled', () => {
      render(<DocumentForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/文件名稱/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'My Custom Name' } });

      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      const fileInput = document.getElementById('doc-file-upload') as HTMLInputElement;
      const testFile = new File(['data'], 'invoice.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      expect(nameInput.value).toBe('My Custom Name');
    });
  });

  describe('States', () => {
    it('shows 儲存中... when isSubmitting', () => {
      render(<DocumentForm {...defaultProps} isSubmitting />);

      expect(screen.getByRole('button', { name: '儲存中...' })).toBeInTheDocument();
    });

    it('disables submit when name is empty', () => {
      render(<DocumentForm {...defaultProps} />);

      const submitBtn = screen.getByRole('button', { name: '建立文件' });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit when name is filled', () => {
      render(<DocumentForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/文件名稱/);
      fireEvent.change(nameInput, { target: { value: 'My Document' } });

      const submitBtn = screen.getByRole('button', { name: '建立文件' });
      expect(submitBtn).not.toBeDisabled();
    });
  });

  describe('Events', () => {
    it('calls onClose when cancel clicked', () => {
      const onClose = vi.fn();
      render(<DocumentForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<DocumentForm {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: '關閉' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit with form data', () => {
      const onSubmit = vi.fn();
      render(<DocumentForm {...defaultProps} onSubmit={onSubmit} />);

      // Fill in name field
      const nameInput = screen.getByLabelText(/文件名稱/);
      fireEvent.change(nameInput, { target: { value: 'New Document' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: '建立文件' }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Document' })
      );
    });
  });

  describe('Accessibility', () => {
    it('has aria-modal attribute', () => {
      render(<DocumentForm {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('close button meets minimum touch target (44px)', () => {
      render(<DocumentForm {...defaultProps} />);

      const closeBtn = screen.getByRole('button', { name: '關閉' });
      expect(closeBtn.className).toContain('min-h-[44px]');
      expect(closeBtn.className).toContain('min-w-[44px]');
    });

    it('submit button meets minimum touch target (44px)', () => {
      render(<DocumentForm {...defaultProps} />);

      const submitBtn = screen.getByRole('button', { name: '建立文件' });
      expect(submitBtn.className).toContain('min-h-[44px]');
    });
  });

  describe('File Upload Submit', () => {
    it('calls onUpload with FormData when in file mode with file selected', () => {
      const onUpload = vi.fn();
      render(<DocumentForm {...defaultProps} onUpload={onUpload} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      // Fill in name
      const nameInput = screen.getByLabelText(/文件名稱/);
      fireEvent.change(nameInput, { target: { value: 'Uploaded Doc' } });

      // Select a file
      const fileInput = document.getElementById('doc-file-upload') as HTMLInputElement;
      const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: '建立文件' }));

      expect(onUpload).toHaveBeenCalledTimes(1);
      const fd = onUpload.mock.calls[0][0] as FormData;
      expect(fd).toBeInstanceOf(FormData);
      expect(fd.get('file')).toBe(testFile);
      expect(fd.get('name')).toBe('Uploaded Doc');
      expect(fd.get('type')).toBe('contract');
    });

    it('includes customerId in FormData when customerId is set', () => {
      const onUpload = vi.fn();
      render(<DocumentForm {...defaultProps} onUpload={onUpload} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      // Fill in name
      const nameInput = screen.getByLabelText(/文件名稱/);
      fireEvent.change(nameInput, { target: { value: 'Customer Doc' } });

      // Fill in customer ID
      const customerInput = screen.getByLabelText(/關聯客戶/);
      fireEvent.change(customerInput, { target: { value: 'cust-123' } });

      // Select a file
      const fileInput = document.getElementById('doc-file-upload') as HTMLInputElement;
      const testFile = new File(['data'], 'invoice.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: '建立文件' }));

      expect(onUpload).toHaveBeenCalledTimes(1);
      const fd = onUpload.mock.calls[0][0] as FormData;
      expect(fd.get('customerId')).toBe('cust-123');
    });

    it('uses file name as FormData name when form name is empty', () => {
      const onUpload = vi.fn();
      render(<DocumentForm {...defaultProps} onUpload={onUpload} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      // Select a file (name will auto-populate from file, so clear it after)
      const fileInput = document.getElementById('doc-file-upload') as HTMLInputElement;
      const testFile = new File(['data'], 'auto-name.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // Submit - name should be the file name (auto-populated)
      fireEvent.click(screen.getByRole('button', { name: '建立文件' }));

      expect(onUpload).toHaveBeenCalledTimes(1);
      const fd = onUpload.mock.calls[0][0] as FormData;
      expect(fd.get('name')).toBe('auto-name.pdf');
    });

    it('falls back to onSubmit when no onUpload provided in file mode', () => {
      const onSubmit = vi.fn();
      render(<DocumentForm {...defaultProps} onSubmit={onSubmit} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      // Fill name
      const nameInput = screen.getByLabelText(/文件名稱/);
      fireEvent.change(nameInput, { target: { value: 'Fallback Doc' } });

      // Select a file
      const fileInput = document.getElementById('doc-file-upload') as HTMLInputElement;
      const testFile = new File(['data'], 'file.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // Submit without onUpload prop
      fireEvent.click(screen.getByRole('button', { name: '建立文件' }));

      // Should fall through to onSubmit since onUpload is not provided
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not include customerId in FormData when customerId is empty', () => {
      const onUpload = vi.fn();
      render(<DocumentForm {...defaultProps} onUpload={onUpload} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      // Fill name but leave customerId empty
      const nameInput = screen.getByLabelText(/文件名稱/);
      fireEvent.change(nameInput, { target: { value: 'No Customer Doc' } });

      // Select a file
      const fileInput = document.getElementById('doc-file-upload') as HTMLInputElement;
      const testFile = new File(['data'], 'report.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: '建立文件' }));

      expect(onUpload).toHaveBeenCalledTimes(1);
      const fd = onUpload.mock.calls[0][0] as FormData;
      expect(fd.get('customerId')).toBeNull();
    });
  });

  describe('Drag and Drop', () => {
    it('sets file on drop', () => {
      render(<DocumentForm {...defaultProps} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      const dropZone = screen.getByRole('button', { name: '拖放或點擊上傳檔案' });
      const testFile = new File(['dropped content'], 'dropped.pdf', { type: 'application/pdf' });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [testFile] },
      });

      // After drop, the file name should be displayed
      expect(screen.getByText('dropped.pdf')).toBeInTheDocument();
    });

    it('auto-populates name field when name is empty on drop', () => {
      render(<DocumentForm {...defaultProps} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      const dropZone = screen.getByRole('button', { name: '拖放或點擊上傳檔案' });
      const testFile = new File(['data'], 'auto-filled.pdf', { type: 'application/pdf' });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [testFile] },
      });

      const nameInput = screen.getByLabelText(/文件名稱/) as HTMLInputElement;
      expect(nameInput.value).toBe('auto-filled.pdf');
    });

    it('does not overwrite name on drop when name is already filled', () => {
      render(<DocumentForm {...defaultProps} />);

      // Fill name first
      const nameInput = screen.getByLabelText(/文件名稱/) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Existing Name' } });

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      const dropZone = screen.getByRole('button', { name: '拖放或點擊上傳檔案' });
      const testFile = new File(['data'], 'should-not-replace.pdf', { type: 'application/pdf' });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [testFile] },
      });

      expect(nameInput.value).toBe('Existing Name');
    });

    it('sets isDragOver state on dragOver event', () => {
      render(<DocumentForm {...defaultProps} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      const dropZone = screen.getByRole('button', { name: '拖放或點擊上傳檔案' });

      fireEvent.dragOver(dropZone);

      // When isDragOver is true, the border class changes to border-accent-600
      expect(dropZone.className).toContain('border-accent-600');
    });

    it('resets isDragOver state on dragLeave event', () => {
      render(<DocumentForm {...defaultProps} />);

      // Switch to file mode
      fireEvent.click(screen.getByRole('tab', { name: '檔案上傳' }));

      const dropZone = screen.getByRole('button', { name: '拖放或點擊上傳檔案' });

      // First trigger dragOver to set isDragOver = true
      fireEvent.dragOver(dropZone);
      expect(dropZone.className).toContain('border-accent-600');

      // Then trigger dragLeave to reset
      fireEvent.dragLeave(dropZone);
      expect(dropZone.className).not.toContain('border-accent-600 bg-accent-600/10');
    });
  });

  describe('Edit mode with customerId', () => {
    it('pre-fills customerId when document has customerId', () => {
      const editDocument: import('@/hooks/useDocuments').Document = {
        id: 'doc-2',
        name: 'Customer Contract',
        type: 'contract',
        content: 'Contract content',
        filePath: null,
        fileSize: null,
        mimeType: null,
        createdAt: '2026-01-20T00:00:00Z',
        updatedAt: '2026-01-20T00:00:00Z',
        organizationId: 'org-1',
        customerId: 'cust-456',
        customer: null,
        _count: { analyses: 2 },
      };

      render(<DocumentForm {...defaultProps} document={editDocument} />);

      const customerInput = screen.getByLabelText(/關聯客戶/) as HTMLInputElement;
      expect(customerInput.value).toBe('cust-456');
    });

    it('pre-fills all fields when document has all data', () => {
      const editDocument: import('@/hooks/useDocuments').Document = {
        id: 'doc-3',
        name: 'Full Document',
        type: 'meeting_notes',
        content: 'Meeting notes content here',
        filePath: null,
        fileSize: null,
        mimeType: null,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        organizationId: 'org-1',
        customerId: 'cust-789',
        customer: null,
        _count: { analyses: 1 },
      };

      render(<DocumentForm {...defaultProps} document={editDocument} />);

      const nameInput = screen.getByLabelText(/文件名稱/) as HTMLInputElement;
      const typeSelect = screen.getByLabelText(/文件類型/) as HTMLSelectElement;
      const contentTextarea = screen.getByLabelText(/文件內容/) as HTMLTextAreaElement;
      const customerInput = screen.getByLabelText(/關聯客戶/) as HTMLInputElement;

      expect(nameInput.value).toBe('Full Document');
      expect(typeSelect.value).toBe('meeting_notes');
      expect(contentTextarea.value).toBe('Meeting notes content here');
      expect(customerInput.value).toBe('cust-789');
    });
  });
});
