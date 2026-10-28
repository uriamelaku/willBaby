"use client";

import { useId, type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function TextArea({ label, className = "", ...props }: TextAreaProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        className={`rounded-2xl border-2 border-text/15 bg-card px-4 py-3 focus:border-brand focus:outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
