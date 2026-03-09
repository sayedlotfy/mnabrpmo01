import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAppUser } from "@/contexts/AppUserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Plus, FolderOpen, Globe, LogOut, BarChart3, Calendar, TrendingUp, Bell, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";

const LOGO_URL = "https://static-assets.manus.space/files/webdev/design-pmo/logo.png";

const PHASE_COLORS: Record<string, string> = {
  Concept: "bg-purple-100 text-purple-700",
  Schematic: "bg-blue-100 text-blue-700",
  DD: "bg-cyan-100 text-cyan-700",
  CD: "bg-teal-100 text-teal-700",
  Tender: "bg-amber-100 text-amber-700",
  Construction: "bg-green-100 text-green-700",
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

  // Build alerts from project data
  const alerts = (projects || []).reduce((list: { type: "warning" | "error"; message: string; project: string }[], p) => {
    const cpi = Number((p as any).cpi || 1);
    const profit = Number((p as any).profitability || 0);
    if (cpi < 0.8 && cpi > 0) list.push({ type: "error", message: `CPI منخفض: ${cpi.toFixed(2)}`, project: p.name });
    else if (cpi < 0.9 && cpi > 0) list.push({ type: "warning", message: `CPI منخفض: ${cpi.toFixed(2)}`, project: p.name });
    if (profit < 0) list.push({ type: "error", message: isAr ? "تجاوز الميزانية" : "Budget Overrun", project: p.name });
    return list;
  }, []);

  // Filter: portfolio manager sees all, project manager sees only their own
  const visibleProjects = isPortfolioManager
    ? projects
    : projects?.filter(p => p.appUserId === currentUser?.id || p.appUserId === null);

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Logo" className="h-9 w-9 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <h1 className="font-bold text-sm leading-tight">المنابر للاستشارات الهندسية</h1>
            <p className="text-slate-400 text-xs">{isAr ? "إدارة محفظة المشاريع" : "Project Portfolio Management"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-400 font-medium hidden sm:block">{currentUser?.name}</span>
          {isPortfolioManager && (
            <button onClick={() => navigate("/portfolio")}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-amber-400 transition-colors">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "لوحة المحفظة" : "Portfolio"}</span>
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-700 transition-colors"
              title={isAr ? "الإشعارات" : "Notifications"}
            >
              <Bell className="w-4 h-4 text-slate-300" />
              {alerts.filter((_, i) => !readAlerts.has(i)).length > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {alerts.filter((_, i) => !readAlerts.has(i)).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className={`absolute top-10 ${isAr ? "left-0" : "right-0"} w-80 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden`}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    {isAr ? "الإشعارات" : "Notifications"}
                    {alerts.length > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-medium">{alerts.length}</span>
                    )}
                  </h3>
                  {alerts.length > 0 && (
                    <button
                      onClick={() => setReadAlerts(new Set(alerts.map((_, i) => i)))}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {isAr ? "تعليم الكل كمقروء" : "Mark all read"}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{isAr ? "لا توجد تنبيهات حالياً" : "No alerts at this time"}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {alerts.map((a, i) => (
                        <div
                          key={i}
                          onClick={() => setReadAlerts(prev => { const s = new Set(Array.from(prev)); s.add(i); return s; })}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            readAlerts.has(i) ? "bg-white" : a.type === "error" ? "bg-red-50" : "bg-amber-50"
                          } hover:bg-slate-50`}
                        >
                          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            a.type === "error" ? "text-red-500" : "text-amber-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${
                              readAlerts.has(i) ? "text-slate-500" : a.type === "error" ? "text-red-700" : "text-amber-700"
                            }`}>{a.project}</p>
                            <p className={`text-xs mt-0.5 ${
                              readAlerts.has(i) ? "text-slate-400" : a.type === "error" ? "text-red-600" : "text-amber-600"
                            }`}>{a.message}</p>
                          </div>
                          {!readAlerts.has(i) && (
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              a.type === "error" ? "bg-red-500" : "bg-amber-500"
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleLanguage}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors">
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? "English" : "عربي"}</span>
          </button>
          <button onClick={logout}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isAr ? "مشاريعي" : "My Projects"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {isAr ? `${visibleProjects?.length || 0} مشروع` : `${visibleProjects?.length || 0} projects`}
            </p>
          </div>
          <Link href="/projects/new">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              {isAr ? "مشروع جديد" : "New Project"}
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : visibleProjects && visibleProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProjects.map((project) => {
              const completion = Number(project.percentComplete || 0);
              const contractValue = Number(project.totalContractValue || 0);
              const phaseColor = PHASE_COLORS[project.phase] || "bg-slate-100 text-slate-700";

              return (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group p-5">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseColor}`}>
                        {project.phase}
                      </span>
                    </div>

                    {/* Project Name */}
                    <h3 className="font-bold text-slate-800 text-base mb-0.5 group-hover:text-blue-700 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">{project.code}</p>

                    {/* Stats */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {isAr ? "قيمة العقد" : "Contract Value"}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {contractValue > 0
                            ? `${(contractValue / 1000).toFixed(0)}K ${project.currency}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {isAr ? "الإنجاز" : "Completion"}
                        </span>
                        <span className="font-semibold text-slate-700">{completion}%</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, completion)}%` }}
                        />
                      </div>
                    </div>

                    {/* Manager */}
                    {project.manager && (
                      <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-50">
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
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {isAr ? "لا توجد مشاريع بعد" : "No projects yet"}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {isAr ? "ابدأ بإنشاء مشروعك الأول" : "Start by creating your first project"}
            </p>
            <Link href="/projects/new">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
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
