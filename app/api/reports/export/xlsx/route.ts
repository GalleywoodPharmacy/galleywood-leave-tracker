import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireManager } from "@/lib/require-manager";
import { getMonthlyReport } from "@/lib/reports";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "Missing or invalid year/month" }, { status: 400 });
  }

  const report = await getMonthlyReport(year, month);

  const rows = report.map((r) => ({
    Staff: r.name,
    "Rota hours": r.rotaHours,
    "Normal (worked)": r.normalHoursWorked,
    Overtime: r.overtimeHours,
    "Total worked": r.totalHoursWorked,
    "Annual leave": r.annualLeaveHours,
    "Bank holiday": r.bankHolidayHours,
    Sick: r.sickHours,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 16 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const filename = `Galleywood-Report-${MONTH_NAMES[month - 1]}-${year}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}