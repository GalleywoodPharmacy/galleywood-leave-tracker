"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function ClockButton({ openShift }: { openShift: { id: string; clockInAt: string } | null }) {
  const router = useRouter();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClock(action: "in" | "out") {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location — can't clock in/out here.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const res = await fetch("/api/clock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });
        setBusy(false);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Couldn't clock you in/out.");
          return;
        }
        showToast(action === "in" ? "Clocked in" : "Clocked out");
        router.refresh();
      },
      (geoError) => {
        setBusy(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("Location access was denied — you'll need to allow it to clock in/out.");
        } else {
          setError("Couldn't get your location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 text-center">
      {openShift ? (
        <>
          <p className="text-sm text-ink-soft mb-1">Clocked in since</p>
          <p className="text-2xl font-mono text-primary mb-4">{fmtTime(openShift.clockInAt)}</p>
          <button
            disabled={busy}
            onClick={() => handleClock("out")}
            className="rounded-xl bg-declined text-white text-lg font-medium px-8 py-4 hover:opacity-90 disabled:opacity-60 w-full"
          >
            {busy ? "Getting your location…" : "Clock out"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-soft mb-4">You're not clocked in</p>
          <button
            disabled={busy}
            onClick={() => handleClock("in")}
            className="rounded-xl bg-primary text-white text-lg font-medium px-8 py-4 hover:bg-header disabled:opacity-60 w-full"
          >
            {busy ? "Getting your location…" : "Clock in"}
          </button>
        </>
      )}
      {error && <p className="text-sm text-declined mt-3">{error}</p>}
      <p className="text-xs text-ink-soft mt-4">
        Uses your device's location to confirm you're at the workplace — your browser will ask permission the
        first time.
      </p>
    </div>
  );
}