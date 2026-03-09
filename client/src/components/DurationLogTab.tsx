/**
 * DurationLogTab - تاب سجل المدة
 * يعرض:
 * 1. مؤشرات الأيام (إجمالي العقد، المستهلك، المتبقي، أيام التوقف)
 * 2. نافذة إيقاف/استئناف مع إلزامية تدوين السبب
 * 3. جدول سجل الأحداث (توقف/استئناف) مع التاريخ الهجري والميلادي
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
  CheckCircle2, XCircle, Info, Loader2, Trash2
} from "lucide-react";

// ---- Working Days Calculator (client-side) ----
// أيام العمل: الأحد (0) إلى الخميس (4)
// مستثنى: الجمعة (5) والسبت (6) والإجازات الرسمية السعودية

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

const HOLIDAY_SET = new Set<string>(
  Object.values(SAUDI_HOLIDAYS).flat()
);

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSaudiWorkingDay(date: Date): boolean {
  const day = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
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

// ---- Hijri Date Formatter ----
function toHijriDate(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA-u-ca-islamic' : 'en-SA-u-ca-islamic', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function toGregorianDate(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// ---- Props ----
interface DurationLogTabProps {
  projectId: number;
  startDate: string;
  endDate: string;
  stoppageDays: number;
  isPaused: boolean;
  pauseStartDate: string | null;
  isPortfolioManager: boolean;
}

export default function DurationLogTab({
  projectId,
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
    onError: (err) => {
      setReasonError(err.message);
    }
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
    // If currently paused, add open period
    if (isPaused && pauseStartDate) {
      periods.push({ pauseDate: pauseStartDate, resumeDate: null });
    }
    return periods;
  }, [events, isPaused, pauseStartDate]);

  const totalContractDays = useMemo(() =>
    countWorkingDays(startDate, endDate),
    [startDate, endDate]
  );

  const consumedDays = useMemo(() =>
    countConsumedWorkingDays(startDate, today, pausePeriods),
    [startDate, today, pausePeriods]
  );

  const totalPausedDays = useMemo(() => {
    let total = 0;
    for (const p of pausePeriods) {
      total += countWorkingDays(p.pauseDate, p.resumeDate ?? today);
    }
    return total;
  }, [pausePeriods, today]);

  const remainingDays = Math.max(0, totalContractDays - consumedDays);
  const consumedPct = totalContractDays > 0 ? (consumedDays / totalContractDays) * 100 : 0;
  const stoppageCount = pausePeriods.length;

  // ---- Handlers ----
  const handleTogglePause = () => {
    setReason("");
    setReasonError("");
    setShowReasonModal(true);
  };

  const handleConfirm = () => {
    if (reason.trim().length < 5) {
      setReasonError(t.reasonRequired);
      return;
    }
    togglePause.mutate({
      projectId,
      reason: reason.trim(),
      recordedBy: currentUser?.name || "مجهول",
      today,
    });
  };

  // ---- Progress bar color ----
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
        {/* Total Contract Days */}
        <Card className="lg-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5" style={{ color: "var(--primary)" }} />
          </div>
          <div className="text-3xl font-mono font-bold" style={{ color: "var(--foreground)" }}>
            {totalContractDays}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {t.totalContractDays}
          </div>
        </Card>

        {/* Consumed Days */}
        <Card className="lg-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5" style={{ color: "#f97316" }} />
          </div>
          <div className="text-3xl font-mono font-bold" style={{ color: "#f97316" }}>
            {consumedDays}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {t.consumedDays}
          </div>
        </Card>

        {/* Remaining Days */}
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
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {t.remainingDays}
          </div>
        </Card>

        {/* Paused Days */}
        <Card className="lg-card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Pause className="w-5 h-5" style={{ color: "#a855f7" }} />
          </div>
          <div className="text-3xl font-mono font-bold" style={{ color: "#a855f7" }}>
            {totalPausedDays}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {t.pausedDays}
          </div>
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

      {/* ---- Project Status + Pause/Resume Button ---- */}
      <Card className="lg-card p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
      </Card>

      {/* ---- Reason Modal ---- */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--lg-modal-bg)", border: "1px solid var(--lg-glass-border)" }}>
            {/* Modal Header */}
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

            {/* Date Display */}
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

            {/* Reason Input */}
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

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowReasonModal(false); setReason(""); setReasonError(""); }}
                disabled={togglePause.isPending}
              >
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
              const isPauseEvent = ev.eventType === "pause";
              const color = isPauseEvent ? "#ef4444" : "#22c55e";
              const bgColor = isPauseEvent ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";
              const borderColor = isPauseEvent ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)";

              return (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${color}22` }}>
                    {isPauseEvent
                      ? <Pause className="w-4 h-4" style={{ color }} />
                      : <Play className="w-4 h-4" style={{ color }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-medium text-sm" style={{ color }}>
                        {isPauseEvent ? t.eventPause : t.eventResume}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span>{toGregorianDate(ev.eventDate, lang)}</span>
                          <span className="mx-1 opacity-50">|</span>
                          <span>{toHijriDate(ev.eventDate, lang)}</span>
                        </div>
                        {isPortfolioManager && (
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
