import jsPDF from "jspdf";

interface ProjectReportData {
  projectName: string;
  projectCode: string;
  manager?: string | null;
  phase: string;
  currency: string;
  startDate: string;
  endDate: string;
  percentComplete: number;
  totalContractValue: number;
  approvedFee: number;
  totalBurn: number;
  remainingBudget: number;
  profitMargin: number;
  cpi: number;
  earnedValue: number;
  plannedValue: number;
  payments: Array<{
    title: string;
    type: string;
    amount: number;
    status: string;
    date: string;
    paidAmount?: number;
  }>;
  expenses: Array<{
    description: string;
    category: string;
    amount: number;
    date: string;
  }>;
  lang: "ar" | "en";
}

function fmt(n: number, currency = "SAR") {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`;
}

export async function exportProjectPDF(data: ProjectReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const isAr = data.lang === "ar";
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Helper functions
  const addLine = (text: string, x: number, yPos: number, size = 10, bold = false, color = [30, 30, 30] as [number, number, number]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, x, yPos);
  };

  const addRect = (x: number, yPos: number, w: number, h: number, r: number, g: number, b: number) => {
    doc.setFillColor(r, g, b);
    doc.rect(x, yPos, w, h, "F");
  };

  const checkPage = (needed = 20) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // ---- Header ----
  addRect(0, 0, pageW, 28, 15, 23, 42);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Al Mnabr Engineering Consultants", margin, 11);
  doc.text("\u0627\u0644\u0645\u0646\u0627\u0628\u0631 \u0644\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u0647\u0646\u062f\u0633\u064a\u0629", pageW - margin, 11, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Design PMO · Project Financial Report", margin, 19);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, pageW - margin, 19, { align: "right" });
  y = 35;

  // ---- Project Title ----
  addRect(margin, y, pageW - 2 * margin, 16, 59, 130, 246);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(data.projectName, margin + 4, y + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.projectCode} | ${data.phase} | ${data.manager || ""}`, margin + 4, y + 13);
  y += 22;

  // ---- KPI Row ----
  const kpis = [
    { label: "Contract Value", value: fmt(data.totalContractValue, data.currency) },
    { label: "Approved Fee", value: fmt(data.approvedFee, data.currency) },
    { label: "Actual Cost (AC)", value: fmt(data.totalBurn, data.currency) },
    { label: "Profit Margin", value: `${data.profitMargin.toFixed(1)}%` },
    { label: "CPI", value: data.cpi > 0 ? data.cpi.toFixed(2) : "N/A" },
    { label: "Completion", value: `${data.percentComplete}%` },
  ];

  const kpiW = (pageW - 2 * margin) / 3;
  const kpiH = 16;
  kpis.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const kx = margin + col * kpiW;
    const ky = y + row * (kpiH + 2);
    const isGood = kpi.label === "CPI" ? parseFloat(kpi.value) >= 1 : kpi.label === "Profit Margin" ? parseFloat(kpi.value) >= 15 : true;
    addRect(kx, ky, kpiW - 2, kpiH, 248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(kx, ky, kpiW - 2, kpiH, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kx + 3, ky + 5);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const valColor: [number, number, number] = (kpi.label === "CPI" || kpi.label === "Profit Margin") && !isGood ? [220, 38, 38] : [15, 23, 42];
    doc.setTextColor(...valColor);
    doc.text(kpi.value, kx + 3, ky + 12);
  });
  y += 2 * (kpiH + 2) + 8;

  // ---- Payments Table ----
  checkPage(30);
  addRect(margin, y, pageW - 2 * margin, 8, 30, 41, 59);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Payments & Cash Flow", margin + 3, y + 5.5);
  y += 10;

  // Table header
  const cols = [
    { label: "Payment Title", w: 60 },
    { label: "Type", w: 20 },
    { label: "Amount", w: 30 },
    { label: "Paid", w: 30 },
    { label: "Status", w: 25 },
    { label: "Date", w: 25 },
  ];

  addRect(margin, y, pageW - 2 * margin, 7, 241, 245, 249);
  let cx = margin + 2;
  cols.forEach(col => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(col.label, cx, y + 5);
    cx += col.w;
  });
  y += 8;

  data.payments.forEach((p, i) => {
    checkPage(8);
    if (i % 2 === 0) addRect(margin, y, pageW - 2 * margin, 7, 248, 250, 252);
    cx = margin + 2;
    const rowData = [
      p.title.substring(0, 30),
      p.type,
      fmt(p.amount, data.currency),
      fmt(p.paidAmount || 0, data.currency),
      p.status,
      p.date,
    ];
    rowData.forEach((val, vi) => {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(val, cx, y + 5);
      cx += cols[vi].w;
    });
    y += 7;
  });

  // Total row
  const totalExpected = data.payments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = data.payments.reduce((s, p) => s + (p.paidAmount || 0), 0);
  addRect(margin, y, pageW - 2 * margin, 7, 219, 234, 254);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("TOTAL", margin + 2, y + 5);
  doc.text(fmt(totalExpected, data.currency), margin + 82, y + 5);
  doc.text(fmt(totalPaid, data.currency), margin + 112, y + 5);
  y += 10;

  // ---- Expenses Table ----
  if (data.expenses.length > 0) {
    checkPage(30);
    addRect(margin, y, pageW - 2 * margin, 8, 30, 41, 59);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Actual Expenses", margin + 3, y + 5.5);
    y += 10;

    const expCols = [
      { label: "Description", w: 70 },
      { label: "Category", w: 40 },
      { label: "Amount", w: 40 },
      { label: "Date", w: 30 },
    ];

    addRect(margin, y, pageW - 2 * margin, 7, 241, 245, 249);
    cx = margin + 2;
    expCols.forEach(col => {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(col.label, cx, y + 5);
      cx += col.w;
    });
    y += 8;

    data.expenses.forEach((e, i) => {
      checkPage(8);
      if (i % 2 === 0) addRect(margin, y, pageW - 2 * margin, 7, 248, 250, 252);
      cx = margin + 2;
      const rowData = [e.description.substring(0, 35), e.category, fmt(e.amount, data.currency), e.date];
      rowData.forEach((val, vi) => {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        doc.text(val, cx, y + 5);
        cx += expCols[vi].w;
      });
      y += 7;
    });
  }

  // ---- Footer ----
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addRect(0, pageH - 10, pageW, 10, 15, 23, 42);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Al Mnabr Engineering Consultants · Design PMO · Confidential", margin, pageH - 4);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 4, { align: "right" });
  }

  // Save
  const fileName = `${data.projectCode}_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
