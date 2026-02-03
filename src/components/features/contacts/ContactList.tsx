'use client';

/**
 * ContactList - Contact list container with loading/empty states
 * WCAG 2.2 AAA Compliant
 */

import { ContactRow } from './ContactRow';
import type { Contact } from '@/hooks/useContacts';

// ============================================
// Types
// ============================================

interface ContactListProps {
  readonly contacts: readonly Contact[];
  readonly isLoading: boolean;
  readonly onEdit: (contact: Contact) => void;
  readonly onDelete: (contact: Contact) => void;
}

// ============================================
// Skeleton
// ============================================

const SKELETON_IDS = ['skel-1', 'skel-2', 'skel-3'] as const;

function ContactSkeleton() {
  return (
    <div className="space-y-1">
      {SKELETON_IDS.map((id) => (
        <div key={id} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-background-hover flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-background-hover rounded w-1/3" />
            <div className="h-3 bg-background-hover rounded w-1/4" />
          </div>
          <div className="flex gap-1">
            <div className="w-9 h-9 rounded-lg bg-background-hover" />
            <div className="w-9 h-9 rounded-lg bg-background-hover" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-text-muted text-sm">尚無聯絡人</p>
      <p className="text-text-muted text-xs mt-1">
        點擊上方「新增聯絡人」按鈕新增第一個聯絡人
      </p>
    </div>
  );
}

// ============================================
// Component
// ============================================

export function ContactList({
  contacts,
  isLoading,
  onEdit,
  onDelete,
}: ContactListProps) {
  if (isLoading) {
    return <ContactSkeleton />;
  }

  if (contacts.length === 0) {
    return <EmptyState />;
  }

  return (
    <section
      aria-label="聯絡人列表"
      className="divide-y divide-border"
    >
      {contacts.map((contact) => (
        <ContactRow
          key={contact.id}
          contact={contact}
          onEdit={() => onEdit(contact)}
          onDelete={() => onDelete(contact)}
        />
      ))}
    </section>
  );
}

export type { ContactListProps };
