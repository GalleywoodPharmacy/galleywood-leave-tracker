import type { BankHolidayBreakdownItem } from "@/lib/business-rules";

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
    <div className="bg-white border border-line rounded-xl p-5 max-w-xs">
      <p className="text-sm text-ink-soft">Bank holiday deductions</p>
      <p className="text-xs text-ink-soft mb-3">{year} — based on your rota</p>

      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">None fall on your working days this year.</p>
      ) : (
        <div className="space-y-1.5 text-sm">
          {items.map((item) => (
            <div key={item.dateKey} className="flex justify-between gap-3">
              <div>
                <div className="text-ink">{item.label}</div>
                <div className="text-[11px] text-ink-soft font-mono">{formatShortDate(item.dateKey)}</div>
              </div>
              <span className="text-declined font-mono whitespace-nowrap">-{item.hours}h</span>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line flex justify-between text-xs font-mono text-ink-soft">
          <span>Total</span>
          <span>-{total}h</span>
        </div>
      )}
    </div>
  );
}