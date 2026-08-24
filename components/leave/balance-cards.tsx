import { LEAVE_TYPE_LABELS, type LeaveBalance } from "@/lib/leave";

export default function BalanceCards({ balances }: { balances: LeaveBalance[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {balances.map((b) => (
        <div key={b.type} className="bg-white border border-line rounded-xl p-5">
          <p className="text-sm text-ink-soft">{LEAVE_TYPE_LABELS[b.type]}</p>
          <p className="text-2xl font-heading text-header mt-1">
            {b.remainingHours}
            <span className="text-base font-normal text-ink-soft"> h left</span>
          </p>
          <p className="text-sm text-ink-soft">≈ {b.remainingDaysApprox} days</p>

          <div className="mt-3 pt-3 border-t border-line text-xs text-ink-soft space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Allowance</span>
              <span>{b.allowanceHours}h</span>
            </div>
            <div className="flex justify-between">
              <span>Approved</span>
              <span>-{b.approvedHours}h</span>
            </div>
            <div className="flex justify-between">
              <span>Pending</span>
              <span>-{b.pendingHours}h</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
