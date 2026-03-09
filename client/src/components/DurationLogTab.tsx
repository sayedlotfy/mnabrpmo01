/**
 * DurationLogTab - تاب سجل المدة
 * يعرض:
 * 1. مؤشرات الأيام (إجمالي العقد، المستهلك، المتبقي، أيام التوقف)
 * 2. نافذة إيقاف/استئناف مع إلزامية تدوين السبب
 * 3. زر تمديد تاريخ الانتهاء تلقائياً بأيام التوقف
 * 4. زر تصدير سجل المدة في PDF
 * 5. جدول سجل الأحداث (توقف/استئناف/تمديد) مع التاريخ الهجري والميلادي
 *
 * أيام العمل: الأحد - الخميس
 * مستثنى: الإجازات الرسمية والأعياد الوطنية السعودية
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppUser } from "@/contexts/AppUserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Pause, Play, Calendar, Clock, AlertTriangle,
  CheckCircle2, XCircle, Info, Loader2, Trash2,
  CalendarPlus, FileDown, ArrowRight
} from "lucide-react";

// ---- Working Days Calculator (client-side) ----
const SAUDI_HOLIDAYS: Record<string, string[]> = {
  "2024": [
    "2024-02-22",
    "2024-04-09","2024-04-10","2024-04-11","2024-04-12","2024-04-13",
    "2024-06-15","2024-06-16","2024-06-17","2024-06-18","2024-06-19",
    "2024-09-23",
  ],
  "2025": [
    "2025-02-22",
    "2025-03-30","2025-03-31","2025-04-01","2025-04-02","2025-04-03",
    "2025-06-05","2025-06-06","2025-06-07","2025-06-08","2025-06-09",
    "2025-09-23",
  ],
  "2026": [
    "2026-02-22",
    "2026-03-20","2026-03-21","2026-03-22","2026-03-23","2026-03-24",
    "2026-05-26","2026-05-27","2026-05-28","2026-05-29","2026-05-30",
    "2026-09-23",
  ],
  "2027": [
    "2027-02-22",
    "2027-03-09","2027-03-10","2027-03-11","2027-03-12","2027-03-13",
    "2027-05-15","2027-05-16","2027-05-17","2027-05-18","2027-05-19",
    "2027-09-23",
  ],
};

const HOLIDAY_SET = new Set<string>(Object.values(SAUDI_HOLIDAYS).flat());

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSaudiWorkingDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 5 || day === 6) return false;
  return !HOLIDAY_SET.has(toISODate(date));
}

function countWorkingDays(startStr: string, endStr: string): number {
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (isSaudiWorkingDay(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function countConsumedWorkingDays(
  startStr: string,
  todayStr: string,
  pausePeriods: Array<{ pauseDate: string; resumeDate: string | null }>
): number {
  const start = new Date(startStr + "T00:00:00");
  const today = new Date(todayStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(today.getTime()) || start > today) return 0;
  const pauses = pausePeriods.map(p => ({
    from: new Date(p.pauseDate + "T00:00:00"),
    to: p.resumeDate ? new Date(p.resumeDate + "T00:00:00") : new Date(today),
  }));
  let count = 0;
  const cur = new Date(start);
  while (cur <= today) {
    if (isSaudiWorkingDay(cur)) {
      const isPaused = pauses.some(p => cur >= p.from && cur <= p.to);
      if (!isPaused) count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function addWorkingDaysClient(startStr: string, days: number): string {
  if (days <= 0) return startStr;
  const cur = new Date(startStr + "T00:00:00");
  if (isNaN(cur.getTime())) return startStr;
  let added = 0;
  while (added < days) {
    cur.setDate(cur.getDate() + 1);
    if (isSaudiWorkingDay(cur)) added++;
  }
  return toISODate(cur);
}

// ---- Hijri/Gregorian Formatters ----
function toHijriDate(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA-u-ca-islamic' : 'en-SA-u-ca-islamic', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return dateStr; }
}

function toGregorianDate(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    // Always use en-US for PDF to ensure Latin digits
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return dateStr; }
}

// ---- PDF Export ----
async function exportDurationLogPDF(opts: {
  projectName: string;
  projectCode: string;
  startDate: string;
  endDate: string;
  totalContractDays: number;
  consumedDays: number;
  remainingDays: number;
  totalPausedDays: number;
  stoppageCount: number;
  events: Array<{ eventType: string; eventDate: string; reason: string; recordedBy?: string | null }>;
  lang: string;
}) {
  const { default: jsPDF } = await import("jspdf");
  const isAr = opts.lang === "ar";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Load Amiri font
  let arabicFont = "helvetica";
  try {
    const AMIRI_URL = "https://d2xsxph8kpxj0f.cloudfront.net/87107394/eFfuN9v8AVB9nn8xTmwtHX/Amiri-Regular_a5413d44.ttf";
    const resp = await fetch(AMIRI_URL);
    if (resp.ok) {
      const buf = await resp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.byteLength; i += 8192) {
        bin += String.fromCharCode(...Array.from(bytes.subarray(i, i + 8192)));
      }
      const b64 = btoa(bin);
      doc.addFileToVFS("Amiri-Regular.ttf", b64);
      doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
      arabicFont = "Amiri";
    }
  } catch { /* use helvetica fallback */ }

  const prep = (text: string) => {
    if (!text) return "";
    const hasAr = /[\u0600-\u06FF]/.test(text);
    if (!hasAr) return text;
    return text.split(" ").reverse().join(" ");
  };

  const txt = (raw: string, x: number, yPos: number, size = 9, bold = false,
    color: [number,number,number] = [30,30,30], align: "left"|"right"|"center" = "left") => {
    const text = isAr ? prep(raw) : raw;
    doc.setFontSize(size);
    doc.setFont(arabicFont, bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, x, yPos, { align });
  };

  const checkPage = (needed = 20) => {
    if (y + needed > pageH - 16) { doc.addPage(); y = margin; }
  };

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 28, "F");
  txt(isAr ? "المنابر للاستشارات الهندسية" : "Al Mnabr Engineering Consultants",
    pageW / 2, 10, 12, true, [255,255,255], "center");
  txt(isAr ? "سجل الجدول الزمني والمدة" : "Timeline & Duration Log",
    pageW / 2, 18, 9, false, [148,163,184], "center");
  y = 36;

  // Project Info
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageW - margin * 2, 22, "F");
  txt(isAr ? `المشروع: ${opts.projectName}` : `Project: ${opts.projectName}`,
    margin + 4, y + 8, 10, true, [15,23,42]);
  txt(isAr ? `الكود: ${opts.projectCode}` : `Code: ${opts.projectCode}`,
    margin + 4, y + 15, 8, false, [71,85,105]);
  txt(isAr ? `تاريخ التقرير: ${new Date().toLocaleDateString('en-US')}` : `Report Date: ${new Date().toLocaleDateString('en-US')}`,
    pageW - margin - 4, y + 8, 8, false, [71,85,105], "right");
  y += 28;

  // Summary Cards
  txt(isAr ? "ملخص المدة" : "Duration Summary", margin, y, 11, true, [15,23,42]);
  y += 7;
  const cardW = (pageW - margin * 2 - 9) / 4;
  const cards = [
    { label: isAr ? "أيام العقد" : "Contract Days", value: String(opts.totalContractDays), color: [59,130,246] as [number,number,number] },
    { label: isAr ? "المستهلك" : "Consumed", value: String(opts.consumedDays), color: [249,115,22] as [number,number,number] },
    { label: isAr ? "المتبقي" : "Remaining", value: String(opts.remainingDays), color: [34,197,94] as [number,number,number] },
    { label: isAr ? "أيام التوقف" : "Paused Days", value: String(opts.totalPausedDays), color: [168,85,247] as [number,number,number] },
  ];
  cards.forEach((c, i) => {
    const cx = margin + i * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, y, cardW, 20, 2, 2, "F");
    doc.setFillColor(...c.color);
    doc.rect(cx, y, 3, 20, "F");
    doc.setFontSize(14);
    doc.setFont(arabicFont, "bold");
    doc.setTextColor(...c.color);
    doc.text(c.value, cx + cardW / 2 + 1.5, y + 11, { align: "center" });
    doc.setFontSize(7);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + cardW / 2 + 1.5, y + 17, { align: "center" });
  });
  y += 26;

  // Events Table
  checkPage(30);
  txt(isAr ? "سجل الأحداث" : "Events Log", margin, y, 11, true, [15,23,42]);
  y += 7;

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, pageW - margin * 2, 8, "F");
  const cols = isAr
    ? ["السبب", "المسجّل", "التاريخ الهجري", "التاريخ الميلادي", "الحدث"]
    : ["Event", "Gregorian Date", "Hijri Date", "Recorded By", "Reason"];
  const colW = (pageW - margin * 2) / 5;
  cols.forEach((col, i) => {
    txt(col, margin + i * colW + colW / 2, y + 5.5, 7, true, [255,255,255], "center");
  });
  y += 8;

  // Start event
  doc.setFillColor(240, 253, 244);
  doc.rect(margin, y, pageW - margin * 2, 9, "F");
  const startRow = isAr
    ? ["بداية المشروع", "-", toHijriDate(opts.startDate, opts.lang), toGregorianDate(opts.startDate, opts.lang), "بداية"]
    : ["Start", toGregorianDate(opts.startDate, opts.lang), toHijriDate(opts.startDate, opts.lang), "-", "Project Start"];
  startRow.forEach((cell, i) => {
    txt(cell, margin + i * colW + colW / 2, y + 6, 7, false, [22,163,74], "center");
  });
  y += 9;

  // Events
  opts.events.forEach((ev, idx) => {
    checkPage(10);
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, y, pageW - margin * 2, 9, "F");
    const eventLabel = ev.eventType === "pause"
      ? (isAr ? "إيقاف" : "Pause")
      : ev.eventType === "resume"
        ? (isAr ? "استئناف" : "Resume")
        : (isAr ? "تمديد" : "Extension");
    const eventColor: [number,number,number] = ev.eventType === "pause" ? [239,68,68] : ev.eventType === "resume" ? [34,197,94] : [59,130,246];
    const row = isAr
      ? [ev.reason?.substring(0, 30) || "-", ev.recordedBy || "-", toHijriDate(ev.eventDate, opts.lang), toGregorianDate(ev.eventDate, opts.lang), eventLabel]
      : [eventLabel, toGregorianDate(ev.eventDate, opts.lang), toHijriDate(ev.eventDate, opts.lang), ev.recordedBy || "-", ev.reason?.substring(0, 30) || "-"];
    row.forEach((cell, i) => {
      const color: [number,number,number] = i === (isAr ? 4 : 0) ? eventColor : [51,65,85];
      txt(cell, margin + i * colW + colW / 2, y + 6, 6.5, i === (isAr ? 4 : 0), color, "center");
    });
    y += 9;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageH - 11, pageW, 11, "F");
    doc.setFontSize(6.5);
    doc.setFont(arabicFont, "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Al Mnabr Engineering Consultants · Design PMO · Confidential", margin, pageH - 4);
    doc.text(`${isAr ? "صفحة" : "Page"} ${i} ${isAr ? "من" : "of"} ${totalPages}`, pageW - margin, pageH - 4, { align: "right" });
  }

  doc.save(`${opts.projectCode}_DurationLog_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ---- Props ----
interface DurationLogTabProps {
  projectId: number;
  projectName?: string;
  projectCode?: string;
  startDate: string;
  endDate: string;
  stoppageDays: number;
  isPaused: boolean;
  pauseStartDate: string | null;
  isPortfolioManager: boolean;
}

export default function DurationLogTab({
  projectId,
  projectName = "",
  projectCode = "",
  startDate,
  endDate,
  stoppageDays,
  isPaused,
  pauseStartDate,
  isPortfolioManager,
}: DurationLogTabProps) {
  const { t, lang, isRTL } = useLanguage();
  const { currentUser } = useAppUser();
  const utils = trpc.useUtils();

  // ---- State ----
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [showExtendConfirm, setShowExtendConfirm] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // ---- Queries ----
  const { data: events = [], isLoading: eventsLoading } = trpc.projectEvents.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );

  // ---- Mutations ----
  const togglePause = trpc.projectEvents.togglePause.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId });
      utils.projectEvents.list.invalidate({ projectId });
      setShowReasonModal(false);
      setReason("");
      setReasonError("");
    },
    onError: (err) => { setReasonError(err.message); }
  });

  const extendEndDate = trpc.projectEvents.extendEndDate.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId });
      utils.projectEvents.list.invalidate({ projectId });
      setShowExtendConfirm(false);
    },
  });

  const deleteEvent = trpc.projectEvents.delete.useMutation({
    onSuccess: () => utils.projectEvents.list.invalidate({ projectId }),
  });

  // ---- Working Days Calculations ----
  const today = toISODate(new Date());

  const pausePeriods = useMemo(() => {
    const periods: Array<{ pauseDate: string; resumeDate: string | null }> = [];
    let currentPause: string | null = null;
    for (const ev of events) {
      if (ev.eventType === "pause") {
        currentPause = ev.eventDate;
      } else if (ev.eventType === "resume" && currentPause) {
        periods.push({ pauseDate: currentPause, resumeDate: ev.eventDate });
        currentPause = null;
      }
    }
    if (isPaused && pauseStartDate) {
      periods.push({ pauseDate: pauseStartDate, resumeDate: null });
    }
    return periods;
  }, [events, isPaused, pauseStartDate]);

  const totalContractDays = useMemo(() => countWorkingDays(startDate, endDate), [startDate, endDate]);
  const consumedDays = useMemo(() => countConsumedWorkingDays(startDate, today, pausePeriods), [startDate, today, pausePeriods]);
  const totalPausedDays = useMemo(() => {
    let total = 0;
    for (const p of pausePeriods) total += countWorkingDays(p.pauseDate, p.resumeDate ?? today);
    return total;
  }, [pausePeriods, today]);

  const remainingDays = Math.max(0, totalContractDays - consumedDays);
  const consumedPct = totalContractDays > 0 ? (consumedDays / totalContractDays) * 100 : 0;
  const stoppageCount = pausePeriods.length;

  // Preview new end date if extended
  const projectedNewEndDate = totalPausedDays > 0 ? addWorkingDaysClient(endDate, totalPausedDays) : endDate;

  // ---- Handlers ----
  const handleTogglePause = () => { setReason(""); setReasonError(""); setShowReasonModal(true); };

  const handleConfirm = () => {
    if (reason.trim().length < 5) { setReasonError(t.reasonRequired); return; }
    togglePause.mutate({ projectId, reason: reason.trim(), recordedBy: currentUser?.name || "مجهول", today });
  };

  const handleExtend = () => {
    extendEndDate.mutate({
      projectId,
      pausedDays: totalPausedDays,
      currentEndDate: endDate,
      recordedBy: currentUser?.name || "مجهول",
      today,
    });
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportDurationLogPDF({
        projectName,
        projectCode,
        startDate,
        endDate,
        totalContractDays,
        consumedDays,
        remainingDays,
        totalPausedDays,
        stoppageCount,
        events,
        lang,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const progressColor = consumedPct >= 90 ? "#ef4444" : consumedPct >= 70 ? "#f97316" : "#22c55e";

  return (
    <div className="space-y-6">
      {/* ---- Header Note ---- */}
      <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
        style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)", color: "var(--muted-foreground)" }}>
        <Info className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
        <span>{t.workingDaysNote}</span>
      </div>

      {/* ---- Duration Summary Cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="lg-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5" style={{ color: "var(--primary)" }} />
          </div>
          <div className="text-3xl font-mono font-bold" style={{ color: "var(--foreground)" }}>{totalContractDays}</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{t.totalContractDays}</div>
        </Card>

        <Card className="lg-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5" style={{ color: "#f97316" }} />
          </div>
          <div className="text-3xl font-mono font-bold" style={{ color: "#f97316" }}>{consumedDays}</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{t.consumedDays}</div>
        </Card>

        <Card className="lg-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            {remainingDays <= 10
              ? <AlertTriangle className="w-5 h-5" style={{ color: "#ef4444" }} />
              : <CheckCircle2 className="w-5 h-5" style={{ color: "#22c55e" }} />
            }
          </div>
          <div className="text-3xl font-mono font-bold"
            style={{ color: remainingDays <= 10 ? "#ef4444" : remainingDays <= 30 ? "#f97316" : "#22c55e" }}>
            {remainingDays}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{t.remainingDays}</div>
        </Card>

        <Card className="lg-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Pause className="w-5 h-5" style={{ color: "#a855f7" }} />
          </div>
          <div className="text-3xl font-mono font-bold" style={{ color: "#a855f7" }}>{totalPausedDays}</div>
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{t.pausedDays}</div>
        </Card>
      </div>

      {/* ---- Progress Bar ---- */}
      <Card className="lg-card p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {t.consumedDays} / {t.totalContractDays}
          </span>
          <span className="text-sm font-mono font-bold" style={{ color: progressColor }}>
            {consumedPct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden"
          style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, consumedPct)}%`, background: progressColor }} />
        </div>
        <div className="flex justify-between mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span>{startDate}</span>
          <span>{t.stoppageCount}: {stoppageCount}</span>
          <span>{endDate}</span>
        </div>
      </Card>

      {/* ---- Project Status + Pause/Resume + Extend + Export ---- */}
      <Card className="lg-card p-4">
        <div className="flex flex-col gap-4">
          {/* Status + Pause button */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: isPaused ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)" }}>
                {isPaused
                  ? <XCircle className="w-5 h-5" style={{ color: "#ef4444" }} />
                  : <CheckCircle2 className="w-5 h-5" style={{ color: "#22c55e" }} />
                }
              </div>
              <div>
                <div className="font-semibold" style={{ color: "var(--foreground)" }}>
                  {isPaused ? t.currentlyPaused : t.currentlyActive}
                </div>
                {isPaused && pauseStartDate && (
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {t.pausedSince} {toGregorianDate(pauseStartDate, lang)}
                    <span className="mx-1 opacity-50">|</span>
                    {toHijriDate(pauseStartDate, lang)}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant={isPaused ? "default" : "destructive"}
              className="gap-2"
              onClick={handleTogglePause}
              disabled={togglePause.isPending}
            >
              {togglePause.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : isPaused
                  ? <><Play className="w-4 h-4" />{t.resumeProject}</>
                  : <><Pause className="w-4 h-4" />{t.pauseProject}</>
              }
            </Button>
          </div>

          {/* Extend End Date + Export PDF */}
          <div className="flex flex-wrap gap-3 pt-3"
            style={{ borderTop: "1px solid var(--lg-border)" }}>
            {/* Extend button — only if there are paused days */}
            {totalPausedDays > 0 && isPortfolioManager && (
              <Button
                variant="outline"
                className="gap-2 text-sm"
                onClick={() => setShowExtendConfirm(true)}
                disabled={extendEndDate.isPending}
                style={{ borderColor: "var(--lg-glass-border)" }}
              >
                {extendEndDate.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CalendarPlus className="w-4 h-4" style={{ color: "#3b82f6" }} />
                }
                <span>
                  {lang === "ar"
                    ? `تمديد تاريخ الانتهاء (+${totalPausedDays} يوم)`
                    : `Extend End Date (+${totalPausedDays} days)`
                  }
                </span>
              </Button>
            )}

            {/* Export PDF */}
            <Button
              variant="outline"
              className="gap-2 text-sm"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              style={{ borderColor: "var(--lg-glass-border)" }}
            >
              {isExportingPdf
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <FileDown className="w-4 h-4" style={{ color: "#22c55e" }} />
              }
              <span>{lang === "ar" ? "تصدير السجل PDF" : "Export Log PDF"}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ---- Extend Confirm Modal ---- */}
      {showExtendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--lg-modal-bg)", border: "1px solid var(--lg-glass-border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.15)" }}>
                <CalendarPlus className="w-5 h-5" style={{ color: "#3b82f6" }} />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
                  {lang === "ar" ? "تمديد تاريخ الانتهاء" : "Extend End Date"}
                </h3>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {lang === "ar"
                    ? "سيتم تمديد تاريخ الانتهاء تلقائياً بعدد أيام التوقف المتراكمة"
                    : "End date will be extended by the total paused working days"
                  }
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl mb-4 space-y-2"
              style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)" }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  {lang === "ar" ? "أيام التوقف المتراكمة:" : "Total Paused Days:"}
                </span>
                <span className="font-bold" style={{ color: "#a855f7" }}>{totalPausedDays} {lang === "ar" ? "يوم عمل" : "working days"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  {lang === "ar" ? "تاريخ الانتهاء الحالي:" : "Current End Date:"}
                </span>
                <span className="font-medium" style={{ color: "var(--foreground)" }}>{endDate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  {lang === "ar" ? "تاريخ الانتهاء الجديد:" : "New End Date:"}
                </span>
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
                  <span className="font-bold" style={{ color: "#3b82f6" }}>{projectedNewEndDate}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1"
                onClick={() => setShowExtendConfirm(false)}
                disabled={extendEndDate.isPending}>
                {t.cancel}
              </Button>
              <Button className="flex-1 gap-2" onClick={handleExtend}
                disabled={extendEndDate.isPending}
                style={{ background: "#3b82f6" }}>
                {extendEndDate.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CalendarPlus className="w-4 h-4" />
                }
                {lang === "ar" ? "تأكيد التمديد" : "Confirm Extension"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Reason Modal ---- */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--lg-modal-bg)", border: "1px solid var(--lg-glass-border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: isPaused ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
                {isPaused
                  ? <Play className="w-5 h-5" style={{ color: "#22c55e" }} />
                  : <Pause className="w-5 h-5" style={{ color: "#ef4444" }} />
                }
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>
                  {isPaused ? t.resumeConfirmTitle : t.pauseConfirmTitle}
                </h3>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {isPaused ? t.resumeConfirmDesc : t.pauseConfirmDesc}
                </p>
              </div>
            </div>

            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)" }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>{t.gregorianDate ?? "الميلادي"}:</span>
                <span className="font-medium" style={{ color: "var(--foreground)" }}>{toGregorianDate(today, lang)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span style={{ color: "var(--muted-foreground)" }}>{t.hijriDate ?? "الهجري"}:</span>
                <span className="font-medium" style={{ color: "var(--foreground)" }}>{toHijriDate(today, lang)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
                {isPaused ? t.resumeReason : t.pauseReason}
                <span className="text-red-500 mr-1">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
                placeholder={isPaused ? t.resumeReasonPlaceholder : t.pauseReasonPlaceholder}
                rows={3}
                className="w-full rounded-xl p-3 text-sm resize-none outline-none focus:ring-2"
                style={{
                  background: "var(--lg-glass-bg)",
                  border: reasonError ? "1px solid #ef4444" : "1px solid var(--lg-glass-border)",
                  color: "var(--foreground)",
                  direction: isRTL ? "rtl" : "ltr",
                }}
                autoFocus
              />
              {reasonError && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{reasonError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1"
                onClick={() => { setShowReasonModal(false); setReason(""); setReasonError(""); }}
                disabled={togglePause.isPending}>
                {t.cancel}
              </Button>
              <Button
                variant={isPaused ? "default" : "destructive"}
                className="flex-1"
                onClick={handleConfirm}
                disabled={togglePause.isPending || reason.trim().length < 5}
              >
                {togglePause.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : isPaused ? t.confirmResume : t.confirmPause
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Events Log Table ---- */}
      <Card className="lg-card p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Clock className="w-5 h-5" style={{ color: "var(--primary)" }} />
          {t.durationLog}
        </h3>

        {eventsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{t.noEvents}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Start event (synthetic) */}
            <div className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(34,197,94,0.15)" }}>
                <Play className="w-4 h-4" style={{ color: "#22c55e" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-medium text-sm" style={{ color: "#22c55e" }}>
                    {lang === 'ar' ? 'بداية المشروع' : 'Project Started'}
                  </span>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span>{toGregorianDate(startDate, lang)}</span>
                    <span className="mx-1 opacity-50">|</span>
                    <span>{toHijriDate(startDate, lang)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actual events */}
            {events.map((ev) => {
              const isExtension = ev.eventType === "extension";
              const isPauseEv = ev.eventType === "pause";
              const color = isExtension ? "#3b82f6" : isPauseEv ? "#ef4444" : "#22c55e";
              const bgColor = isExtension ? "rgba(59,130,246,0.08)" : isPauseEv ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";
              const borderColor = isExtension ? "rgba(59,130,246,0.2)" : isPauseEv ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)";
              const Icon = isExtension ? CalendarPlus : isPauseEv ? Pause : Play;
              const label = isExtension
                ? (lang === 'ar' ? 'تمديد تاريخ الانتهاء' : 'End Date Extended')
                : isPauseEv ? t.eventPause : t.eventResume;

              return (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${color}22` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-medium text-sm" style={{ color }}>
                        {label}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span>{toGregorianDate(ev.eventDate, lang)}</span>
                          <span className="mx-1 opacity-50">|</span>
                          <span>{toHijriDate(ev.eventDate, lang)}</span>
                        </div>
                        {isPortfolioManager && !isExtension && (
                          <button
                            onClick={() => deleteEvent.mutate({ id: ev.id })}
                            className="opacity-40 hover:opacity-100 transition-opacity"
                            title={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                          </button>
                        )}
                      </div>
                    </div>
                    {ev.reason && (
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        {ev.reason}
                      </p>
                    )}
                    {ev.recordedBy && (
                      <p className="text-xs mt-0.5 opacity-60" style={{ color: "var(--muted-foreground)" }}>
                        {t.recordedBy}: {ev.recordedBy}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Currently paused indicator */}
            {isPaused && (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-pulse"
                  style={{ background: "rgba(168,85,247,0.15)" }}>
                  <Pause className="w-4 h-4" style={{ color: "#a855f7" }} />
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: "#a855f7" }}>
                    {t.currentlyPaused}
                  </span>
                  {pauseStartDate && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {t.pausedSince} {toGregorianDate(pauseStartDate, lang)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
