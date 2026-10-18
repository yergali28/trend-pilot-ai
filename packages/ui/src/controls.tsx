import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";

export const focusRing = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-action text-on-action hover:bg-action-hover",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-sunken",
  ghost: "text-action-soft-ink hover:bg-action-soft",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  /** Текст для экранного диктора во время загрузки. */
  loadingLabel?: string;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading = false, loadingLabel, disabled, className = "", children, ...rest }: ButtonProps) {
  const sizing = size === "sm" ? "h-8 px-3 text-sm pointer-coarse:h-11" : "h-9 px-4 text-base pointer-coarse:h-11";
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${variants[variant]} ${focusRing} ${className}`}
    >
      {loading ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none motion-reduce:border-dotted" aria-hidden />
      ) : null}
      {loading && loadingLabel ? <span className="sr-only">{loadingLabel}</span> : null}
      {children}
    </button>
  );
}

interface FieldShellProps {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  id: string;
  children: ReactNode;
}

function FieldShell({ label, hint, error, id, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-sm text-risk">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-sm text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const inputBase = `h-9 pointer-coarse:h-11 w-full rounded-control border bg-surface px-3 text-base text-ink placeholder:text-subtle disabled:cursor-not-allowed disabled:bg-sunken disabled:text-subtle ${focusRing}`;

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  /** Единица или валюта справа от значения. */
  suffix?: string;
}

export function TextField({ label, hint, error, suffix, className = "", ...rest }: TextFieldProps) {
  const id = useId();
  const border = error ? "border-risk" : "border-line-strong";
  return (
    <FieldShell label={label} hint={hint} error={error} id={id}>
      <div className="relative">
        <input
          {...rest}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={`${inputBase} ${border} ${suffix ? "pr-10 text-right tabular-nums" : ""} ${className}`}
        />
        {suffix ? <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-base text-subtle">{suffix}</span> : null}
      </div>
    </FieldShell>
  );
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function SelectField({ label, hint, options, className = "", ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} id={id}>
      <select {...rest} id={id} aria-describedby={hint ? `${id}-msg` : undefined} className={`${inputBase} border-line-strong ${className}`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
