import type { BankHolidayBreakdownItem } from "@/lib/business-rules";

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 4c1.8-1.2 3.7-1.2 5.5 0s3.7 1.2 5.5 0 3.7-1.2 5.5 0v9c-1.8 1.2-3.7 1.2-5.5 0s-3.7-1.2-5.5 0-3.7 1.2-5.5 0V4z"
      />
    </svg>
  );
}

function formatShortDate(dateKey: string) {
  return new Date(dateKey + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function BankHolidayBreakdown({ items, year }: { items: BankHolidayBreakdownItem[]; year: number }) {
  const total = Math.round(items.reduce((sum, i) => sum + i.hours, 0) * 10) / 10;

  return (
    <div className="bg-white border border-line rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full">
      <div className="flex items-center gap-2">
        <span className="text-declined">
          <FlagIcon />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-soft leading-none">Bank holiday deductions</p>
          <p className="text-xs text-ink-soft/70 mt-1">{year} — based on your rota</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink-soft mt-4">None fall on your working days this year.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {items.map((item) => (
            <div key={item.dateKey} className="flex items-center justify-between gap-3 rounded-lg bg-page px-3 py-2">
              <div className="min-w-0">
                <div className="text-ink truncate">{item.label}</div>
                <div className="text-[11px] text-ink-soft font-mono">{formatShortDate(item.dateKey)}</div>
              </div>
              <span className="text-declined font-mono text-xs bg-declined/10 rounded-full px-2 py-0.5 whitespace-nowrap">
                -{item.hours}h
              </span>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-auto pt-4 border-t border-line flex justify-between text-sm font-medium text-ink">
          <span>Total</span>
          <span className="font-mono text-declined">-{total}h</span>
        </div>
      )}
    </div>
  );
}