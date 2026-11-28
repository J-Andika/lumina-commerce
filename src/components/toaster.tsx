"use client";

import { useStore } from "@/components/store-provider";

export function Toaster() {
  const { toasts, dismissToast } = useStore();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-4 border border-hairline bg-surface px-4 py-3 text-sm shadow-lg"
        >
          <span>{toast.message}</span>
          <div className="flex items-center gap-3">
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action?.run();
                  dismissToast(toast.id);
                }}
                className="font-mono text-[11px] tracking-widest text-accent uppercase hover:underline"
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-muted hover:text-foreground"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
