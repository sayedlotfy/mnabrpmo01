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

// Reshape Arabic text for correct rendering in jsPDF
// jsPDF doesn't support RTL/Arabic shaping natively, so we reverse the string
// and rely on the Amiri font for correct glyph rendering
function prepareArabicText(text: string): string {
  if (!text) return "";
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  if (!hasArabic) return text;
  // Reverse words (not chars) for RTL display in jsPDF
  return text.split(" ").reverse().join(" ");
}

function fmt(n: number, currency = "SAR") {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`;
}

function fmtAr(n: number, currency = "ر.س") {
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
  doc.text(prepareArabicText(`نظام إدارة مشاريع التصميم | ${new Date().toLocaleDateString("ar-SA")}`), pageW - margin, 17, { align: "right" });
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
