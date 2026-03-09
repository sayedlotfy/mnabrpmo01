import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAppUser } from "@/contexts/AppUserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, BarChart3, Users, FolderOpen, LogOut, Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useLocation } from "wouter";

const LOGO_URL = "https://static-assets.manus.space/files/webdev/design-pmo/logo.png";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const translations = {
  ar: {
    portfolioDashboard: "لوحة تحكم المحفظة",
    allProjects: "جميع المشاريع",
    totalRevenue: "إجمالي الإيرادات",
    totalCollected: "إجمالي المحصّل",
    avgCPI: "متوسط CPI",
    avgProfitability: "متوسط الربحية",
    activeProjects: "المشاريع النشطة",
    atRiskProjects: "مشاريع في خطر",
    alerts: "التنبيهات",
    noAlerts: "لا توجد تنبيهات حالياً",
    projectPerformance: "أداء المشاريع",
    cashFlowMonthly: "التدفق النقدي الشهري",
    cashFlowQuarterly: "التدفق النقدي الربع سنوي",
    expected: "المتوقع",
    actual: "الفعلي",
    projectName: "اسم المشروع",
    manager: "المدير",
    phase: "المرحلة",
    contractValue: "قيمة العقد",
    collected: "المحصّل",
    cpi: "CPI",
    profitability: "الربحية",
    completion: "الإنجاز",
    status: "الحالة",
    onTrack: "في الموعد",
    atRisk: "في خطر",
    critical: "حرج",
    filterByManager: "تصفية حسب المدير",
    allManagers: "جميع المديرين",
    logout: "تسجيل الخروج",
    switchLang: "English",
    viewProject: "عرض",
    profitDistribution: "توزيع الربحية",
    phaseDistribution: "توزيع المراحل",
    monthly: "شهري",
    quarterly: "ربع سنوي",
    budgetAlert: "تجاوز الميزانية",
    cpiAlert: "CPI منخفض",
    overdueAlert: "دفعات متأخرة",
    currency: "ر.س",
  },
  en: {
    portfolioDashboard: "Portfolio Dashboard",
    allProjects: "All Projects",
    totalRevenue: "Total Revenue",
    totalCollected: "Total Collected",
    avgCPI: "Avg CPI",
    avgProfitability: "Avg Profitability",
    activeProjects: "Active Projects",
    atRiskProjects: "At-Risk Projects",
    alerts: "Alerts",
    noAlerts: "No alerts at this time",
    projectPerformance: "Project Performance",
    cashFlowMonthly: "Monthly Cash Flow",
    cashFlowQuarterly: "Quarterly Cash Flow",
    expected: "Expected",
    actual: "Actual",
    projectName: "Project Name",
    manager: "Manager",
    phase: "Phase",
    contractValue: "Contract Value",
    collected: "Collected",
    cpi: "CPI",
    profitability: "Profitability",
    completion: "Completion",
    status: "Status",
    onTrack: "On Track",
    atRisk: "At Risk",
    critical: "Critical",
    filterByManager: "Filter by Manager",
    allManagers: "All Managers",
    logout: "Sign Out",
    switchLang: "عربي",
    viewProject: "View",
    profitDistribution: "Profit Distribution",
    phaseDistribution: "Phase Distribution",
    monthly: "Monthly",
    quarterly: "Quarterly",
    budgetAlert: "Budget Overrun",
    cpiAlert: "Low CPI",
    overdueAlert: "Overdue Payments",
    currency: "SAR",
  },
};

