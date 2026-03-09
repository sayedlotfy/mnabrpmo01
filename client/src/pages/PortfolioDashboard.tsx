import { useState, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAppUser } from "@/contexts/AppUserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Loader2, TrendingUp, AlertTriangle, DollarSign, BarChart3,
  FolderOpen, LogOut, Globe, Users, Plus, Trash2, KeyRound, Eye, EyeOff, X, Check, Bell
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL = "https://static-assets.manus.space/files/webdev/design-pmo/logo.png";
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const T = {
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
    phaseDistribution: "توزيع المراحل",
    monthly: "شهري",
    quarterly: "ربع سنوي",
    budgetAlert: "تجاوز الميزانية",
    cpiAlert: "CPI منخفض",
    currency: "ر.س",
    // User Management
    userManagement: "إدارة المستخدمين",
    addEngineer: "إضافة مهندس جديد",
    engineerName: "اسم المهندس",
    engineerNameEn: "الاسم بالإنجليزية (اختياري)",
    pin: "رمز PIN (4 أرقام)",
    role: "الدور",
    portfolioManager: "مدير المحفظة",
    projectManager: "مدير مشروع",
    addUser: "إضافة",
    cancel: "إلغاء",
    deleteUser: "حذف",
    changePin: "تغيير PIN",
    newPin: "PIN الجديد",
    confirmDelete: "هل أنت متأكد من حذف هذا المستخدم؟",
    yes: "نعم",
    no: "لا",
    userAdded: "تم إضافة المستخدم بنجاح",
    userDeleted: "تم حذف المستخدم",
    pinChanged: "تم تغيير PIN بنجاح",
    errorPinFormat: "يجب أن يكون PIN 4 أرقام",
    errorNameRequired: "الاسم مطلوب",
    engineers: "المهندسون",
    noEngineers: "لا يوجد مهندسون مسجلون",
    projects: "المشاريع",
    actions: "الإجراءات",
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
    phaseDistribution: "Phase Distribution",
    monthly: "Monthly",
    quarterly: "Quarterly",
    budgetAlert: "Budget Overrun",
    cpiAlert: "Low CPI",
    currency: "SAR",
    // User Management
    userManagement: "User Management",
    addEngineer: "Add New Engineer",
    engineerName: "Engineer Name (Arabic)",
    engineerNameEn: "Name in English (optional)",
    pin: "PIN Code (4 digits)",
    role: "Role",
    portfolioManager: "Portfolio Manager",
    projectManager: "Project Manager",
    addUser: "Add",
    cancel: "Cancel",
    deleteUser: "Delete",
    changePin: "Change PIN",
    newPin: "New PIN",
    confirmDelete: "Are you sure you want to delete this user?",
    yes: "Yes",
    no: "No",
    userAdded: "User added successfully",
    userDeleted: "User deleted",
    pinChanged: "PIN changed successfully",
    errorPinFormat: "PIN must be 4 digits",
    errorNameRequired: "Name is required",
    engineers: "Engineers",
    noEngineers: "No engineers registered",
    projects: "Projects",
    actions: "Actions",
  },
};

