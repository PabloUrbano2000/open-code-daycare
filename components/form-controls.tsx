import type { ReactNode } from "react";

export const fieldClass =
  "w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-auth-placeholder focus:outline-none";

export function fieldErrorId(name: string): string {
  return `field-${name}-error`;
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  const className =
    "mb-2 text-[12px] font-extrabold uppercase tracking-[.7px] text-ink-muted";
  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className={className}>
        {children}
      </label>
    );
  }
  return <div className={className}>{children}</div>;
}

export function FieldError({
  id,
  message,
}: {
  id?: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <span id={id} role="alert" className="mt-1.5 block text-[12.5px] font-bold text-danger">
      {message}
    </span>
  );
}