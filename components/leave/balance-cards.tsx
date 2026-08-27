import type { LeaveBalance } from "@/lib/leave";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export default function BalanceCards({ balance }: { balance: LeaveBalance }) {
  const grossAllowance = balance.allowanceHours + balance.bankHolidayHours;
  const percentRemaining =
    balance.allowanceHours > 0
      ? Math.max(0, Math.min(100, Math.round((balance.remainingHours / balance.allowanceHours) * 100)))
      : 0;

  return (
    <div className="bg-white border border-line rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full">
      <div className="flex items-center gap-2">
        <span className="text-primary">
          <CalendarIcon />
        </span>
        <p className="text-sm font-medium text-ink-soft">Annual leave</p>
      </div>

      <p className="text-3xl font-heading text-header mt-3">
        {balance.remainingHours}
        <span className="text-base font-normal text-ink-soft"> h left</span>
      </p>
      <p className="text-sm text-ink-soft">≈ {balance.remainingDaysApprox} days</p>

      <div className="mt-3 h-2 rounded-full bg-card overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all"
          style={{ width: `${percentRemaining}%` }}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-line text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-ink-soft">Allowance</span>
          <span className="font-mono text-ink">{grossAllowance}h</span>
        </div>
        {balance.bankHolidayHours > 0 && (
          <div className="flex justify-between">
            <span className="text-ink-soft">Bank holidays</span>
            <span className="font-mono text-declined">-{balance.bankHolidayHours}h</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-ink-soft">Approved</span>
          <span className="font-mono text-primary">-{balance.approvedHours}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-soft">Pending</span>
          <span className="font-mono text-pending">-{balance.pendingHours}h</span>
        </div>
      </div>

      <a href="#request-leave" className="mt-auto pt-4 text-sm font-medium text-primary hover:text-header transition-colors">
        Request leave →
      </a>
    </div>
  );
}