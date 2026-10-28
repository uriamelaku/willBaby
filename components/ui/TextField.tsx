"use client";

import { useId, type InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, className = "", ...props }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={`min-h-11 rounded-2xl border-2 border-text/15 bg-card px-4 py-2 focus:border-brand focus:outline-none aria-invalid:border-danger ${className}`}
        {...props}
      />
      {message && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={`text-sm ${error ? "text-danger" : "opacity-75"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
