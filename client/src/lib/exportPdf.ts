import jsPDF from "jspdf";

const AMIRI_FONT_URL = "https://d2xsxph8kpxj0f.cloudfront.net/87107394/eFfuN9v8AVB9nn8xTmwtHX/Amiri-Regular_a5413d44.ttf";

export interface ProjectReportData {
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

// Cache loaded font
let cachedFontBase64: string | null = null;

async function loadAmiriFont(): Promise<string | null> {
  if (cachedFontBase64) return cachedFontBase64;
  try {
    const response = await fetch(AMIRI_FONT_URL);
    if (!response.ok) throw new Error("Font fetch failed");
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      const chunk = Array.from(bytes.subarray(i, i + chunkSize));
      binary += String.fromCharCode(...chunk);
    }
    cachedFontBase64 = btoa(binary);
    return cachedFontBase64;
  } catch (e) {
    console.warn("Could not load Amiri font:", e);
    return null;
  }
}

// Fix Arabic text for jsPDF: reverse word order for RTL rendering
// Also converts Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) to Latin (0123456789)
function toLatinDigits(str: string): string {
  return str
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660)) // Arabic-Indic
    .replace(/[\u06F0-\u06F9]/g, d => String(d.charCodeAt(0) - 0x06F0)); // Extended Arabic-Indic
}

function prepareArabicText(text: string): string {
  if (!text) return "";
  // Always convert Arabic-Indic digits to Latin first
  const latinized = toLatinDigits(text);
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(latinized);
  if (!hasArabic) return latinized;
  // Split into tokens (words + numbers/symbols), reverse only Arabic word segments
  // Strategy: split by whitespace, reverse the array, rejoin
  // This handles RTL rendering in jsPDF which renders LTR internally
  const words = latinized.split(" ");
  // Reverse only if there are Arabic words (not purely numeric/latin tokens)
  const hasArabicWords = words.some(w => /[\u0600-\u06FF]/.test(w));
  if (!hasArabicWords) return latinized;
  return words.reverse().join(" ");
}

function fmt(n: number, currency = "SAR") {
  // Always use en-US to get Latin digits
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`;
}

function fmtAr(n: number, currency = "\u0631.س") {
  // Always use en-US to get Latin digits (not Arabic-Indic)
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`;
}

