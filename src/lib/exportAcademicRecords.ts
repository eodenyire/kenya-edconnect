import { toast } from "sonner";
import { format } from "date-fns";

type AcademicRecord = {
  id: string;
  subject: string;
  grade: string;
  term: string;
  year: number;
  points: number;
};

const gradePoints: Record<string, number> = {
  A: 12, "A-": 11, "B+": 10, B: 9, "B-": 8, "C+": 7, C: 6, "C-": 5,
  "D+": 4, D: 3, "D-": 2, E: 1,
};

const GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"];

function getMeanGrade(avg: number): string {
  const idx = 12 - Math.round(avg);
  return GRADES[idx] ?? "—";
}

export function exportToCSV(records: AcademicRecord[]) {
  if (!records.length) {
    toast.error("No records to export");
    return;
  }

  const headers = ["Subject", "Grade", "Points", "Term", "Year"];
  const rows = records.map((r) => [r.subject, r.grade, r.points, r.term, r.year].join(","));
  const avg = Math.round((records.reduce((s, r) => s + r.points, 0) / records.length) * 10) / 10;

  const csv = [
    headers.join(","),
    ...rows,
    "",
    `Average Points,${avg}`,
    `Mean Grade,${getMeanGrade(avg)}`,
    `Total Records,${records.length}`,
    `Export Date,${format(new Date(), "yyyy-MM-dd")}`,
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `academic-records-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV downloaded!");
}

export function exportToPDF(records: AcademicRecord[]) {
  if (!records.length) {
    toast.error("No records to export");
    return;
  }

  const avg = Math.round((records.reduce((s, r) => s + r.points, 0) / records.length) * 10) / 10;
  const meanGrade = getMeanGrade(avg);
  const subjects = new Set(records.map((r) => r.subject)).size;
  const exportDate = format(new Date(), "MMMM d, yyyy");

  // Group records by year and term
  const grouped: Record<string, AcademicRecord[]> = {};
  records.forEach((r) => {
    const key = `${r.year} ${r.term}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const sortedPeriods = Object.keys(grouped).sort();

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Pop-up blocked. Please allow pop-ups for this site.");
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Academic Report - ${exportDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #4361ee; padding-bottom: 20px; }
    .header h1 { font-size: 24px; color: #4361ee; margin-bottom: 4px; }
    .header p { color: #666; font-size: 13px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .stat { background: #f8f9ff; border: 1px solid #e0e4f0; border-radius: 8px; padding: 14px; text-align: center; }
    .stat .value { font-size: 22px; font-weight: 700; color: #4361ee; }
    .stat .label { font-size: 11px; color: #888; margin-top: 2px; }
    .period { margin-bottom: 24px; }
    .period h3 { font-size: 15px; color: #4361ee; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0e4f0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #4361ee; color: white; padding: 8px 12px; text-align: left; font-weight: 600; }
    td { padding: 7px 12px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f8f9ff; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📘 Academic Report</h1>
    <p>Generated on ${exportDate}</p>
  </div>

  <div class="stats">
    <div class="stat"><div class="value">${records.length}</div><div class="label">Total Records</div></div>
    <div class="stat"><div class="value">${avg}</div><div class="label">Average Points</div></div>
    <div class="stat"><div class="value">${meanGrade}</div><div class="label">Mean Grade</div></div>
    <div class="stat"><div class="value">${subjects}</div><div class="label">Subjects</div></div>
  </div>

  ${sortedPeriods.map((period) => `
    <div class="period">
      <h3>${period}</h3>
      <table>
        <thead><tr><th>Subject</th><th>Grade</th><th>Points</th></tr></thead>
        <tbody>
          ${grouped[period].sort((a, b) => a.subject.localeCompare(b.subject)).map((r) => `
            <tr><td>${r.subject}</td><td>${r.grade}</td><td>${r.points}</td></tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `).join("")}

  <div class="footer">DigiStudent Academic Tracker Report</div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  toast.success("PDF report opened — use Print to save as PDF");
}
