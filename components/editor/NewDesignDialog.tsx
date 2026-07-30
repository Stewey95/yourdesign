"use client";

import { useEffect, useRef } from "react";

type NewDesignDialogProps = {
  open: boolean;
  isStarting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function NewDesignDialog({
  open,
  isStarting,
  errorMessage,
  onCancel,
  onConfirm,
}: NewDesignDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const cancel = () => {
    if (!isStarting) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-design-dialog-title"
      aria-describedby="new-design-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
      className="editor-dialog-surface fixed inset-0 m-auto w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[var(--studio-radius-dialog)] p-0 text-left text-slate-100 backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm"
    >
      <div className="p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <h2 id="new-design-dialog-title" className="text-xl font-bold text-white">
          Start a new design?
        </h2>
        <p
          id="new-design-dialog-description"
          className="mt-2 text-sm leading-6 text-slate-300"
        >
          This will clear the current canvas and remove its saved draft.
        </p>

        {errorMessage && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={cancel}
            disabled={isStarting}
            autoFocus
            className="editor-document-action cursor-pointer border border-white/10 bg-slate-800 px-4 text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isStarting}
            aria-label="Start New Design"
            className="editor-document-action cursor-pointer bg-blue-600 px-4 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting ? "Starting…" : "Start New Design"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