export async function exportProjectPDF(data: ProjectReportData) {
  const isAr = data.lang === "ar";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Load and register Arabic font
  const fontBase64 = await loadAmiriFont();
  if (fontBase64) {
    doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
  }

  const arabicFont = fontBase64 ? "Amiri" : "helvetica";
  const latinFont = "helvetica";
  const getFont = () => (isAr ? arabicFont : latinFont);

  // Text helper — handles RTL alignment automatically
  const txt = (
    rawText: string,
    x: number,
    yPos: number,
    size = 9,
    bold = false,
    color: [number, number, number] = [30, 30, 30],
    align: "left" | "right" | "center" = "left"
  ) => {
    const text = isAr ? prepareArabicText(rawText) : rawText;
    doc.setFontSize(size);
    doc.setFont(getFont(), bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, x, yPos, { align });
  };

  const addRect = (x: number, yPos: number, w: number, h: number, r: number, g: number, b: number) => {
    doc.setFillColor(r, g, b);
    doc.rect(x, yPos, w, h, "F");
  };

  const addLine = (x1: number, y1: number, x2: number, y2: number, r = 200, g = 200, b = 200) => {
    doc.setDrawColor(r, g, b);
    doc.line(x1, y1, x2, y2);
  };

  const checkPage = (needed = 20) => {
    if (y + needed > pageH - 16) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // ===== HEADER =====
  addRect(0, 0, pageW, 32, 15, 23, 42);
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(arabicFont, "normal");
  doc.text("Al Mnabr Engineering Consultants", margin, 10);
  doc.text(prepareArabicText("المنابر للاستشارات الهندسية"), pageW - margin, 10, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Design PMO · Project Financial Report", margin, 17);
  doc.text(prepareArabicText(`نظام إدارة مشاريع التصميم | ${new Date().toLocaleDateString("en-US")}`), pageW - margin, 17, { align: "right" });
  // Divider line
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1.5);
  doc.line(0, 32, pageW, 32);
  y = 38;

  // ===== PROJECT TITLE BAND =====
  addRect(margin, y, pageW - 2 * margin, 20, 30, 64, 175);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(arabicFont, "normal");
  if (isAr) {
    doc.text(prepareArabicText(data.projectName), pageW - margin - 4, y + 9, { align: "right" });
    doc.setFontSize(8);
    doc.setTextColor(186, 210, 255);
    doc.text(
      prepareArabicText(`${data.projectCode} | ${data.phase} | ${data.manager || ""}`),
      pageW - margin - 4, y + 16, { align: "right" }
    );
  } else {
    doc.text(data.projectName, margin + 4, y + 9);
    doc.setFontSize(8);
    doc.setTextColor(186, 210, 255);
    doc.text(`${data.projectCode} | ${data.phase} | ${data.manager || ""}`, margin + 4, y + 16);
  }
  y += 26;

  // ===== KPI CARDS =====
  const kpis = isAr
    ? [
        { label: "إجمالي قيمة العقد", value: fmtAr(data.totalContractValue, data.currency) },
        { label: "الأتعاب المعتمدة", value: fmtAr(data.approvedFee, data.currency) },
        { label: "التكلفة الفعلية (AC)", value: fmtAr(data.totalBurn, data.currency) },
        { label: "هامش الربح", value: `${data.profitMargin.toFixed(1)}%`, warn: data.profitMargin < 15 },
        { label: "مؤشر الأداء (CPI)", value: data.cpi > 0 ? data.cpi.toFixed(2) : "—", warn: data.cpi > 0 && data.cpi < 1 },
        { label: "نسبة الإنجاز", value: `${data.percentComplete}%` },
      ]
    : [
        { label: "Contract Value", value: fmt(data.totalContractValue, data.currency) },
        { label: "Approved Fee", value: fmt(data.approvedFee, data.currency) },
        { label: "Actual Cost (AC)", value: fmt(data.totalBurn, data.currency) },
        { label: "Profit Margin", value: `${data.profitMargin.toFixed(1)}%`, warn: data.profitMargin < 15 },
        { label: "CPI", value: data.cpi > 0 ? data.cpi.toFixed(2) : "N/A", warn: data.cpi > 0 && data.cpi < 1 },
        { label: "Completion", value: `${data.percentComplete}%` },
      ];

  const kpiCols = 3;
  const kpiW = (pageW - 2 * margin - (kpiCols - 1) * 2) / kpiCols;
  const kpiH = 17;

  kpis.forEach((kpi, i) => {
    const col = i % kpiCols;
    const row = Math.floor(i / kpiCols);
    const kx = margin + col * (kpiW + 2);
    const ky = y + row * (kpiH + 2);
    addRect(kx, ky, kpiW, kpiH, 248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(kx, ky, kpiW, kpiH, "S");
    // Label
    doc.setFontSize(6.5);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(100, 116, 139);
    if (isAr) {
      doc.text(prepareArabicText(kpi.label), kx + kpiW - 3, ky + 6, { align: "right" });
    } else {
      doc.text(kpi.label, kx + 3, ky + 6);
    }
    // Value
    doc.setFontSize(10);
    const valColor: [number, number, number] = kpi.warn ? [220, 38, 38] : [15, 23, 42];
    doc.setTextColor(...valColor);
    if (isAr) {
      doc.text(kpi.value, kx + kpiW - 3, ky + 13, { align: "right" });
    } else {
      doc.text(kpi.value, kx + 3, ky + 13);
    }
  });
  y += 2 * (kpiH + 2) + 8;

  // ===== PAYMENTS TABLE =====
  checkPage(35);
  addRect(margin, y, pageW - 2 * margin, 9, 30, 41, 59);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont(arabicFont, "normal");
  const paymentsTitle = isAr ? "جدول الدفعات والتدفق النقدي" : "Payments & Cash Flow";
  if (isAr) {
    doc.text(prepareArabicText(paymentsTitle), pageW - margin - 3, y + 6, { align: "right" });
  } else {
    doc.text(paymentsTitle, margin + 3, y + 6);
  }
  y += 11;

  // Column definitions — widths must sum to pageW - 2*margin
  const payCols = isAr
    ? [
        { label: "اسم الدفعة", w: 52 },
        { label: "النوع", w: 22 },
        { label: "القيمة", w: 30 },
        { label: "المحصّل", w: 30 },
        { label: "الحالة", w: 24 },
        { label: "التاريخ", w: 24 },
      ]
    : [
        { label: "Payment Title", w: 52 },
        { label: "Type", w: 22 },
        { label: "Amount", w: 30 },
        { label: "Paid", w: 30 },
        { label: "Status", w: 24 },
        { label: "Date", w: 24 },
      ];

  // Header row
  addRect(margin, y, pageW - 2 * margin, 8, 241, 245, 249);
  let cx = margin + 2;
  payCols.forEach(col => {
    doc.setFontSize(7);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(isAr ? prepareArabicText(col.label) : col.label, cx, y + 5.5);
    cx += col.w;
  });
  y += 9;

  data.payments.forEach((p, i) => {
    checkPage(8);
    if (i % 2 === 0) addRect(margin, y, pageW - 2 * margin, 7, 248, 250, 252);
    cx = margin + 2;
    const rowData = [
      p.title.substring(0, 28),
      p.type,
      isAr ? fmtAr(p.amount, data.currency) : fmt(p.amount, data.currency),
      isAr ? fmtAr(p.paidAmount || 0, data.currency) : fmt(p.paidAmount || 0, data.currency),
      p.status,
      p.date,
    ];
    rowData.forEach((val, vi) => {
      doc.setFontSize(7);
      doc.setFont(arabicFont, "normal");
      doc.setTextColor(30, 41, 59);
      const displayVal = isAr && vi < 2 ? prepareArabicText(val) : val;
      doc.text(displayVal, cx, y + 5);
      cx += payCols[vi].w;
    });
    y += 7;
  });

  // Totals row
  const totalExpected = data.payments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = data.payments.reduce((s, p) => s + (p.paidAmount || 0), 0);
  addRect(margin, y, pageW - 2 * margin, 8, 219, 234, 254);
  doc.setFontSize(8);
  doc.setFont(arabicFont, "normal");
  doc.setTextColor(30, 64, 175);
  const totalLabel = isAr ? "الإجمالي" : "TOTAL";
  doc.text(isAr ? prepareArabicText(totalLabel) : totalLabel, margin + 2, y + 5.5);
  doc.text(isAr ? fmtAr(totalExpected, data.currency) : fmt(totalExpected, data.currency), margin + 76, y + 5.5);
  doc.text(isAr ? fmtAr(totalPaid, data.currency) : fmt(totalPaid, data.currency), margin + 106, y + 5.5);
  y += 12;

  // ===== EXPENSES TABLE =====
  if (data.expenses.length > 0) {
    checkPage(30);
    addRect(margin, y, pageW - 2 * margin, 9, 30, 41, 59);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5);
    doc.setFont(arabicFont, "normal");
    const expTitle = isAr ? "المصروفات الفعلية" : "Actual Expenses";
    if (isAr) {
      doc.text(prepareArabicText(expTitle), pageW - margin - 3, y + 6, { align: "right" });
    } else {
      doc.text(expTitle, margin + 3, y + 6);
    }
    y += 11;

    const expCols = isAr
      ? [
          { label: "الوصف", w: 62 },
          { label: "الفئة", w: 40 },
          { label: "المبلغ", w: 38 },
          { label: "التاريخ", w: 28 },
        ]
      : [
          { label: "Description", w: 62 },
          { label: "Category", w: 40 },
          { label: "Amount", w: 38 },
          { label: "Date", w: 28 },
        ];

    addRect(margin, y, pageW - 2 * margin, 8, 241, 245, 249);
    cx = margin + 2;
    expCols.forEach(col => {
      doc.setFontSize(7);
      doc.setFont(arabicFont, "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(isAr ? prepareArabicText(col.label) : col.label, cx, y + 5.5);
      cx += col.w;
    });
    y += 9;

    data.expenses.forEach((e, i) => {
      checkPage(8);
      if (i % 2 === 0) addRect(margin, y, pageW - 2 * margin, 7, 248, 250, 252);
      cx = margin + 2;
      const rowData = [
        e.description.substring(0, 32),
        e.category,
        isAr ? fmtAr(e.amount, data.currency) : fmt(e.amount, data.currency),
        e.date,
      ];
      rowData.forEach((val, vi) => {
        doc.setFontSize(7);
        doc.setFont(arabicFont, "normal");
        doc.setTextColor(30, 41, 59);
        const displayVal = isAr && vi < 2 ? prepareArabicText(val) : val;
        doc.text(displayVal, cx, y + 5);
        cx += expCols[vi].w;
      });
      y += 7;
    });

    // Expense total
    const totalExp = data.expenses.reduce((s, e) => s + e.amount, 0);
    addRect(margin, y, pageW - 2 * margin, 8, 254, 242, 219);
    doc.setFontSize(8);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(180, 83, 9);
    doc.text(isAr ? prepareArabicText("إجمالي المصروفات") : "Total Expenses", margin + 2, y + 5.5);
    doc.text(isAr ? fmtAr(totalExp, data.currency) : fmt(totalExp, data.currency), margin + 104, y + 5.5);
    y += 12;
  }

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addRect(0, pageH - 11, pageW, 11, 15, 23, 42);
    doc.setFontSize(6.5);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Al Mnabr Engineering Consultants · Design PMO · Confidential", margin, pageH - 4);
    doc.text(
      `${isAr ? "صفحة" : "Page"} ${i} ${isAr ? "من" : "of"} ${totalPages}`,
      pageW - margin, pageH - 4, { align: "right" }
    );
  }

  const fileName = `${data.projectCode}_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

// ============================================================
// Claims & Debts Export Types
// ============================================================
export interface ClaimItem {
  id: number;
  projectId: number;
  projectName: string;
  projectCode: string;
  manager: string;
  currency: string;
  title: string;
  type: string;
  amount: number;
  date: string;
  requirements: string;
  status: string;
}

export interface DebtItem {
  id: number;
  projectId: number;
  projectName: string;
  projectCode: string;
  manager: string;
  currency: string;
  title: string;
  type: string;
  invoicedAmount: number;
  paidAmount: number;
  outstanding: number;
  date: string;
  requirements: string;
  status: string;
}

// ============================================================
// Export Claims PDF
// ============================================================
export async function exportClaimsPDF(
  claims: ClaimItem[],
  totals: { totalClaims: number },
  lang: "ar" | "en"
) {
  const isAr = lang === "ar";
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const fontBase64 = await loadAmiriFont();
  if (fontBase64) {
    doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
  }
  const arabicFont = fontBase64 ? "Amiri" : "helvetica";

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - 16) { doc.addPage(); y = margin; }
  };

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(arabicFont, "normal");
  if (isAr) {
    doc.text(prepareArabicText("المنابر للاستشارات الهندسية"), pageW - margin, 10, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(prepareArabicText(`كشف المطالبات المستحقة الإصدار | ${new Date().toLocaleDateString("en-US")}`), pageW - margin, 18, { align: "right" });
  } else {
    doc.text("Al Mnabr Engineering Consultants", margin, 10);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Claims Pending Finance Issuance | ${new Date().toLocaleDateString("en-US")}`, margin, 18);
  }
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(1.5);
  doc.line(0, 28, pageW, 28);
  y = 34;

  // Summary KPI band
  doc.setFillColor(239, 246, 255);
  doc.rect(margin, y, pageW - 2 * margin, 14, "F");
  doc.setFontSize(8);
  doc.setFont(arabicFont, "normal");
  doc.setTextColor(30, 64, 175);
  const totalLabel = isAr ? `إجمالي المطالبات: ${fmtAr(totals.totalClaims)} | عدد المطالبات: ${claims.length}` : `Total Claims: ${fmt(totals.totalClaims)} | Count: ${claims.length}`;
  if (isAr) {
    doc.text(prepareArabicText(totalLabel), pageW - margin - 4, y + 9, { align: "right" });
  } else {
    doc.text(totalLabel, margin + 4, y + 9);
  }
  y += 18;

  // Table header
  const cols = isAr
    ? [
        { label: "اسم المشروع", w: 55 },
        { label: "الكود", w: 28 },
        { label: "المدير", w: 35 },
        { label: "اسم الدفعة", w: 55 },
        { label: "النوع", w: 22 },
        { label: "القيمة", w: 32 },
        { label: "الحالة", w: 25 },
        { label: "التاريخ", w: 28 },
      ]
    : [
        { label: "Project Name", w: 55 },
        { label: "Code", w: 28 },
        { label: "Manager", w: 35 },
        { label: "Payment Title", w: 55 },
        { label: "Type", w: 22 },
        { label: "Amount", w: 32 },
        { label: "Status", w: 25 },
        { label: "Date", w: 28 },
      ];

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageW - 2 * margin, 9, "F");
  let cx = margin + 2;
  cols.forEach(col => {
    doc.setFontSize(7.5);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(255, 255, 255);
    doc.text(isAr ? prepareArabicText(col.label) : col.label, cx, y + 6);
    cx += col.w;
  });
  y += 10;

  claims.forEach((c, i) => {
    checkPage(8);
    if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y, pageW - 2 * margin, 7.5, "F"); }
    cx = margin + 2;
    const statusColor: [number, number, number] = c.status === "Due" ? [220, 38, 38] : [100, 116, 139];
    const rowData = [
      c.projectName.substring(0, 24),
      c.projectCode,
      (c.manager || "—").substring(0, 16),
      c.title.substring(0, 24),
      c.type,
      fmtAr(c.amount),
      c.status,
      c.date,
    ];
    rowData.forEach((val, vi) => {
      doc.setFontSize(7);
      doc.setFont(arabicFont, "normal");
      if (vi === 6) doc.setTextColor(...statusColor);
      else doc.setTextColor(30, 41, 59);
      const displayVal = isAr && vi < 4 ? prepareArabicText(val) : val;
      doc.text(displayVal, cx, y + 5.5);
      cx += cols[vi].w;
    });
    y += 7.5;
  });

  // Total row
  doc.setFillColor(219, 234, 254);
  doc.rect(margin, y, pageW - 2 * margin, 9, "F");
  doc.setFontSize(8.5);
  doc.setFont(arabicFont, "normal");
  doc.setTextColor(30, 64, 175);
  if (isAr) {
    doc.text(prepareArabicText("الإجمالي"), pageW - margin - 4, y + 6.5, { align: "right" });
    doc.text(fmtAr(totals.totalClaims), margin + cols[0].w + cols[1].w + cols[2].w + cols[3].w + cols[4].w + 2, y + 6.5);
  } else {
    doc.text("TOTAL", margin + 2, y + 6.5);
    doc.text(fmt(totals.totalClaims), margin + cols[0].w + cols[1].w + cols[2].w + cols[3].w + cols[4].w + 2, y + 6.5);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFontSize(6.5);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Al Mnabr Engineering Consultants · Design PMO · Confidential", margin, pageH - 3.5);
    doc.text(`${isAr ? "صفحة" : "Page"} ${i} ${isAr ? "من" : "of"} ${totalPages}`, pageW - margin, pageH - 3.5, { align: "right" });
  }

  doc.save(`Claims_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ============================================================
// Export Debts PDF
// ============================================================
export async function exportDebtsPDF(
  debts: DebtItem[],
  totals: { totalDebts: number; totalInvoiced: number; totalPaid: number },
  lang: "ar" | "en"
) {
  const isAr = lang === "ar";
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const fontBase64 = await loadAmiriFont();
  if (fontBase64) {
    doc.addFileToVFS("Amiri-Regular.ttf", fontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
  }
  const arabicFont = fontBase64 ? "Amiri" : "helvetica";

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - 16) { doc.addPage(); y = margin; }
  };

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(arabicFont, "normal");
  if (isAr) {
    doc.text(prepareArabicText("المنابر للاستشارات الهندسية"), pageW - margin, 10, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(prepareArabicText(`كشف المديونيات - الفواتير غير المسددة | ${new Date().toLocaleDateString("en-US")}`), pageW - margin, 18, { align: "right" });
  } else {
    doc.text("Al Mnabr Engineering Consultants", margin, 10);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Outstanding Debts - Unpaid Invoices | ${new Date().toLocaleDateString("en-US")}`, margin, 18);
  }
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(1.5);
  doc.line(0, 28, pageW, 28);
  y = 34;

  // Summary KPI band - 3 KPIs
  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, pageW - 2 * margin, 16, "F");
  const kpiW = (pageW - 2 * margin) / 3;
  const kpiData = isAr
    ? [
        { label: "إجمالي المفوتر", value: fmtAr(totals.totalInvoiced), color: [30, 41, 59] as [number, number, number] },
        { label: "إجمالي المحصّل", value: fmtAr(totals.totalPaid), color: [5, 150, 105] as [number, number, number] },
        { label: "المتبقي (المديونية)", value: fmtAr(totals.totalDebts), color: [220, 38, 38] as [number, number, number] },
      ]
    : [
        { label: "Total Invoiced", value: fmt(totals.totalInvoiced), color: [30, 41, 59] as [number, number, number] },
        { label: "Total Collected", value: fmt(totals.totalPaid), color: [5, 150, 105] as [number, number, number] },
        { label: "Outstanding", value: fmt(totals.totalDebts), color: [220, 38, 38] as [number, number, number] },
      ];
  kpiData.forEach((kpi, i) => {
    const kx = margin + i * kpiW;
    doc.setFontSize(7);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(100, 116, 139);
    if (isAr) {
      doc.text(prepareArabicText(kpi.label), kx + kpiW - 4, y + 6, { align: "right" });
    } else {
      doc.text(kpi.label, kx + 4, y + 6);
    }
    doc.setFontSize(10);
    doc.setTextColor(...kpi.color);
    if (isAr) {
      doc.text(kpi.value, kx + kpiW - 4, y + 13, { align: "right" });
    } else {
      doc.text(kpi.value, kx + 4, y + 13);
    }
  });
  y += 20;

  // Table header
  const cols = isAr
    ? [
        { label: "اسم المشروع", w: 48 },
        { label: "الكود", w: 25 },
        { label: "المدير", w: 32 },
        { label: "اسم الفاتورة", w: 48 },
        { label: "النوع", w: 20 },
        { label: "قيمة الفاتورة", w: 32 },
        { label: "المحصّل", w: 30 },
        { label: "المتبقي", w: 30 },
        { label: "الحالة", w: 22 },
        { label: "التاريخ", w: 25 },
      ]
    : [
        { label: "Project Name", w: 48 },
        { label: "Code", w: 25 },
        { label: "Manager", w: 32 },
        { label: "Invoice Title", w: 48 },
        { label: "Type", w: 20 },
        { label: "Invoiced", w: 32 },
        { label: "Paid", w: 30 },
        { label: "Outstanding", w: 30 },
        { label: "Status", w: 22 },
        { label: "Date", w: 25 },
      ];

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageW - 2 * margin, 9, "F");
  let cx = margin + 2;
  cols.forEach(col => {
    doc.setFontSize(7);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(255, 255, 255);
    doc.text(isAr ? prepareArabicText(col.label) : col.label, cx, y + 6);
    cx += col.w;
  });
  y += 10;

  debts.forEach((d, i) => {
    checkPage(8);
    if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y, pageW - 2 * margin, 7.5, "F"); }
    cx = margin + 2;
    const statusColor: [number, number, number] = d.status === "Invoiced" ? [220, 38, 38] : d.status === "Claimed" ? [245, 158, 11] : [59, 130, 246];
    const rowData = [
      d.projectName.substring(0, 22),
      d.projectCode,
      (d.manager || "—").substring(0, 14),
      d.title.substring(0, 22),
      d.type,
      fmtAr(d.invoicedAmount),
      fmtAr(d.paidAmount),
      fmtAr(d.outstanding),
      d.status,
      d.date,
    ];
    rowData.forEach((val, vi) => {
      doc.setFontSize(7);
      doc.setFont(arabicFont, "normal");
      if (vi === 8) doc.setTextColor(...statusColor);
      else if (vi === 7) doc.setTextColor(220, 38, 38);
      else doc.setTextColor(30, 41, 59);
      const displayVal = isAr && vi < 4 ? prepareArabicText(val) : val;
      doc.text(displayVal, cx, y + 5.5);
      cx += cols[vi].w;
    });
    y += 7.5;
  });

  // Total row
  doc.setFillColor(254, 226, 226);
  doc.rect(margin, y, pageW - 2 * margin, 9, "F");
  doc.setFontSize(8.5);
  doc.setFont(arabicFont, "normal");
  doc.setTextColor(185, 28, 28);
  const baseX = margin + cols[0].w + cols[1].w + cols[2].w + cols[3].w + cols[4].w + 2;
  if (isAr) {
    doc.text(prepareArabicText("الإجمالي"), pageW - margin - 4, y + 6.5, { align: "right" });
  } else {
    doc.text("TOTAL", margin + 2, y + 6.5);
  }
  doc.setTextColor(30, 41, 59);
  doc.text(fmtAr(totals.totalInvoiced), baseX, y + 6.5);
  doc.setTextColor(5, 150, 105);
  doc.text(fmtAr(totals.totalPaid), baseX + cols[5].w, y + 6.5);
  doc.setTextColor(220, 38, 38);
  doc.text(fmtAr(totals.totalDebts), baseX + cols[5].w + cols[6].w, y + 6.5);

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFontSize(6.5);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Al Mnabr Engineering Consultants · Design PMO · Confidential", margin, pageH - 3.5);
    doc.text(`${isAr ? "صفحة" : "Page"} ${i} ${isAr ? "من" : "of"} ${totalPages}`, pageW - margin, pageH - 3.5, { align: "right" });
  }

  doc.save(`Debts_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ============================================================
// Export Claims Excel
// ============================================================
export async function exportClaimsExcel(claims: ClaimItem[], totals: { totalClaims: number }, lang: "ar" | "en") {
  const isAr = lang === "ar";
  const XLSX = await import("xlsx");

  const headers = isAr
    ? ["اسم المشروع", "الكود", "المدير", "اسم الدفعة", "النوع", "القيمة (ر.س)", "الحالة", "التاريخ", "المتطلبات"]
    : ["Project Name", "Code", "Manager", "Payment Title", "Type", "Amount (SAR)", "Status", "Date", "Requirements"];

  const rows = claims.map(c => [
    c.projectName,
    c.projectCode,
    c.manager || "",
    c.title,
    c.type,
    c.amount,
    c.status,
    c.date,
    c.requirements || "",
  ]);

  // Total row
  rows.push([
    isAr ? "الإجمالي" : "TOTAL",
    "", "", "", "",
    totals.totalClaims,
    "", "", "",
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isAr ? "المطالبات" : "Claims");
  XLSX.writeFile(wb, `Claims_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ============================================================
// Export Debts Excel
// ============================================================
export async function exportDebtsExcel(debts: DebtItem[], totals: { totalDebts: number; totalInvoiced: number; totalPaid: number }, lang: "ar" | "en") {
  const isAr = lang === "ar";
  const XLSX = await import("xlsx");

  const headers = isAr
    ? ["اسم المشروع", "الكود", "المدير", "اسم الفاتورة", "النوع", "قيمة الفاتورة", "المحصّل", "المتبقي", "الحالة", "التاريخ", "المتطلبات"]
    : ["Project Name", "Code", "Manager", "Invoice Title", "Type", "Invoiced Amount", "Paid", "Outstanding", "Status", "Date", "Requirements"];

  const rows = debts.map(d => [
    d.projectName,
    d.projectCode,
    d.manager || "",
    d.title,
    d.type,
    d.invoicedAmount,
    d.paidAmount,
    d.outstanding,
    d.status,
    d.date,
    d.requirements || "",
  ]);

  // Total row
  rows.push([
    isAr ? "الإجمالي" : "TOTAL",
    "", "", "", "",
    totals.totalInvoiced,
    totals.totalPaid,
    totals.totalDebts,
    "", "", "",
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isAr ? "المديونيات" : "Debts");
  XLSX.writeFile(wb, `Debts_${new Date().toISOString().split("T")[0]}.xlsx`);
}