function fmt(n: number, currency = "SAR") {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n.toFixed(0)}`;
}

// ---- Add User Modal ----
function AddUserModal({ onClose, onSuccess, lang }: { onClose: () => void; onSuccess: () => void; lang: "ar" | "en" }) {
  const t = T[lang];
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"project_manager" | "portfolio_manager">("project_manager");
  const [showPin, setShowPin] = useState(false);

  const createUser = trpc.appUsers.create.useMutation({
    onSuccess: () => {
      toast.success(t.userAdded);
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) return toast.error(t.errorNameRequired);
    if (!/^\d{4}$/.test(pin)) return toast.error(t.errorPinFormat);
    createUser.mutate({ name: name.trim(), nameEn: nameEn.trim() || undefined, pin, role });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">{t.addEngineer}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.engineerName} *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={lang === "ar" ? "مثال: أحمد محمد" : "e.g. Ahmed Mohamed"} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.engineerNameEn}</label>
            <input value={nameEn} onChange={e => setNameEn(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Ahmed Mohamed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.role}</label>
            <select value={role} onChange={e => setRole(e.target.value as any)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="project_manager">{t.projectManager}</option>
              <option value="portfolio_manager">{t.portfolioManager}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.pin} *</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
                placeholder="••••"
              />
              <button type="button" onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 end-3 flex items-center text-slate-400">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} disabled={createUser.isPending}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {t.addUser}
          </button>
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Change PIN Modal ----
function ChangePinModal({ userId, userName, onClose, onSuccess, lang }: {
  userId: number; userName: string; onClose: () => void; onSuccess: () => void; lang: "ar" | "en";
}) {
  const t = T[lang];
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // Portfolio manager can change any user's PIN directly (admin override)
  const updatePin = trpc.appUsers.adminUpdatePin.useMutation({
    onSuccess: () => {
      toast.success(t.pinChanged);
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!/^\d{4}$/.test(newPin)) return toast.error(t.errorPinFormat);
    updatePin.mutate({ userId, newPin });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">{t.changePin}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{userName}</p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.newPin} *</label>
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
              placeholder="••••"
            />
            <button type="button" onClick={() => setShowPin(!showPin)}
              className="absolute inset-y-0 end-3 flex items-center text-slate-400">
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} disabled={updatePin.isPending}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {updatePin.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {t.changePin}
          </button>
          <button onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function PortfolioDashboard() {
  const { currentUser, logout } = useAppUser();
  const { lang, toggleLanguage } = useLanguage();
  const t = T[lang];
  const isAr = lang === "ar";
  const [, navigate] = useLocation();
  const [managerFilter, setManagerFilter] = useState("all");
  const [cashFlowView, setCashFlowView] = useState<"monthly" | "quarterly">("monthly");
  const [activeTab, setActiveTab] = useState<"dashboard" | "users">("dashboard");
  const [showAddUser, setShowAddUser] = useState(false);
  const [changePinUser, setChangePinUser] = useState<{ id: number; name: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAlerts, setReadAlerts] = useState<Set<number>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: summary, isLoading, refetch: refetchSummary } = trpc.portfolio.summary.useQuery();
  const { data: appUsers, refetch: refetchUsers } = trpc.appUsers.list.useQuery();

  const deleteUser = trpc.appUsers.delete.useMutation({
    onSuccess: () => {
      toast.success(t.userDeleted);
      refetchUsers();
      setConfirmDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

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

  const alerts = useMemo(() => {
    const list: { type: "warning" | "error"; message: string; project: string }[] = [];
    projects.forEach((p: any) => {
      const cpi = Number(p.cpi || 1);
      if (cpi < 0.8 && cpi > 0) list.push({ type: "error", message: `${t.cpiAlert}: ${cpi.toFixed(2)}`, project: p.name });
      else if (cpi < 0.9 && cpi > 0) list.push({ type: "warning", message: `${t.cpiAlert}: ${cpi.toFixed(2)}`, project: p.name });
      if (Number(p.profitability || 0) < 0) list.push({ type: "error", message: t.budgetAlert, project: p.name });
    });
    return list;
  }, [projects, t]);

  const monthlyCashFlow = useMemo(() => summary?.monthlyCashFlow || [], [summary]);

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

  const phaseData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p: any) => { const ph = p.phase || "Unknown"; counts[ph] = (counts[ph] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const managers = useMemo(() => (appUsers || []).filter(u => u.role === "project_manager"), [appUsers]);
  const engineers = useMemo(() => (appUsers || []).filter(u => u.role !== "portfolio_manager"), [appUsers]);

  const getStatus = (p: any) => {
    const cpi = Number(p.cpi || 1);
    if (cpi < 0.8) return { label: t.critical, color: "text-red-500", bg: "bg-red-500/10" };
    if (cpi < 0.9) return { label: t.atRisk, color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: t.onTrack, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? "rtl" : "ltr"}>
      {/* Modals */}
      {showAddUser && (
        <AddUserModal lang={lang} onClose={() => setShowAddUser(false)} onSuccess={() => refetchUsers()} />
      )}
      {changePinUser && (
        <ChangePinModal lang={lang} userId={changePinUser.id} userName={changePinUser.name}
          onClose={() => setChangePinUser(null)} onSuccess={() => refetchUsers()} />
      )}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-slate-800 font-medium mb-5">{t.confirmDelete}</p>
            <div className="flex gap-3">
              <button onClick={() => deleteUser.mutate({ userId: confirmDeleteId })}
                disabled={deleteUser.isPending}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleteUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.yes}
              </button>
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
                {t.no}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Logo" className="h-9 w-9 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div>
            <h1 className="font-bold text-sm leading-tight">
              {isAr ? "المنابر للاستشارات الهندسية" : "Al Mnabr Engineering Consultants"}
            </h1>
            <p className="text-slate-400 text-xs">{t.portfolioDashboard}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-400 font-medium hidden sm:block">{currentUser?.name}</span>

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

            {/* Dropdown */}
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
                      <p className="text-sm text-slate-400">{t.noAlerts}</p>
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
                {alerts.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                    <button
                      onClick={() => { setActiveTab("dashboard"); setShowNotifications(false); }}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors w-full text-center"
                    >
                      {isAr ? "عرض جميع التنبيهات في لوحة التحكم" : "View all alerts in dashboard"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0 max-w-7xl mx-auto">
          {[
            { key: "dashboard", label: isAr ? "لوحة التحكم" : "Dashboard", icon: BarChart3 },
            { key: "users", label: t.userManagement, icon: Users },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
                }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === "dashboard" && (
          <>
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
                      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.type === "error" ? "text-red-500" : "text-amber-500"}`} />
                      <div>
                        <p className={`text-sm font-medium ${a.type === "error" ? "text-red-700" : "text-amber-700"}`}>{a.project}</p>
                        <p className={`text-xs ${a.type === "error" ? "text-red-600" : "text-amber-600"}`}>{a.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">
                    {cashFlowView === "monthly" ? t.cashFlowMonthly : t.cashFlowQuarterly}
                  </h3>
                  <div className="flex gap-1">
                    {(["monthly", "quarterly"] as const).map(v => (
                      <button key={v} onClick={() => setCashFlowView(v)}
                        className={`text-xs px-3 py-1 rounded-lg transition-colors ${cashFlowView === v ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {v === "monthly" ? t.monthly : t.quarterly}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cashFlowView === "monthly" ? monthlyCashFlow : quarterlyCashFlow} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="expected" name={t.expected} fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name={t.actual} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

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
                      const status = getStatus(p);
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
          </>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {t.userManagement}
              </h2>
              <button onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                {t.addEngineer}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-700 text-sm">{t.engineers}</h3>
              </div>
              {engineers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">{t.noEngineers}</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {engineers.map(user => {
                    const userProjects = (summary?.projects || []).filter((p: any) => p.appUserId === user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            {user.nameEn && <p className="text-xs text-slate-400">{user.nameEn}</p>}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === "portfolio_manager"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                                }`}>
                                {user.role === "portfolio_manager" ? t.portfolioManager : t.projectManager}
                              </span>
                              <span className="text-xs text-slate-400">
                                {userProjects.length} {t.projects}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setChangePinUser({ id: user.id, name: user.name })}
                            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {t.changePin}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(user.id)}
                            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t.deleteUser}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Portfolio Managers section */}
            {(appUsers || []).filter(u => u.role === "portfolio_manager").length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    {t.portfolioManager}
                  </h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {(appUsers || []).filter(u => u.role === "portfolio_manager").map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          {user.nameEn && <p className="text-xs text-slate-400">{user.nameEn}</p>}
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            {t.portfolioManager}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setChangePinUser({ id: user.id, name: user.name })}
                        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        {t.changePin}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
