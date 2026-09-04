"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminOrg = {
  id: string;
  name: string;
  createdAt: string;
  userCount: number;
  firstManagerEmail: string | null;
};

export default function OrganizationsList({
  organizations,
  currentOrgId,
}: {
  organizations: AdminOrg[];
  currentOrgId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setError(null);
    setBusyId(id);
    const res = await fetch(`/api/admin/organizations/${id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmId(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't delete that.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="bg-white border border-line rounded-xl divide-y divide-line">
        {organizations.length === 0 && <p className="px-5 py-4 text-sm text-ink-soft">No businesses yet.</p>}
        {organizations.map((org) => (
          <div key={org.id} className="flex items-center justify-between px-5 py-3 text-sm gap-3">
            <div className="min-w-0">
              <div className="font-medium text-ink truncate">
                {org.name}
                {org.id === currentOrgId && <span className="ml-2 text-xs text-ink-soft">(yours)</span>}
              </div>
              <div className="text-xs text-ink-soft truncate">
                {org.userCount} staff · created {new Date(org.createdAt).toLocaleDateString("en-GB")}
                {org.firstManagerEmail && ` · ${org.firstManagerEmail}`}
              </div>
            </div>
            {org.id !== currentOrgId &&
              (confirmId === org.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-declined">Delete permanently?</span>
                  <button
                    disabled={busyId === org.id}
                    onClick={() => handleDelete(org.id)}
                    className="text-xs text-white bg-declined rounded px-2 py-1 disabled:opacity-60"
                  >
                    {busyId === org.id ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button onClick={() => setConfirmId(null)} className="text-xs text-ink-soft hover:underline">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(org.id)} className="text-xs text-declined hover:underline shrink-0">
                  Delete
                </button>
              ))}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-declined">{error}</p>}
    </div>
  );
}