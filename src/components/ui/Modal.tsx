"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
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
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // klik na backdrop
      }}
      className="m-auto w-[min(94vw,540px)] rounded-modal border-2 border-vinyl bg-porcelain p-0 shadow-diner-lg backdrop:bg-vinyl/50"
    >
      <div className="flex items-center justify-between border-b-2 border-vinyl px-5 py-3">
        <h2 className="font-display text-xl">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Zavřít"
          className="rounded-full border-2 border-vinyl bg-vanilla p-1.5 hover:bg-chrome-light"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
