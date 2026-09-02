"use client";

export default function ReportPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-card"
    >
      Print
    </button>
  );
}