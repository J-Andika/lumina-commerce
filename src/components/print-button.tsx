"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print border border-hairline px-4 py-2 font-mono text-[11px] tracking-widest text-muted uppercase transition-colors hover:text-foreground"
    >
      Print / save PDF
    </button>
  );
}
