"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** Set true to make the confirm button destructive (red tint) */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 backdrop-blur-xs px-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Panel */}
      <div
        className="bg-[#1A1E24] border border-slate/25 rounded-sm shadow-2xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-paper">
          {title}
        </h2>
        <p className="text-xs text-slate/80 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-paper/70 hover:text-paper border border-slate/25
              hover:bg-slate/15 rounded-sm transition-colors focus-visible:outline-brass cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors focus-visible:outline-brass cursor-pointer
              ${
                destructive
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-brass text-ink hover:bg-brass/90"
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
