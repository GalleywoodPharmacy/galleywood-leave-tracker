"use client";

import { useRouter } from "next/navigation";

export default function SelectableDay({
  dateKey,
  year,
  month,
  selStart,
  selEnd,
  title,
  className,
  children,
}: {
  dateKey: string;
  year: number;
  month: number;
  selStart: string | null;
  selEnd: string | null;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const inRange = !!(selStart && selEnd && dateKey >= selStart && dateKey <= selEnd);
  const isAnchor = dateKey === selStart || dateKey === selEnd;

  function handleClick() {
    let newStart = selStart;
    let newEnd = selEnd;

    if (!selStart) {
      newStart = dateKey;
      newEnd = null;
    } else if (!selEnd) {
      if (dateKey < selStart) {
        newStart = dateKey;
        newEnd = null;
      } else {
        newEnd = dateKey;
      }
    } else {
      newStart = dateKey;
      newEnd = null;
    }

    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));
    if (newStart) params.set("selStart", newStart);
    if (newEnd) params.set("selEnd", newEnd);
    router.push(`/calendar?${params.toString()}`);
  }

  return (
    <div
      onClick={handleClick}
      title={title}
      className={`cursor-pointer ${className ?? ""} ${
        inRange || isAnchor ? "ring-2 ring-inset ring-accent bg-accent/10" : ""
      }`}
    >
      {children}
    </div>
  );
}