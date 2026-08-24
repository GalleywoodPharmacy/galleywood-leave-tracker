import TeamRequestRow, { type TeamRequest } from "./team-request-row";

export default function PendingQueue({ requests }: { requests: TeamRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-5 text-sm text-ink-soft">
        Nothing waiting on approval.
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-soft">
            <th className="px-5 py-3 font-medium">Staff</th>
            <th className="px-5 py-3 font-medium">Dates</th>
            <th className="px-5 py-3 font-medium">Hours</th>
            <th className="px-5 py-3 font-medium">Notes</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r, i) => (
            <TeamRequestRow key={r.id} request={r} zebra={i % 2 === 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
