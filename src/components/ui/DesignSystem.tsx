import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  X,
} from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0066CC] hover:bg-[#0052A3] text-white border border-transparent shadow-xs',
  secondary:
    'bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#D2D2D7]',
  dark:
    'bg-[#0F172A] hover:bg-[#1E293B] text-white border border-transparent shadow-xs',
  danger:
    'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-xs',
  ghost:
    'bg-transparent hover:bg-[#F5F5F7] text-[#424245] hover:text-[#1D1D1F] border border-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'min-h-[42px] px-4 py-2 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'min-h-[48px] px-5 py-2.5 text-sm rounded-xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-1 disabled:opacity-55 disabled:cursor-not-allowed whitespace-nowrap ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FieldGroup({
  label,
  error,
  hint,
  required,
  className = '',
  children,
}: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold text-[#1D1D1F]">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[#6E6E73]">{hint}</p>
      ) : null}
    </div>
  );
}

export function InputField({
  label,
  error,
  hint,
  required,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <FieldGroup label={label} error={error} hint={hint} required={required}>
      <input
        required={required}
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border bg-white text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] transition-colors ${
          error ? 'border-red-400' : 'border-[#D2D2D7]'
        } ${className}`}
        {...props}
      />
    </FieldGroup>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <FieldGroup label={label} error={error} hint={hint} required={required}>
      <select
        required={required}
        className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl border bg-white text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] transition-colors ${
          error ? 'border-red-400' : 'border-[#D2D2D7]'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldGroup>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  required,
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <FieldGroup label={label} error={error} hint={hint} required={required}>
      <textarea
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30 focus:border-[#0066CC] transition-colors ${
          error ? 'border-red-400' : 'border-[#D2D2D7]'
        } ${className}`}
        {...props}
      />
    </FieldGroup>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-2xl',
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F172A]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-2xl border border-[#E5E5EA] w-full ${maxWidth} max-h-[92vh] flex flex-col shadow-2xl overflow-hidden`}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E5EA] flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] truncate">{title}</h2>
            {subtitle && <p className="text-xs text-[#6E6E73] truncate mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg border border-[#E5E5EA] text-[#424245] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-[#E5E5EA] bg-[#F5F5F7]/60 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const STATUS_DOT_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-[#6E6E73]',
  info: 'bg-[#0066CC]',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-red-600',
};

const STATUS_TEXT_CLASSES: Record<StatusTone, string> = {
  neutral: 'text-[#424245] bg-[#F5F5F7] border-[#E5E5EA]',
  info: 'text-[#0052A3] bg-blue-50/70 border-blue-200/70',
  success: 'text-emerald-800 bg-emerald-50/80 border-emerald-200/80',
  warning: 'text-amber-800 bg-amber-50/80 border-amber-200/80',
  danger: 'text-red-800 bg-red-50/80 border-red-200/80',
};

export function resolveStatusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (s.includes('paid') || s.includes('completed') || s.includes('delivered') || s.includes('approved') || s.includes('ready') || s.includes('active') || s.includes('available')) {
    return 'success';
  }
  if (s.includes('reject') || s.includes('cancel') || s.includes('overdue') || s.includes('out of stock') || s.includes('deactivated')) {
    return 'danger';
  }
  if (s.includes('pending') || s.includes('awaiting') || s.includes('hold') || s.includes('partial') || s.includes('low')) {
    return 'warning';
  }
  if (s.includes('repair') || s.includes('diagnosis') || s.includes('inspection') || s.includes('quality') || s.includes('estimate') || s.includes('ordered')) {
    return 'info';
  }
  return 'neutral';
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone?: StatusTone;
}) {
  const resolved = tone ?? resolveStatusTone(label);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${STATUS_TEXT_CLASSES[resolved]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT_CLASSES[resolved]}`} />
      {label}
    </span>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'segmented',
}: {
  items: { id: T; label: string; count?: number; icon?: React.ReactNode }[];
  value: T;
  onChange: (next: T) => void;
  variant?: 'segmented' | 'underline';
}) {
  if (variant === 'underline') {
    return (
      <div className="flex items-center gap-1 border-b border-[#E5E5EA] overflow-x-auto no-scrollbar">
        {items.map((item) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-[#0066CC] text-[#0066CC]'
                  : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span className="font-mono text-[11px] opacity-75">({item.count})</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              active
                ? 'bg-white text-[#1D1D1F] shadow-xs border border-[#E5E5EA]'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span className="font-mono text-[11px] opacity-70">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-[#6E6E73]">
      {items.map((item, idx) => (
        <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
          {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#86868B]" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-[#0066CC] font-medium transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#1D1D1F] font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}) {
  const valueTone =
    tone === 'info'
      ? 'text-[#0066CC]'
      : tone === 'success'
        ? 'text-emerald-700'
        : tone === 'warning'
          ? 'text-amber-700'
          : tone === 'danger'
            ? 'text-red-600'
            : 'text-[#1D1D1F]';
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#6E6E73]">{label}</span>
        {icon && <span className="text-[#0066CC] shrink-0">{icon}</span>}
      </div>
      <div>
        <p className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${valueTone}`}>
          {value}
        </p>
        {hint && <p className="text-[11px] text-[#6E6E73] mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#E5E5EA]/70 ${className}`} />;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="py-12 px-6 rounded-2xl border border-dashed border-[#D2D2D7] bg-white text-center space-y-3">
      <div className="w-11 h-11 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center mx-auto text-[#6E6E73]">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="text-sm font-bold text-[#1D1D1F]">{title}</h3>
        <p className="text-xs text-[#6E6E73] leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-1 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load records',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-6 rounded-2xl border border-red-200 bg-red-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-red-900">{title}</h3>
          <p className="text-xs text-red-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (totalItems <= pageSize && totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E5EA] bg-[#F5F5F7]/50 text-xs text-[#6E6E73]">
      <span className="font-mono tabular-nums">
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] bg-white text-[#1D1D1F] font-semibold disabled:opacity-40"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="px-2 font-mono font-semibold text-[#1D1D1F]">
          {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] bg-white text-[#1D1D1F] font-semibold disabled:opacity-40"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
