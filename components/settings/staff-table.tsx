"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  isManager: boolean;
  allowanceAnnualHours: number;
  allowanceSickHours: number;
  allowanceOtherHours: number;
};

function StaffRow({ member, zebra }: { member: StaffMember; zebra: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annual, setAnnual] = useState(String(member.allowanceAnnualHours));
  const [sick, setSick] = useState(String(member.allowanceSickHours));
  const [other, setOther] = useState(String(member.allowanceOtherHours));
  const [isManager, setIsManager] = useState(member.isManager);

  async function calculateAnnual() {
    setError(null);
    setCalculating(true);
    const res = await fetch(`/api/settings/staff/${member.id}`);
    setCalculating(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't calculate.");
      return;
    }
    setAnnual(String(data.suggestedAnnualHours));
  }

  async function save() {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/settings/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowanceAnnualHours: parseFloat(annual),
        allowanceSickHours: parseFloat(sick),
        allowanceOtherHours: parseFloat(other),
        isManager,
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remove ${member.name}? This deletes their leave history too.`)) return;
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/settings/staff/${member.id}`, { method: "DELETE" });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't remove.");
      return;
    }
    router.refresh();
  }
  return (
    <tr className={zebra ? "bg-card/40" : ""}>
      <td className="px-5 py-3 border-t border-line">
        <div className="font-medium">{member.name}</div>
        <div className="text-xs text-ink-soft">{member.email}</div>
      </td>
      {editing ? (
        <>
          <td className="px-5 py-3 border-t border-line">
            <input value={annual} onChange={(e) => setAnnual(e.target.value)} className="w-16 rounded border border-line px-1.5 py-1 text-xs font-mono" />
            <button
              type="button"
              disabled={calculating}
              onClick={calculateAnnual}
              className="block text-[11px] text-coverage hover:underline mt-0.5 disabled:opacity-60"
            >
              {calculating ? "Calculating…" : "Calculate from rota"}
            </button>
          </td>
          <td className="px-5 py-3 border-t border-line">
            <input value={sick} onChange={(e) => setSick(e.target.value)} className="w-16 rounded border border-line px-1.5 py-1 text-xs font-mono" />
          </td>
          <td className="px-5 py-3 border-t border-line">
            <input value={other} onChange={(e) => setOther(e.target.value)} className="w-16 rounded border border-line px-1.5 py-1 text-xs font-mono" />
          </td>
          <td className="px-5 py-3 border-t border-line">
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={isManager} onChange={(e) => setIsManager(e.target.checked)} />
              Manager
            </label>
          </td>
          <td className="px-5 py-3 border-t border-line text-right space-x-3 text-xs">
            <button disabled={busy} onClick={save} className="text-primary hover:underline disabled:opacity-60">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-ink-soft hover:underline">
              Cancel
            </button>
          </td>
        </>
      ) : (
        <>
          <td className="px-5 py-3 border-t border-line font-mono">{member.allowanceAnnualHours}h</td>
          <td className="px-5 py-3 border-t border-line font-mono">{member.allowanceSickHours}h</td>
          <td className="px-5 py-3 border-t border-line font-mono">{member.allowanceOtherHours}h</td>
          <td className="px-5 py-3 border-t border-line text-xs">{member.isManager ? "Manager" : "Staff"}</td>
          <td className="px-5 py-3 border-t border-line text-right space-x-3 text-xs">
            <button onClick={() => setEditing(true)} className="text-coverage hover:underline">
              Edit
            </button>
            <button disabled={busy} onClick={remove} className="text-declined hover:underline disabled:opacity-60">
              Remove
            </button>
          </td>
        </>
      )}
      {error && (
        <td colSpan={6} className="px-5 pb-2 text-xs text-declined">
          {error}
        </td>
      )}
    </tr>
  );
}

function AddStaffForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/settings/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, isManager }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't add that person.");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setIsManager(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-5 space-y-3 mt-4">
      <h3 className="text-sm font-medium text-ink">Add staff</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <input
          placeholder="Temporary password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm font-mono"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={isManager} onChange={(e) => setIsManager(e.target.checked)} />
        Manager
      </label>
      {error && <p className="text-sm text-declined">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-header disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add staff"}
      </button>
      <p className="text-xs text-ink-soft">Share the temporary password with them directly — they can't reset it themselves yet.</p>
    </form>
  );
}

export default function StaffTable({ staff }: { staff: StaffMember[] }) {
  return (
    <div>
      <div className="bg-white border border-line rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-soft">
              <th className="px-5 py-3 font-medium">Staff</th>
              <th className="px-5 py-3 font-medium">Annual</th>
              <th className="px-5 py-3 font-medium">Sick</th>
              <th className="px-5 py-3 font-medium">Other</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((m, i) => (
              <StaffRow key={m.id} member={m} zebra={i % 2 === 1} />
            ))}
          </tbody>
        </table>
        <p className="text-xs text-ink-soft px-5 py-3 border-t border-line">
          "Calculate from rota" fills in the Annual field using (this person's weekly rota hours × 5.6) minus any
          bank-holiday hours that fall on a day they work this year — set their rota in Staff rotas below first.
          It only fills the box; click Save to apply it.
        </p>
      </div>
      <AddStaffForm />
    </div>
  );
}