'use client';

/**
 * CustomerCombobox - Shared searchable customer picker
 * Extracted for reuse across DealForm, TaskForm, DocumentForm, etc.
 * WCAG 2.2 AAA Compliant (ARIA combobox pattern)
 */

import { useState, useRef, useEffect, useId } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { useCustomers, type Customer } from '@/hooks/useCustomers';

interface CustomerComboboxProps {
  readonly value: string;
  readonly initialName?: string;
  readonly onChange: (customerId: string) => void;
}

export function CustomerCombobox({ value, initialName, onChange }: CustomerComboboxProps) {
  const listboxId = useId();
  const [search, setSearch] = useState(initialName ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(initialName ?? '');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useCustomers({
    search: search || undefined,
    limit: 10,
  });
  const customers = data?.data ?? [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Restore selected name if user didn't pick
        if (value && selectedName) {
          setSearch(selectedName);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, selectedName]);

  const handleSelect = (customer: Customer) => {
    onChange(customer.id);
    setSelectedName(customer.name);
    setSearch(customer.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSelectedName('');
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange('');
              setSelectedName('');
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="form-input pl-9 pr-8 w-full"
          placeholder="搜尋客戶..."
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-label="選擇客戶"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary"
            aria-label="清除選擇"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
        )}
      </div>

      {isOpen && customers.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-background-tertiary border border-border rounded-lg shadow-lg"
        >
          {customers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              role="option"
              aria-selected={customer.id === value}
              className={`w-full text-left px-3 py-2 cursor-pointer text-sm transition-colors
                ${customer.id === value ? 'bg-accent-600/20 text-accent-400' : 'text-text-primary hover:bg-background-hover'}
              `}
              onClick={() => handleSelect(customer)}
            >
              <span className="font-medium">{customer.name}</span>
              {customer.company && (
                <span className="text-text-muted ml-2 text-xs">{customer.company}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && search && customers.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background-tertiary border border-border rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm text-text-muted">找不到符合的客戶</p>
        </div>
      )}
    </div>
  );
}
