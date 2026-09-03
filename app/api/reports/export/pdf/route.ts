import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { requireManager } from "@/lib/require-manager";
import { getMonthlyReport, type MonthlyStaffReport } from "@/lib/reports";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COLUMNS = ["Staff", "Rota hours", "Normal (worked)", "Overtime", "Total worked", "Annual leave", "Bank holiday", "Sick"];
const COL_WIDTHS = [150, 75, 95, 70, 85, 75, 75, 60];
const START_X = 40;
const PAGE_BOTTOM = 500;

function buildPdfBuffer(report: MonthlyStaffReport[], monthLabel: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text(`Galleywood Pharmacy — Report: ${monthLabel}`);
    doc.moveDown();

    let y = doc.y;

    function drawHeader() {
      let x = START_X;
      doc.fontSize(10).font("Helvetica-Bold");
      COLUMNS.forEach((col, i) => {
        doc.text(col, x, y, { width: COL_WIDTHS[i] });
        x += COL_WIDTHS[i];
      });
      y += 18;
      doc.moveTo(START_X, y).lineTo(x, y).stroke();
      y += 6;
      doc.font("Helvetica");
    }

    drawHeader();

    for (const r of report) {
      if (y > PAGE_BOTTOM) {
        doc.addPage();
        y = 40;
        drawHeader();
      }
      let x = START_X;
      const values = [
        r.name,
        `${r.rotaHours}h`,
        `${r.normalHoursWorked}h`,
        `${r.overtimeHours}h`,
        `${r.totalHoursWorked}h`,
        `${r.annualLeaveHours}h`,
        `${r.bankHolidayHours}h`,
        `${r.sickHours}h`,
      ];
      values.forEach((v, i) => {
        doc.text(String(v), x, y, { width: COL_WIDTHS[i] });
        x += COL_WIDTHS[i];
      });
      y += 18;
    }

    if (report.length === 0) {
      doc.text("No staff to report on yet.", START_X, y);
    }

    doc.end();
  });
}

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
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const buffer = await buildPdfBuffer(report, monthLabel);

  const filename = `Galleywood-Report-${MONTH_NAMES[month - 1]}-${year}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}