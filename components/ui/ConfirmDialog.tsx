"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-app confirmation (native <dialog>: focus trap and Escape for free). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(90vw,24rem)] rounded-3xl bg-card p-6 text-text backdrop:bg-black/40"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      {message && <p className="mt-2">{message}</p>}
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
