import type { LeaveBalance } from "@/lib/leave";

export default function BalanceCards({ balance }: { balance: LeaveBalance }) {
  return (
    <div className="max-w-xs">
      <div className="bg-white border border-line rounded-xl p-5">
        <p className="text-sm text-ink-soft">Annual leave</p>
        <p className="text-2xl font-heading text-header mt-1">
          {balance.remainingHours}
          <span className="text-base font-normal text-ink-soft"> h left</span>
        </p>
        <p className="text-sm text-ink-soft">≈ {balance.remainingDaysApprox} days</p>

        <div className="mt-3 pt-3 border-t border-line text-xs text-ink-soft space-y-1 font-mono">
          <div className="flex justify-between">
            <span>Allowance</span>
            <span>{balance.allowanceHours}h</span>
          </div>
          <div className="flex justify-between">
            <span>Approved</span>
            <span>-{balance.approvedHours}h</span>
          </div>
          <div className="flex justify-between">
            <span>Pending</span>
            <span>-{balance.pendingHours}h</span>
          </div>
        </div>
      </div>
    </div>
  );
}