function fmt(n: number, currency = "SAR") {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ${currency}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K ${currency}`;
  return `${n.toFixed(0)} ${currency}`;
}

export default function PortfolioDashboard() {
  const { currentUser, logout } = useAppUser();
  const { lang, toggleLanguage } = useLanguage();
  const t = translations[lang];
  const isAr = lang === "ar";
  const [, navigate] = useLocation();
  const [managerFilter, setManagerFilter] = useState("all");
  const [cashFlowView, setCashFlowView] = useState<"monthly" | "quarterly">("monthly");

  const { data: summary, isLoading } = trpc.portfolio.summary.useQuery();
  const { data: appUsers } = trpc.appUsers.list.useQuery();

  const projects = useMemo(() => {
    if (!summary?.projects) return [];
    if (managerFilter === "all") return summary.projects;
    return summary.projects.filter((p: any) => String(p.appUserId) === managerFilter);
  }, [summary, managerFilter]);

  const kpis = useMemo(() => {
    if (!projects.length) return { totalRevenue: 0, totalCollected: 0, avgCPI: 0, avgProfit: 0, active: 0, atRisk: 0 };
    const totalRevenue = projects.reduce((s: number, p: any) => s + Number(p.totalContractValue || 0), 0);
    const totalCollected = projects.reduce((s: number, p: any) => s + Number(p.totalCollected || 0), 0);
    const cpis = projects.map((p: any) => Number(p.cpi || 0)).filter((c: number) => c > 0);
    const avgCPI = cpis.length ? cpis.reduce((a: number, b: number) => a + b, 0) / cpis.length : 0;
    const profits = projects.map((p: any) => Number(p.profitability || 0));
    const avgProfit = profits.length ? profits.reduce((a: number, b: number) => a + b, 0) / profits.length : 0;
    const active = projects.filter((p: any) => !p.isPaused).length;
    const atRisk = projects.filter((p: any) => Number(p.cpi || 1) < 0.85).length;
    return { totalRevenue, totalCollected, avgCPI, avgProfit, active, atRisk };
  }, [projects]);

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: "warning" | "error"; message: string; project: string }[] = [];
    projects.forEach((p: any) => {
      const cpi = Number(p.cpi || 1);
      if (cpi < 0.8 && cpi > 0) {
        list.push({ type: "error", message: `${t.cpiAlert}: ${cpi.toFixed(2)}`, project: p.name });
      } else if (cpi < 0.9 && cpi > 0) {
        list.push({ type: "warning", message: `${t.cpiAlert}: ${cpi.toFixed(2)}`, project: p.name });
      }
      if (Number(p.profitability || 0) < 0) {
        list.push({ type: "error", message: t.budgetAlert, project: p.name });
      }
    });
    return list;
  }, [projects, t]);

  // Monthly Cash Flow data
  const monthlyCashFlow = useMemo(() => {
    if (!summary?.monthlyCashFlow) return [];
    return summary.monthlyCashFlow;
  }, [summary]);

  // Quarterly Cash Flow
  const quarterlyCashFlow = useMemo(() => {
    const months = monthlyCashFlow;
    if (!months.length) return [];
    const quarters: { name: string; expected: number; actual: number }[] = [];
    for (let q = 0; q < 4; q++) {
      const slice = months.slice(q * 3, q * 3 + 3);
      if (!slice.length) break;
      quarters.push({
        name: `Q${q + 1}`,
        expected: slice.reduce((s: number, m: any) => s + (m.expected || 0), 0),
        actual: slice.reduce((s: number, m: any) => s + (m.actual || 0), 0),
      });
    }
    return quarters;
  }, [monthlyCashFlow]);

  // Phase distribution
  const phaseData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p: any) => {
      const ph = p.phase || "Unknown";
      counts[ph] = (counts[ph] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Managers list for filter
  const managers = useMemo(() => {
    if (!appUsers) return [];
    return appUsers.filter(u => u.role === "project_manager");
  }, [appUsers]);

  const getProjectStatus = (p: any) => {
    const cpi = Number(p.cpi || 1);
    if (cpi < 0.8) return { label: t.critical, color: "text-red-500", bg: "bg-red-500/10" };
    if (cpi < 0.9) return { label: t.atRisk, color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: t.onTrack, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Logo" className="h-9 w-9 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <h1 className="font-bold text-sm leading-tight">المنابر للاستشارات الهندسية</h1>
            <p className="text-slate-400 text-xs">{t.portfolioDashboard}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-400 font-medium hidden sm:block">{currentUser?.name}</span>
          <button onClick={toggleLanguage}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors">
            <Globe className="w-3.5 h-3.5" />{t.switchLang}
          </button>
          <button onClick={logout}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />{t.logout}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: t.totalRevenue, value: fmt(kpis.totalRevenue), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
            { label: t.totalCollected, value: fmt(kpis.totalCollected), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: t.avgCPI, value: kpis.avgCPI.toFixed(2), icon: BarChart3, color: kpis.avgCPI >= 0.9 ? "text-emerald-600" : "text-red-600", bg: kpis.avgCPI >= 0.9 ? "bg-emerald-50" : "bg-red-50" },
            { label: t.avgProfitability, value: `${kpis.avgProfit.toFixed(1)}%`, icon: TrendingUp, color: kpis.avgProfit >= 15 ? "text-emerald-600" : "text-amber-600", bg: kpis.avgProfit >= 15 ? "bg-emerald-50" : "bg-amber-50" },
            { label: t.activeProjects, value: String(kpis.active), icon: FolderOpen, color: "text-blue-600", bg: "bg-blue-50" },
            { label: t.atRiskProjects, value: String(kpis.atRisk), icon: AlertTriangle, color: kpis.atRisk > 0 ? "text-red-600" : "text-emerald-600", bg: kpis.atRisk > 0 ? "bg-red-50" : "bg-emerald-50" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />{t.alerts}
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">{alerts.length}</span>
            </h3>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${a.type === "error" ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"}`}>
                  {a.type === "error" ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className={`text-sm font-medium ${a.type === "error" ? "text-red-700" : "text-amber-700"}`}>{a.project}</p>
                    <p className={`text-xs ${a.type === "error" ? "text-red-600" : "text-amber-600"}`}>{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cash Flow Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">
                {cashFlowView === "monthly" ? t.cashFlowMonthly : t.cashFlowQuarterly}
              </h3>
              <div className="flex gap-1">
                <button onClick={() => setCashFlowView("monthly")}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${cashFlowView === "monthly" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {t.monthly}
                </button>
                <button onClick={() => setCashFlowView("quarterly")}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${cashFlowView === "quarterly" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {t.quarterly}
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashFlowView === "monthly" ? monthlyCashFlow : quarterlyCashFlow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="expected" name={t.expected} fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name={t.actual} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Phase Distribution */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">{t.phaseDistribution}</h3>
            {phaseData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={phaseData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {phaseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {phaseData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-medium text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                {isAr ? "لا توجد بيانات" : "No data"}
              </div>
            )}
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              {t.projectPerformance}
              <span className="text-xs text-slate-400 font-normal">({projects.length})</span>
            </h3>
            <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">{t.allManagers}</option>
              {managers.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[t.projectName, t.phase, t.contractValue, t.collected, t.cpi, t.profitability, t.completion, t.status, ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-start whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projects.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-slate-400">{isAr ? "لا توجد مشاريع" : "No projects"}</td></tr>
                ) : projects.map((p: any) => {
                  const status = getProjectStatus(p);
                  const cpi = Number(p.cpi || 0);
                  const profit = Number(p.profitability || 0);
                  const completion = Number(p.percentComplete || 0);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{p.phase || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{fmt(Number(p.totalContractValue || 0))}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{fmt(Number(p.totalCollected || 0))}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${cpi >= 1 ? "text-emerald-600" : cpi >= 0.85 ? "text-amber-600" : "text-red-600"}`}>
                          {cpi > 0 ? cpi.toFixed(2) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${profit >= 15 ? "text-emerald-600" : profit >= 0 ? "text-amber-600" : "text-red-600"}`}>
                          {profit.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[60px]">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, completion)}%` }} />
                          </div>
                          <span className="text-xs text-slate-600 whitespace-nowrap">{completion.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/project/${p.id}`)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors whitespace-nowrap">
                          {t.viewProject} →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
