"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type StaffRotaItem = {
  userId: string;
  name: string;
  rota: { sun: number; mon: number; tue: number; wed: number; thu: number; fri: number; sat: number };
  isCustom: boolean;
};

const DAYS: { key: keyof StaffRotaItem["rota"]; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

function RotaRow({ item, zebra }: { item: StaffRotaItem; zebra: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState(item.rota);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setError(null);
    setSaved(false);
    setBusy(true);
    const res = await fetch(`/api/settings/rota/${item.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const total = DAYS.reduce((sum, d) => sum + (values[d.key] || 0), 0);

  return (
    <tr className={zebra ? "bg-card/40" : ""}>
      <td className="px-5 py-3 border-t border-line">
        <div className="font-medium">{item.name}</div>
        {!item.isCustom && <div className="text-[11px] text-ink-soft">using pharmacy default</div>}
      </td>
      {DAYS.map((d) => (
        <td key={d.key} className="px-2 py-3 border-t border-line">
          <input
            type="number"
            step="0.5"
            min="0"
            value={values[d.key]}
            onChange={(e) => setValues((v) => ({ ...v, [d.key]: parseFloat(e.target.value) || 0 }))}
            className="w-14 rounded border border-line px-1.5 py-1 text-xs font-mono text-center"
          />
        </td>
      ))}
      <td className="px-3 py-3 border-t border-line font-mono text-xs text-ink-soft">{total}h/wk</td>
      <td className="px-5 py-3 border-t border-line text-right">
        <button
          disabled={busy}
          onClick={save}
          className="text-xs text-primary hover:underline disabled:opacity-60"
        >
          {busy ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
        {error && <p className="text-xs text-declined mt-1">{error}</p>}
      </td>
    </tr>
  );
}

export default function RotaManager({ staffRotas }: { staffRotas: StaffRotaItem[] }) {
  return (
    <div className="bg-white border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-soft">
            <th className="px-5 py-3 font-medium">Staff</th>
            {DAYS.map((d) => (
              <th key={d.key} className="px-2 py-3 font-medium text-center">
                {d.label}
              </th>
            ))}
            <th className="px-3 py-3 font-medium">Total</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {staffRotas.map((item, i) => (
            <RotaRow key={item.userId} item={item} zebra={i % 2 === 1} />
          ))}
        </tbody>
      </table>
      <p className="text-xs text-ink-soft px-5 py-3 border-t border-line">
        Hours here are what gets deducted from that person's leave balance for each day they take off — 0 on a day
        they don't work, less on a short day. Closed days (Sundays, bank holidays, extra closures) always deduct 0,
        regardless of what's set here.
      </p>
    </div>
  );
}