'use client';

/**
 * CustomerDetailPanel - Slide-in panel for customer details with edit/delete
 * WCAG 2.2 AAA Compliant
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Pencil, Trash2, Mail, Phone, Building2, FileText, Handshake, ClipboardList, Plus, File, Copy, Check, Users, Printer, Hash } from 'lucide-react';
import { ContactRow, ContactForm } from '@/components/features/contacts';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, type Contact, type CreateContactData } from '@/hooks/useContacts';
import { CustomerForm, type CustomerFormData } from './CustomerForm';
import { DealForm, type DealFormData } from '@/components/features/deals/DealForm';
import { TaskForm, type TaskFormData } from '@/components/features/tasks/TaskForm';
import { DocumentForm, type DocumentFormData } from '@/components/features/documents/DocumentForm';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  useCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type Customer,
} from '@/hooks/useCustomers';
import { useDeals, useCreateDeal } from '@/hooks/useDeals';
import { useTasks, useCreateTask, type TaskType, type TaskPriority, type TaskStatus } from '@/hooks/useTasks';
import { useDocuments, useCreateDocument } from '@/hooks/useDocuments';
import { statusColors, pipelineLabels, pipelineColors, taskTypeLabels } from '@/lib/design-tokens';

// ============================================
// Types
// ============================================

interface CustomerDetailPanelProps {
  readonly customer: Customer;
  readonly onClose: () => void;
}

type PanelState =
  | { type: 'view' }
  | { type: 'edit' }
  | { type: 'delete' }
  | { type: 'create-deal' }
  | { type: 'create-task' }
  | { type: 'create-document' }
  | { type: 'create-contact' }
  | { type: 'edit-contact'; contact: Contact }
  | { type: 'delete-contact'; contact: Contact };

// ============================================
// Helpers
// ============================================

const statusLabels: Record<string, string> = {
  active: '活躍',
  inactive: '停用',
  lead: '潛在',
};

const typeLabels: Record<string, string> = {
  B2B: 'B2B 企業客戶',
  B2C: 'B2C 個人客戶',
};

// ============================================
// Component
// ============================================

export function CustomerDetailPanel({ customer, onClose }: CustomerDetailPanelProps) {
  const router = useRouter();
  const [panelState, setPanelState] = useState<PanelState>({ type: 'view' });

  // Fetch latest customer data
  const { data: customerData } = useCustomer(customer.id);
  const latestCustomer = customerData?.data ?? customer;

  // Fetch related deals
  const { data: dealsData } = useDeals({ customerId: customer.id, limit: 5 });

  // Fetch related tasks (activity timeline)
  const { data: tasksData } = useTasks({ customerId: customer.id, limit: 5, sort: 'dueDate', order: 'desc' });

  // Fetch related contacts (inline)
  const { data: contactsData } = useContacts(customer.id);

  // Fetch related documents
  const { data: docsData } = useDocuments({ customerId: customer.id, limit: 5 });

  // Mutations
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const createDealMutation = useCreateDeal();
  const createTaskMutation = useCreateTask();
  const createDocumentMutation = useCreateDocument();
  const createContactMutation = useCreateContact(customer.id);
  const updateContactMutation = useUpdateContact(customer.id);
  const deleteContactMutation = useDeleteContact(customer.id);

  // Handlers
  const handleUpdate = (formData: CustomerFormData) => {
    updateMutation.mutate(
      { id: customer.id, ...formData },
      {
        onSuccess: () => setPanelState({ type: 'view' }),
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(customer.id, {
      onSuccess: () => onClose(),
    });
  };

  const handleCreateDeal = (formData: DealFormData) => {
    createDealMutation.mutate(formData, {
      onSuccess: () => setPanelState({ type: 'view' }),
    });
  };

  const handleCreateTask = (formData: TaskFormData) => {
    createTaskMutation.mutate(
      {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type as TaskType,
        priority: formData.priority as TaskPriority,
        status: formData.status as TaskStatus,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        customerId: formData.customerId || null,
      },
      {
        onSuccess: () => setPanelState({ type: 'view' }),
      }
    );
  };

  const handleCreateDocument = (formData: DocumentFormData) => {
    createDocumentMutation.mutate(formData, {
      onSuccess: () => setPanelState({ type: 'view' }),
    });
  };

  const handleCreateContact = (data: CreateContactData) => {
    createContactMutation.mutate(data, {
      onSuccess: () => setPanelState({ type: 'view' }),
    });
  };

  const handleUpdateContact = (data: CreateContactData) => {
    if (panelState.type !== 'edit-contact') return;
    updateContactMutation.mutate(
      { contactId: panelState.contact.id, ...data },
      { onSuccess: () => setPanelState({ type: 'view' }) }
    );
  };

  const handleDeleteContact = () => {
    if (panelState.type !== 'delete-contact') return;
    deleteContactMutation.mutate(panelState.contact.id, {
      onSuccess: () => setPanelState({ type: 'view' }),
    });
  };

  const statusColor = statusColors[latestCustomer.status as keyof typeof statusColors] || statusColors.inactive;
  const statusLabel = statusLabels[latestCustomer.status] || latestCustomer.status;
  const typeLabel = typeLabels[latestCustomer.type] || latestCustomer.type;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <dialog
        open
        className="
          fixed right-0 top-0 h-full w-full max-w-lg m-0
          bg-background border-l border-border
          z-50 flex flex-col
          animate-slide-in-right
        "
        aria-label={`${latestCustomer.name} 的詳細資訊`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-16 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">
                {latestCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary truncate">
                {latestCustomer.name}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: statusColor }}
                />
                <span className="text-xs text-text-muted">{statusLabel}</span>
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs text-text-muted">{typeLabel}</span>
              </div>
            </div>
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

        {/* Action Bar */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0 flex gap-2">
          <button
            type="button"
            onClick={() => setPanelState({ type: 'edit' })}
            className="
              flex-1 flex items-center justify-center gap-2
              px-4 py-2.5 rounded-lg
              border border-border text-text-secondary
              hover:bg-background-hover transition-colors
              min-h-[44px]
            "
          >
            <Pencil className="w-4 h-4" />
            <span>編輯</span>
          </button>
          <button
            type="button"
            onClick={() => setPanelState({ type: 'delete' })}
            className="
              w-11 flex items-center justify-center
              px-2 py-2.5 rounded-lg
              border border-error/30 text-error
              hover:bg-error/10 transition-colors
              min-h-[44px]
            "
            aria-label="刪除客戶"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Contact Info — B2B shows company-level fields, B2C shows personal fields */}
          {latestCustomer.type === 'B2B' ? (
            <section aria-label="公司資訊">
              <h3 className="text-sm font-medium text-text-muted mb-3">公司資訊</h3>
              <div className="space-y-3">
                <InfoRow icon={<Phone className="w-4 h-4" />} label="公司電話" value={latestCustomer.companyPhone} linkType="tel" copyable />
                <InfoRow icon={<Printer className="w-4 h-4" />} label="傳真" value={latestCustomer.fax} copyable />
                <InfoRow icon={<Hash className="w-4 h-4" />} label="統一編號" value={latestCustomer.taxId} copyable />
                {latestCustomer.company && latestCustomer.company !== latestCustomer.name && (
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="公司" value={latestCustomer.company} />
                )}
              </div>
            </section>
          ) : (
            <section aria-label="聯絡資訊">
              <h3 className="text-sm font-medium text-text-muted mb-3">聯絡資訊</h3>
              <div className="space-y-3">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="電子郵件" value={latestCustomer.email} linkType="mailto" copyable />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="電話" value={latestCustomer.phone} linkType="tel" copyable />
                {latestCustomer.company && latestCustomer.company !== latestCustomer.name && (
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="公司" value={latestCustomer.company} />
                )}
              </div>
            </section>
          )}

          {/* Contacts (inline) */}
          <section aria-label="聯絡人">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-muted">
                <Users className="w-4 h-4 inline-block mr-1.5" aria-hidden="true" />
                聯絡人 ({contactsData?.data?.length ?? 0})
              </h3>
              <button
                type="button"
                onClick={() => setPanelState({ type: 'create-contact' })}
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-400 hover:bg-background-hover transition-colors"
                aria-label="新增聯絡人"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {contactsData?.data && contactsData.data.length > 0 ? (
              <div className="divide-y divide-border rounded-lg bg-background-hover/30 -mx-1">
                {contactsData.data.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onEdit={() => setPanelState({ type: 'edit-contact', contact })}
                    onDelete={() => setPanelState({ type: 'delete-contact', contact })}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted py-2">尚無聯絡人</p>
            )}
          </section>

          {/* Related Deals */}
          <section aria-label="相關商機">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-muted">
                <Handshake className="w-4 h-4 inline-block mr-1.5" aria-hidden="true" />
                相關商機 ({dealsData?.data?.length ?? 0})
              </h3>
              <button
                type="button"
                onClick={() => setPanelState({ type: 'create-deal' })}
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-400 hover:bg-background-hover transition-colors"
                aria-label="新增商機"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {dealsData?.data && dealsData.data.length > 0 ? (
              <div className="space-y-2">
                {(dealsData.data as readonly { id: string; title: string; stage: string; value: number | null; currency: string }[]).map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => router.push(`/deals?id=${deal.id}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-background-hover/50 hover:bg-background-hover transition-colors text-left min-h-[44px]"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: pipelineColors[deal.stage as keyof typeof pipelineColors] ?? '#666' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{deal.title}</p>
                      <p className="text-xs text-text-muted">
                        {pipelineLabels[deal.stage] ?? deal.stage}
                        {deal.value != null && ` · ${deal.currency === 'TWD' ? 'NT$' : deal.currency} ${deal.value.toLocaleString()}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted py-2">尚無商機</p>
            )}
          </section>

          {/* Recent Tasks / Activity */}
          <section aria-label="近期活動">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-muted">
                <ClipboardList className="w-4 h-4 inline-block mr-1.5" aria-hidden="true" />
                近期活動 ({tasksData?.data?.length ?? 0})
              </h3>
              <button
                type="button"
                onClick={() => setPanelState({ type: 'create-task' })}
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-400 hover:bg-background-hover transition-colors"
                aria-label="新增任務"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tasksData?.data && tasksData.data.length > 0 ? (
              <div className="space-y-2">
                {tasksData.data.map((task) => {
                  const taskTypeLabel = taskTypeLabels[task.type] ?? task.type;
                  const isCompleted = task.status === 'completed';
                  const isOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

                  function getTaskBadgeClass(): string {
                    if (isCompleted) return 'bg-green-500/15 text-green-400';
                    if (isOverdue) return 'bg-error/15 text-error';
                    return 'bg-accent-600/15 text-accent-400';
                  }

                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-background-hover/50"
                    >
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${getTaskBadgeClass()}`}
                      >
                        {taskTypeLabel}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isCompleted ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-TW') : '無日期'}
                          {task.assignedTo && ` · ${task.assignedTo.name}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted py-2">尚無活動</p>
            )}
          </section>

          {/* Related Documents */}
          <section aria-label="相關文件">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-muted">
                <File className="w-4 h-4 inline-block mr-1.5" aria-hidden="true" />
                相關文件 ({docsData?.data?.length ?? 0})
              </h3>
              <button
                type="button"
                onClick={() => setPanelState({ type: 'create-document' })}
                className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-400 hover:bg-background-hover transition-colors"
                aria-label="新增文件"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {docsData?.data && docsData.data.length > 0 ? (
              <div className="space-y-2">
                {docsData.data.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => router.push(`/documents?id=${doc.id}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-background-hover/50 hover:bg-background-hover transition-colors text-left min-h-[44px]"
                  >
                    <FileText className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{doc.name}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(doc.createdAt).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted py-2">尚無文件</p>
            )}
          </section>

          {/* Notes */}
          {latestCustomer.notes && (
            <section aria-label="備註">
              <h3 className="text-sm font-medium text-text-muted mb-3">備註</h3>
              <div className="bg-background-hover/50 rounded-lg p-3">
                <div className="flex gap-2">
                  <FileText className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{latestCustomer.notes}</p>
                </div>
              </div>
            </section>
          )}

          {/* Metadata */}
          <section aria-label="其他資訊">
            <h3 className="text-sm font-medium text-text-muted mb-3">其他資訊</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">建立時間</span>
                <span className="text-text-secondary">{new Date(latestCustomer.createdAt).toLocaleDateString('zh-TW')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">更新時間</span>
                <span className="text-text-secondary">{new Date(latestCustomer.updatedAt).toLocaleDateString('zh-TW')}</span>
              </div>
            </div>
          </section>
        </div>
      </dialog>

      {/* Edit Modal */}
      {panelState.type === 'edit' && (
        <CustomerForm
          customer={latestCustomer}
          onSubmit={handleUpdate}
          onClose={() => setPanelState({ type: 'view' })}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      {panelState.type === 'delete' && (
        <DeleteConfirmModal
          entityType="客戶"
          entityName={latestCustomer.name}
          onConfirm={handleDelete}
          onCancel={() => setPanelState({ type: 'view' })}
          isDeleting={deleteMutation.isPending}
          warningMessage="刪除客戶將同時刪除其所有聯絡人資料。"
        />
      )}

      {/* Create Contact Modal */}
      {panelState.type === 'create-contact' && (
        <ContactForm
          onSubmit={handleCreateContact}
          onClose={() => setPanelState({ type: 'view' })}
          isSubmitting={createContactMutation.isPending}
        />
      )}

      {/* Edit Contact Modal */}
      {panelState.type === 'edit-contact' && (
        <ContactForm
          contact={panelState.contact}
          onSubmit={handleUpdateContact}
          onClose={() => setPanelState({ type: 'view' })}
          isSubmitting={updateContactMutation.isPending}
        />
      )}

      {/* Delete Contact Confirmation */}
      {panelState.type === 'delete-contact' && (
        <DeleteConfirmModal
          entityType="聯絡人"
          entityName={panelState.contact.name}
          onConfirm={handleDeleteContact}
          onCancel={() => setPanelState({ type: 'view' })}
          isDeleting={deleteContactMutation.isPending}
        />
      )}

      {/* Create Deal Modal */}
      {panelState.type === 'create-deal' && (
        <DealForm
          onSubmit={handleCreateDeal}
          onClose={() => setPanelState({ type: 'view' })}
          isSubmitting={createDealMutation.isPending}
          initialCustomerId={customer.id}
          initialCustomerName={latestCustomer.name}
        />
      )}

      {/* Create Task Modal */}
      {panelState.type === 'create-task' && (
        <TaskForm
          onSubmit={handleCreateTask}
          onClose={() => setPanelState({ type: 'view' })}
          isSubmitting={createTaskMutation.isPending}
          initialCustomerId={customer.id}
          initialCustomerName={latestCustomer.name}
        />
      )}

      {/* Create Document Modal */}
      {panelState.type === 'create-document' && (
        <DocumentForm
          onSubmit={handleCreateDocument}
          onClose={() => setPanelState({ type: 'view' })}
          isSubmitting={createDocumentMutation.isPending}
          initialCustomerId={customer.id}
          initialCustomerName={latestCustomer.name}
        />
      )}
    </>
  );
}

// ============================================
// InfoRow
// ============================================

interface InfoRowProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string | null;
  readonly linkType?: 'tel' | 'mailto';
  readonly copyable?: boolean;
}

function InfoRow({ icon, label, value, linkType, copyable }: InfoRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  const renderValue = () => {
    if (!value) return <span className="text-text-muted">-</span>;
    if (linkType) {
      const href = linkType === 'tel' ? `tel:${value}` : `mailto:${value}`;
      return (
        <a
          href={href}
          className="text-accent-400 hover:underline hover:text-accent-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      );
    }
    return value;
  };

  return (
    <div className="flex items-center gap-3 group/info">
      <span className="text-text-muted" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm text-text-primary truncate">{renderValue()}</p>
      </div>
      {copyable && value && (
        <button
          type="button"
          onClick={handleCopy}
          className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-accent-400 hover:bg-background-hover transition-colors opacity-0 group-hover/info:opacity-100 focus:opacity-100"
          aria-label={copied ? '已複製' : `複製${label}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
