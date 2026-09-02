import type { OpenSickLeave } from "@/lib/reports";

function fmt(dateKey: string) {
  return new Date(dateKey + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OpenSickLeaveBanner({ items }: { items: OpenSickLeave[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm space-y-2">
      <p className="font-medium text-ink">
        {items.length === 1 ? "1 sick leave entry still" : `${items.length} sick leave entries still`} needs an end
        date confirmed
      </p>
      <p className="text-ink-soft text-xs">
        Until these are edited with a real end date, any days they should cover beyond the placeholder date won't be
        counted — this can make normal hours look artificially high for the people below.
      </p>
      <ul className="text-ink-soft text-xs space-y-0.5">
        {items.map((item) => (
          <li key={item.requestId}>
            {item.name} — started {fmt(item.startDate)}
          </li>
        ))}
      </ul>
    </div>
  );
}