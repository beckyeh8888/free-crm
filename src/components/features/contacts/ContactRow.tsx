'use client';

/**
 * ContactRow - Contact list item with actions
 * WCAG 2.2 AAA Compliant
 */

import { useState, useRef, useEffect } from 'react';
import { Mail, Phone, MoreVertical, Pencil, Trash2, Star } from 'lucide-react';
import type { Contact } from '@/hooks/useContacts';

// ============================================
// Types
// ============================================

interface ContactRowProps {
  readonly contact: Contact;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

// ============================================
// Component
// ============================================

export function ContactRow({ contact, onEdit, onDelete }: ContactRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get initials for avatar
  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-background-hover transition-colors group">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-white">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary truncate">
            {contact.name}
          </p>
          {contact.isPrimary && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-warning/15 text-warning">
              <Star className="w-3 h-3" aria-hidden="true" />
              <span>主要</span>
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate">
          {contact.title || '無職稱'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        {/* Email link */}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-accent-500 hover:bg-background transition-colors"
            aria-label={`寄送郵件給 ${contact.name}`}
            title={contact.email}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}

        {/* Phone link */}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-accent-500 hover:bg-background transition-colors"
            aria-label={`撥打電話給 ${contact.name}`}
            title={contact.phone}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}

        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-background transition-colors"
            aria-label="更多操作"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-36 bg-background-tertiary border border-border rounded-lg shadow-lg py-1 z-10"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-background-hover hover:text-text-primary transition-colors"
              >
                <Pencil className="w-4 h-4" />
                <span>編輯</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>刪除</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { ContactRowProps };
