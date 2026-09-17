"use client";

import { useState } from "react";

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export default function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
      const input = document.getElementById("share-url-input") as HTMLInputElement;
      input?.select();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 backdrop-blur-xs px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div
        className="bg-[#1A1E24] border border-slate/25 rounded-sm shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="share-modal-title" className="text-base font-semibold text-paper">
            Share link
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate hover:text-paper transition-colors focus-visible:outline-brass rounded-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-xs text-slate/80">
          Anyone with this link can download the file — no sign-in needed.
        </p>

        <div className="flex gap-2">
          <input
            id="share-url-input"
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 text-xs bg-[#14171C] border border-slate/25 rounded-sm px-3 py-2
              text-paper font-mono focus:outline-none focus:border-brass"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={handleCopy}
            className={`shrink-0 px-3.5 py-2 text-xs font-semibold rounded-sm transition-colors
              focus-visible:outline-brass cursor-pointer
              ${copied
                ? "bg-emerald-600 text-white"
                : "bg-brass text-ink hover:bg-brass/90"
              }`}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
