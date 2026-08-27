import type { LeaveBalance } from "@/lib/leave";

type StaffBalance = {
  user: { id: string; name: string; email: string; isManager: boolean };
  balance: LeaveBalance;
};

export default function TeamBalanceTable({ staffBalances }: { staffBalances: StaffBalance[] }) {
  return (
    <div className="bg-white border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-soft">
            <th className="px-5 py-3 font-medium">Staff</th>
            <th className="px-5 py-3 font-medium">Annual leave</th>
          </tr>
        </thead>
        <tbody>
          {staffBalances.map(({ user, balance }, i) => (
            <tr key={user.id} className={i % 2 === 1 ? "bg-card/40" : ""}>
              <td className="px-5 py-3 border-t border-line">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-ink-soft">{user.isManager ? "Manager" : "Staff"}</div>
              </td>
              <td className="px-5 py-3 border-t border-line font-mono">
                {balance.remainingHours}h
                <span className="text-ink-soft"> / {balance.allowanceHours}h</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}