import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";

const control =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-soft transition placeholder:text-ink-400 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400 dark:bg-ink-900 dark:text-ink-100 dark:placeholder:text-ink-500 dark:disabled:bg-ink-800";

const ok =
  "border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:ring-brand-500/15 dark:border-ink-700 dark:hover:border-ink-600 dark:focus:border-brand-400";

const invalid =
  "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-500/15 dark:border-red-500/40 dark:bg-red-950/20 dark:focus:border-red-400";

interface FieldShellProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  htmlFor?: string;
  children: ReactNode;
}

export function FieldShell({
  label,
  hint,
  error,
  optional,
  htmlFor,
  children,
}: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-semibold text-ink-800 dark:text-ink-200"
        >
          {label}
        </label>
        {optional && (
          <span className="text-[11px] font-medium text-ink-400">Optional</span>
        )}
      </div>

      {children}

      {error ? (
        <p className="text-[12.5px] font-medium text-red-600 dark:text-red-300">
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  leadingSlot?: ReactNode;
  trailingSlot?: ReactNode;
  className?: string;
}

export function TextField({
  label,
  hint,
  error,
  optional,
  leadingSlot,
  trailingSlot,
  id,
  className = "",
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      htmlFor={fieldId}
    >
      <div className="relative">
        {leadingSlot && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400">
            {leadingSlot}
          </span>
        )}
        <input
          id={fieldId}
          {...rest}
          aria-invalid={Boolean(error)}
          className={`${control} ${error ? invalid : ok} ${leadingSlot ? "pl-10" : ""} ${className}`}
        />
        {trailingSlot}
      </div>
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  leadingSlot?: ReactNode;
  className?: string;
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  options,
  placeholder,
  leadingSlot,
  id,
  className = "",
  ...rest
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      htmlFor={fieldId}
    >
      <div className="relative">
        {leadingSlot && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-ink-400">
            {leadingSlot}
          </span>
        )}

        <select
          id={fieldId}
          {...rest}
          aria-invalid={Boolean(error)}
          className={`${control} ${error ? invalid : ok} cursor-pointer appearance-none pr-9 ${
            leadingSlot ? "pl-10" : ""
          } ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FieldShell>
  );
}
