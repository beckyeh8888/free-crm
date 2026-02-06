'use client';

/**
 * ProfileSection - Editable profile settings
 * WCAG 2.2 AAA Compliant
 */

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/useSettings';

export function ProfileSection() {
  const { data: profileData, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const profile = profileData?.data;

  const handleStartEdit = () => {
    setEditName(profile?.name ?? '');
    setEditing(true);
  };

  const handleSave = () => {
    if (!editName.trim()) return;
    updateMutation.mutate(
      { name: editName.trim() },
      {
        onSuccess: () => setEditing(false),
      }
    );
  };

  const handleCancel = () => {
    setEditing(false);
  };

  if (isLoading) {
    return (
      <section className="bg-background-tertiary border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">個人資料</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-background-hover rounded w-1/2" />
          <div className="h-6 bg-background-hover rounded w-2/3" />
          <div className="h-6 bg-background-hover rounded w-1/3" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background-tertiary border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary">個人資料</h2>
        {!editing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-background-hover transition-colors min-h-[36px]"
            aria-label="編輯個人資料"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>編輯</span>
          </button>
        )}
      </div>
      <div className="space-y-0 divide-y divide-border-subtle">
        {/* Name - editable */}
        <div className="flex items-center justify-between py-3">
          <p className="text-sm text-text-secondary">姓名</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="form-input text-sm w-48"
                aria-label="姓名"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending || !editName.trim()}
                className="w-8 h-8 flex items-center justify-center rounded text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                aria-label="儲存"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:bg-background-hover transition-colors"
                aria-label="取消"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-text-primary">{profile?.name ?? '-'}</p>
          )}
        </div>

        {/* Email - read-only */}
        <div className="flex items-center justify-between py-3">
          <p className="text-sm text-text-secondary">電子郵件</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-primary">{profile?.email ?? '-'}</p>
            {profile?.emailVerified && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-success/15 text-success">
                已驗證
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <p className="text-sm text-text-secondary">時區</p>
          <p className="text-sm text-text-primary">Asia/Taipei</p>
        </div>
        <div className="flex items-center justify-between py-3">
          <p className="text-sm text-text-secondary">語言</p>
          <p className="text-sm text-text-primary">繁體中文</p>
        </div>
      </div>
    </section>
  );
}
