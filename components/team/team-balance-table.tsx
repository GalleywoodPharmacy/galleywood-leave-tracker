import { LEAVE_TYPE_LABELS } from "@/lib/leave";
import type { LeaveBalance } from "@/lib/leave";

type StaffBalance = {
  user: { id: string; name: string; email: string; isManager: boolean };
  balances: LeaveBalance[];
};

export default function TeamBalanceTable({ staffBalances }: { staffBalances: StaffBalance[] }) {
  return (
    <div className="bg-white border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-soft">
            <th className="px-5 py-3 font-medium">Staff</th>
            {(["annual", "sick", "other"] as const).map((t) => (
              <th key={t} className="px-5 py-3 font-medium">
                {LEAVE_TYPE_LABELS[t]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staffBalances.map(({ user, balances }, i) => (
            <tr key={user.id} className={i % 2 === 1 ? "bg-card/40" : ""}>
              <td className="px-5 py-3 border-t border-line">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-ink-soft">{user.isManager ? "Manager" : "Staff"}</div>
              </td>
              {balances.map((b) => (
                <td key={b.type} className="px-5 py-3 border-t border-line font-mono">
                  {b.remainingHours}h
                  <span className="text-ink-soft"> / {b.allowanceHours}h</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
