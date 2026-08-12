import type { ReactNode } from "react";

export const fieldClass =
  "w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-auth-placeholder focus:outline-none";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[12px] font-extrabold uppercase tracking-[.7px] text-ink-muted">
      {children}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="mt-1.5 block text-[12.5px] font-bold text-danger">
      {message}
    </span>
  );
}