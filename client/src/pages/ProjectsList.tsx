import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAppUser } from "@/contexts/AppUserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Plus, FolderOpen, Globe, LogOut, BarChart3, Calendar, TrendingUp, Bell, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import ThemeToggle from "@/components/ThemeToggle";
import LastUpdatedBanner from "@/components/LastUpdatedBanner";

const LOGO_URL = "https://static-assets.manus.space/files/webdev/design-pmo/logo.png";

const PHASE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  Concept:      { ar: "فكرة",     en: "Concept",      color: "oklch(0.6 0.18 300)" },
  Schematic:    { ar: "مخططات",   en: "Schematic",    color: "oklch(0.55 0.18 260)" },
  DD:           { ar: "تصميم",    en: "Design Dev",   color: "oklch(0.6 0.15 200)" },
  CD:           { ar: "تنفيذي",   en: "Construction", color: "oklch(0.55 0.15 175)" },
  Tender:       { ar: "طرح",      en: "Tender",       color: "oklch(0.65 0.15 60)" },
  Construction: { ar: "تشييد",    en: "Construction", color: "oklch(0.55 0.18 140)" },
};

export default function ProjectsList() {
  const { currentUser, isPortfolioManager, logout } = useAppUser();
  const { lang, toggleLanguage } = useLanguage();
  const [, navigate] = useLocation();
  const isAr = lang === "ar";
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAlerts, setReadAlerts] = useState<Set<number>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  const alerts = (projects || []).reduce((list: { type: "warning" | "error"; message: string; project: string }[], p) => {
    const cpi = Number((p as any).cpi || 1);
    const profit = Number((p as any).profitability || 0);
    if (cpi < 0.8 && cpi > 0) list.push({ type: "error", message: `CPI منخفض: ${cpi.toFixed(2)}`, project: p.name });
    else if (cpi < 0.9 && cpi > 0) list.push({ type: "warning", message: `CPI منخفض: ${cpi.toFixed(2)}`, project: p.name });
    if (profit < 0) list.push({ type: "error", message: isAr ? "تجاوز الميزانية" : "Budget Overrun", project: p.name });
    return list;
  }, []);

  const visibleProjects = isPortfolioManager
    ? projects
    : projects?.filter(p => p.appUserId === currentUser?.id || p.appUserId === null);

  const unreadCount = alerts.filter((_, i) => !readAlerts.has(i)).length;

  return (
    <div className="min-h-screen" dir={isAr ? "rtl" : "ltr"}
      style={{ background: "var(--lg-bg-gradient)", backgroundAttachment: "fixed" }}>

      {/* Last updated banner */}
      <LastUpdatedBanner />

      {/* Header */}
      <header className="lg-header sticky top-8 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Logo" className="h-9 w-9 object-contain drop-shadow"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div>
            <h1 className="font-bold text-sm leading-tight" style={{ color: "var(--lg-header-text)" }}>
              المنابر للاستشارات الهندسية
            </h1>
            <p className="text-xs opacity-50" style={{ color: "var(--lg-header-text)" }}>
              {isAr ? "إدارة محفظة المشاريع" : "Project Portfolio Management"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium opacity-80 hidden sm:block"
            style={{ color: "oklch(0.75 0.15 50)" }}>
            {currentUser?.name}
          </span>

          {isPortfolioManager && (
            <button onClick={() => navigate("/portfolio")}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all opacity-70 hover:opacity-100"
              style={{ color: "var(--lg-header-text)" }}>
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "لوحة المحفظة" : "Portfolio"}</span>
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotifications(v => !v)}
              className="relative flex items-center justify-center w-8 h-8 rounded-xl transition-all"
              style={{
                background: showNotifications ? "oklch(1 0 0 / 20%)" : "oklch(1 0 0 / 8%)",
                border: "1px solid oklch(1 0 0 / 15%)",
              }}
              title={isAr ? "الإشعارات" : "Notifications"}>
              <Bell className="w-4 h-4" style={{ color: "var(--lg-header-text)" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className={`absolute top-11 ${isAr ? "left-0" : "right-0"} w-80 z-50 overflow-hidden lg-dropdown`}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--lg-border)" }}>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                    <Bell className="w-4 h-4 text-amber-500" />
                    {isAr ? "الإشعارات" : "Notifications"}
                    {alerts.length > 0 && (
                      <span className="bg-red-500/15 text-red-500 text-xs px-1.5 py-0.5 rounded-full font-medium">{alerts.length}</span>
                    )}
                  </h3>
                  {alerts.length > 0 && (
                    <button onClick={() => setReadAlerts(new Set(alerts.map((_, i) => i)))}
                      className="text-xs opacity-60 hover:opacity-100 transition-opacity" style={{ color: "var(--primary)" }}>
                      {isAr ? "تعليم الكل" : "Mark all read"}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 opacity-20 mx-auto mb-2" />
                      <p className="text-sm opacity-50">{isAr ? "لا توجد تنبيهات" : "No alerts"}</p>
                    </div>
                  ) : (
                    <div>
                      {alerts.map((a, i) => (
                        <div key={i}
                          onClick={() => setReadAlerts(prev => { const s = new Set(Array.from(prev)); s.add(i); return s; })}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all"
                          style={{
                            background: readAlerts.has(i) ? "transparent" : a.type === "error" ? "oklch(0.6 0.2 20 / 8%)" : "oklch(0.75 0.15 60 / 8%)",
                            borderBottom: "1px solid var(--lg-border)",
                          }}>
                          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.type === "error" ? "text-red-500" : "text-amber-500"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)", opacity: readAlerts.has(i) ? 0.5 : 1 }}>{a.project}</p>
                            <p className="text-xs mt-0.5 opacity-60">{a.message}</p>
                          </div>
                          {!readAlerts.has(i) && (
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === "error" ? "bg-red-500" : "bg-amber-500"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />

          <button onClick={toggleLanguage}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all opacity-60 hover:opacity-100"
            style={{ color: "var(--lg-header-text)" }}>
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? "English" : "عربي"}</span>
          </button>
          <button onClick={logout}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all opacity-60 hover:opacity-100 hover:text-red-400"
            style={{ color: "var(--lg-header-text)" }}>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
              {isAr ? "مشاريعي" : "My Projects"}
            </h2>
            <p className="text-sm mt-0.5 opacity-50">
              {isAr ? `${visibleProjects?.length || 0} مشروع` : `${visibleProjects?.length || 0} projects`}
            </p>
          </div>
          <Link href="/projects/new">
            <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm text-white"
              style={{ background: "var(--primary)" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <Plus className="w-4 h-4" />
              {isAr ? "مشروع جديد" : "New Project"}
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : visibleProjects && visibleProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProjects.map((project) => {
              const completion = Number(project.percentComplete || 0);
              const contractValue = Number(project.totalContractValue || 0);
              const phaseInfo = PHASE_LABELS[project.phase] || { ar: project.phase, en: project.phase, color: "oklch(0.5 0.01 260)" };

              return (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <div className="lg-card p-5 cursor-pointer group">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${phaseInfo.color}20` }}>
                        <FolderOpen className="w-5 h-5" style={{ color: phaseInfo.color }} />
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{
                          background: `${phaseInfo.color}18`,
                          color: phaseInfo.color,
                          border: `1px solid ${phaseInfo.color}30`,
                        }}>
                        {isAr ? phaseInfo.ar : phaseInfo.en}
                      </span>
                    </div>

                    <h3 className="font-bold text-base mb-0.5 group-hover:opacity-80 transition-opacity line-clamp-1"
                      style={{ color: "var(--foreground)" }}>
                      {project.name}
                    </h3>
                    <p className="text-xs mb-4 opacity-40">{project.code}</p>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-50 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {isAr ? "قيمة العقد" : "Contract Value"}
                        </span>
                        <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                          {contractValue > 0 ? `${(contractValue / 1000).toFixed(0)}K ${project.currency}` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-50 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {isAr ? "الإنجاز" : "Completion"}
                        </span>
                        <span className="font-semibold" style={{ color: "var(--foreground)" }}>{completion}%</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full rounded-full h-1.5" style={{ background: "oklch(0.5 0.01 260 / 15%)" }}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, completion)}%`, background: phaseInfo.color }} />
                      </div>
                    </div>

                    {project.manager && (
                      <p className="text-xs mt-3 pt-3 opacity-40" style={{ borderTop: "1px solid var(--lg-border)" }}>
                        {isAr ? "م." : "PM:"} {project.manager}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 lg-card">
              <FolderOpen className="w-8 h-8 opacity-30" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              {isAr ? "لا توجد مشاريع بعد" : "No projects yet"}
            </h3>
            <p className="text-sm opacity-50 mb-6">
              {isAr ? "ابدأ بإنشاء مشروعك الأول" : "Start by creating your first project"}
            </p>
            <Link href="/projects/new">
              <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl text-white"
                style={{ background: "var(--primary)" }}>
                <Plus className="w-4 h-4" />
                {isAr ? "إنشاء مشروع جديد" : "Create New Project"}
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
