"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type StaffAllowance = { year: number; hours: number };

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  isManager: boolean;
  startDate: string | null;
  allowances: StaffAllowance[];
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StaffRow({ member, years, zebra }: { member: StaffMember; years: number[]; zebra: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(member.isManager);
  const [email, setEmail] = useState(member.email);
  const [newPassword, setNewPassword] = useState("");
  const [startDate, setStartDate] = useState(member.startDate ?? "");

  async function save() {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/settings/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isManager,
        email,
        startDate,
        ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}),
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setNewPassword("");
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
    <>
      <tr className={zebra ? "bg-card/40" : ""}>
        <td className="px-5 py-3 border-t border-line">
          <div className="font-medium">{member.name}</div>
          <div className="text-xs text-ink-soft">{member.email}</div>
          {member.startDate && <div className="text-[11px] text-ink-soft">Started {formatDate(member.startDate)}</div>}
        </td>
        {member.allowances.map((a) => (
          <td key={a.year} className="px-5 py-3 border-t border-line font-mono">
            {a.hours}h
          </td>
        ))}
        <td className="px-5 py-3 border-t border-line text-xs">{member.isManager ? "Manager" : "Staff"}</td>
        <td className="px-5 py-3 border-t border-line text-right space-x-3 text-xs">
          {editing ? (
            <span className="text-ink-soft">Editing below ↓</span>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="text-coverage hover:underline">
                Edit
              </button>
              <button disabled={busy} onClick={remove} className="text-declined hover:underline disabled:opacity-60">
                Remove
              </button>
            </>
          )}
        </td>
      </tr>

      {editing && (
        <tr className={zebra ? "bg-card/40" : ""}>
          <td colSpan={years.length + 3} className="px-5 py-4 border-t border-line bg-page/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-soft mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-soft mb-1">New password (leave blank to keep current)</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-sm font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-soft mb-1">Start date (for pro-rating their first year)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-sm font-mono bg-white"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={isManager} onChange={(e) => setIsManager(e.target.checked)} />
                  Manager
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-declined mt-3">{error}</p>}

            <div className="flex gap-3 mt-3">
              <button
                disabled={busy}
                onClick={save}
                className="rounded-lg bg-primary text-white text-sm px-4 py-1.5 hover:bg-header disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setNewPassword("");
                  setEmail(member.email);
                  setStartDate(member.startDate ?? "");
                }}
                className="rounded-lg border border-line text-sm px-4 py-1.5 hover:bg-card"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AddStaffForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/settings/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, isManager, startDate: startDate || undefined }),
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
    setStartDate("");
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
      <div>
        <label className="block text-xs text-ink-soft mb-1">Start date (optional — pro-rates their first year automatically)</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
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

export default function StaffTable({ staff, years }: { staff: StaffMember[]; years: number[] }) {
  return (
    <div>
      <div className="bg-white border border-line rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-soft">
              <th className="px-5 py-3 font-medium">Staff</th>
              {years.map((y) => (
                <th key={y} className="px-5 py-3 font-medium font-mono">
                  {y}
                </th>
              ))}
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((m, i) => (
              <StaffRow key={m.id} member={m} years={years} zebra={i % 2 === 1} />
            ))}
          </tbody>
        </table>
        <p className="text-xs text-ink-soft px-5 py-3 border-t border-line">
          Annual leave for each year is calculated automatically from that person's rota (Staff rotas below) and
          that year's bank holidays — set their rota and their allowance keeps itself up to date. If someone joins
          partway through a year, set their Start date (via Edit, or when adding them) and that year's figure is
          pro-rated automatically; every year after is a full entitlement.
        </p>
      </div>
      <AddStaffForm />
    </div>
  );
}