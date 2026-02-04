'use client';

/**
 * ContactsPanel - Slide-in panel for managing customer contacts
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { X, UserPlus, AlertTriangle } from 'lucide-react';
import { ContactList } from './ContactList';
import { ContactForm } from './ContactForm';
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '@/hooks/useContacts';
import type { Contact, CreateContactData } from '@/hooks/useContacts';
import type { Customer } from '@/hooks/useCustomers';

// ============================================
// Types
// ============================================

interface ContactsPanelProps {
  readonly customer: Customer;
  readonly onClose: () => void;
}

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; contact: Contact }
  | { type: 'delete'; contact: Contact };

// ============================================
// Component
// ============================================

export function ContactsPanel({ customer, onClose }: ContactsPanelProps) {
  const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });

  // Fetch contacts
  const { data, isLoading } = useContacts(customer.id);
  const contacts = data?.data ?? [];

  // Mutations
  const createMutation = useCreateContact(customer.id);
  const updateMutation = useUpdateContact(customer.id);
  const deleteMutation = useDeleteContact(customer.id);

  // Handlers
  const handleCreate = (formData: CreateContactData) => {
    createMutation.mutate(formData, {
      onSuccess: () => setModalState({ type: 'closed' }),
    });
  };

  const handleUpdate = (formData: CreateContactData) => {
    if (modalState.type !== 'edit') return;

    updateMutation.mutate(
      { contactId: modalState.contact.id, ...formData },
      {
        onSuccess: () => setModalState({ type: 'closed' }),
      }
    );
  };

  const handleDelete = () => {
    if (modalState.type !== 'delete') return;

    deleteMutation.mutate(modalState.contact.id, {
      onSuccess: () => setModalState({ type: 'closed' }),
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <dialog
        open
        className="
          fixed right-0 top-0 h-full w-full max-w-md m-0
          bg-background border-l border-border
          z-50 flex flex-col
          animate-slide-in-right
        "
        aria-label={`${customer.name} 的聯絡人`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-16 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-text-primary truncate">
              聯絡人
            </h2>
            <p className="text-xs text-text-muted truncate">{customer.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="
              w-10 h-10 flex items-center justify-center rounded-lg
              text-text-muted hover:text-text-primary hover:bg-background-hover
              transition-colors ml-2
            "
            aria-label="關閉面板"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Add Button */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <button
            type="button"
            onClick={() => setModalState({ type: 'create' })}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-2.5 rounded-lg
              bg-accent-600 text-white
              hover:bg-accent-700 transition-colors
              min-h-[44px]
            "
          >
            <UserPlus className="w-4 h-4" />
            <span>新增聯絡人</span>
          </button>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          <ContactList
            contacts={contacts}
            isLoading={isLoading}
            onEdit={(contact) => setModalState({ type: 'edit', contact })}
            onDelete={(contact) => setModalState({ type: 'delete', contact })}
          />
        </div>

        {/* Footer */}
        <footer className="px-4 py-3 border-t border-border text-center flex-shrink-0">
          <p className="text-xs text-text-muted">
            共 {contacts.length} 位聯絡人
          </p>
        </footer>
      </dialog>

      {/* Create/Edit Modal */}
      {(modalState.type === 'create' || modalState.type === 'edit') && (
        <ContactForm
          contact={modalState.type === 'edit' ? modalState.contact : null}
          onSubmit={modalState.type === 'create' ? handleCreate : handleUpdate}
          onClose={() => setModalState({ type: 'closed' })}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {modalState.type === 'delete' && (
        <DeleteConfirmModal
          contactName={modalState.contact.name}
          onConfirm={handleDelete}
          onCancel={() => setModalState({ type: 'closed' })}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </>
  );
}

// ============================================
// Delete Confirm Modal
// ============================================

interface DeleteConfirmModalProps {
  readonly contactName: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly isDeleting: boolean;
}

function DeleteConfirmModal({
  contactName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <dialog
        open
        className="relative w-full max-w-sm bg-background-tertiary border border-border rounded-xl shadow-xl p-5"
        aria-label="確認刪除"
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            確認刪除聯絡人？
          </h3>

          {/* Description */}
          <p className="text-sm text-text-secondary mb-6">
            您確定要刪除聯絡人「{contactName}」嗎？此操作無法復原。
          </p>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-background-hover transition-colors min-h-[44px]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-error text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              {isDeleting ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export type { ContactsPanelProps };
