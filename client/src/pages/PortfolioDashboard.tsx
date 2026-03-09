import { useState, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAppUser } from "@/contexts/AppUserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Loader2, TrendingUp, AlertTriangle, DollarSign, BarChart3,
  FolderOpen, LogOut, Globe, Users, Plus, Trash2, KeyRound, Eye, EyeOff, X, Check, Bell,
  FileText, CreditCard, Download, FileSpreadsheet, Receipt, Banknote
} from "lucide-react";
import {
  exportClaimsPDF, exportDebtsPDF, exportClaimsExcel, exportDebtsExcel,
  type ClaimItem, type DebtItem
} from "@/lib/exportPdf";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { useLocation } from "wouter";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import LastUpdatedBanner from "@/components/LastUpdatedBanner";

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
    // Claims & Debts
    claimsTab: "المطالبات",
    debtsTab: "المديونيات",
    claimsTitle: "المطالبات المستحقة الإصدار",
    debtsTitle: "المديونيات - الفواتير غير المسددة",
    claimsDesc: "دفعات مستحقة الإصدار من المالية (Pending / Due)",
    debtsDesc: "فواتير صادرة ولم تُسدَّد بالكامل - لمتابعة فريق التحصيل",
    totalClaims: "إجمالي المطالبات",
    totalDebts: "إجمالي المديونية",
    totalInvoiced: "إجمالي المفوتر",
    totalPaid: "إجمالي المحصّل",
    outstanding: "المتبقي",
    projectCode: "الكود",
    paymentTitle: "اسم الدفعة",
    invoiceTitle: "اسم الفاتورة",
    payType: "النوع",
    payAmount: "القيمة",
    invoicedAmount: "قيمة الفاتورة",
    paidAmount: "المحصّل",
    payDate: "التاريخ",
    requirements: "المتطلبات",
    noClaims: "لا توجد مطالبات مستحقة حالياً",
    noDebts: "لا توجد مديونيات مسجلة حالياً",
    exportPdf: "تصدير PDF",
    exportExcel: "تصدير Excel",
    viewProjectLink: "عرض المشروع",
    statusPending: "معلق",
    statusDue: "مستحق",
    statusClaimed: "مطالب به",
    statusInvoiced: "مفوتر",
    statusPaidPartial: "مدفوع جزئياً",
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
    // Claims & Debts
    claimsTab: "Claims",
    debtsTab: "Debts",
    claimsTitle: "Claims Pending Finance Issuance",
    debtsTitle: "Outstanding Debts - Unpaid Invoices",
    claimsDesc: "Payments pending issuance by finance (Pending / Due)",
    debtsDesc: "Issued invoices not fully paid - for collection team follow-up",
    totalClaims: "Total Claims",
    totalDebts: "Total Outstanding",
    totalInvoiced: "Total Invoiced",
    totalPaid: "Total Collected",
    outstanding: "Outstanding",
    projectCode: "Code",
    paymentTitle: "Payment Title",
    invoiceTitle: "Invoice Title",
    payType: "Type",
    payAmount: "Amount",
    invoicedAmount: "Invoiced",
    paidAmount: "Paid",
    payDate: "Date",
    requirements: "Requirements",
    noClaims: "No pending claims at this time",
    noDebts: "No outstanding debts recorded",
    exportPdf: "Export PDF",
    exportExcel: "Export Excel",
    viewProjectLink: "View Project",
    statusPending: "Pending",
    statusDue: "Due",
    statusClaimed: "Claimed",
    statusInvoiced: "Invoiced",
    statusPaidPartial: "Partial",
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "claims" | "debts">("dashboard");
  const [showAddUser, setShowAddUser] = useState(false);
  const [changePinUser, setChangePinUser] = useState<{ id: number; name: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAlerts, setReadAlerts] = useState<Set<number>>(new Set());
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
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
  const { data: claimsDebts, isLoading: claimsLoading } = trpc.portfolio.claimsAndDebts.useQuery();

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
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--lg-bg-gradient)", backgroundAttachment: "fixed" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir={isAr ? "rtl" : "ltr"}
      style={{ background: "var(--lg-bg-gradient)", backgroundAttachment: "fixed" }}>
      {/* Last updated banner */}
      <LastUpdatedBanner />
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
      <header className="lg-header sticky top-8 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Logo" className="h-9 w-9 object-contain drop-shadow"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div>
            <h1 className="font-bold text-sm leading-tight" style={{ color: "var(--lg-header-text)" }}>
              {isAr ? "المنابر للاستشارات الهندسية" : "Al Mnabr Engineering Consultants"}
            </h1>
            <p className="text-xs opacity-50" style={{ color: "var(--lg-header-text)" }}>{t.portfolioDashboard}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium hidden sm:block" style={{ color: "oklch(0.75 0.15 50)" }}>{currentUser?.name}</span>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative flex items-center justify-center w-8 h-8 rounded-xl transition-all"
              style={{
                background: showNotifications ? "oklch(1 0 0 / 20%)" : "oklch(1 0 0 / 8%)",
                border: "1px solid oklch(1 0 0 / 15%)",
              }}
              title={isAr ? "الإشعارات" : "Notifications"}
            >
              <Bell className="w-4 h-4" style={{ color: "var(--lg-header-text)" }} />
              {alerts.filter((_, i) => !readAlerts.has(i)).length > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {alerts.filter((_, i) => !readAlerts.has(i)).length}
                </span>
              )}
            </button>

            {/* Dropdown */}
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
                      <p className="text-sm opacity-50">{t.noAlerts}</p>
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
                {alerts.length > 0 && (
                  <div className="px-4 py-2" style={{ borderTop: "1px solid var(--lg-border)" }}>
                    <button onClick={() => { setActiveTab("dashboard"); setShowNotifications(false); }}
                      className="text-xs opacity-60 hover:opacity-100 transition-opacity w-full text-center" style={{ color: "var(--primary)" }}>
                      {isAr ? "عرض جميع التنبيهات" : "View all alerts"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <ThemeToggle />
          <button onClick={toggleLanguage}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all opacity-60 hover:opacity-100"
            style={{ color: "var(--lg-header-text)" }}>
            <Globe className="w-3.5 h-3.5" />{t.switchLang}
          </button>
          <button onClick={logout}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all opacity-60 hover:opacity-100 hover:text-red-400"
            style={{ color: "var(--lg-header-text)" }}>
            <LogOut className="w-3.5 h-3.5" />{t.logout}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 overflow-x-auto" style={{ borderBottom: "1px solid var(--lg-border)", background: "var(--lg-glass-bg)", backdropFilter: "var(--lg-blur)", WebkitBackdropFilter: "var(--lg-blur)" }}>
        <div className="flex gap-0 max-w-7xl mx-auto min-w-max">
          {[
            { key: "dashboard", label: isAr ? "لوحة التحكم" : "Dashboard", icon: BarChart3 },
            { key: "claims", label: t.claimsTab, icon: Receipt, badge: claimsDebts?.claims?.length },
            { key: "debts", label: t.debtsTab, icon: Banknote, badge: claimsDebts?.debts?.length },
            { key: "users", label: t.userManagement, icon: Users },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all relative"
              style={{
                borderBottomColor: activeTab === tab.key ? "var(--primary)" : "transparent",
                color: activeTab === tab.key ? "var(--primary)" : "var(--muted-foreground)",
              }}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {(tab as any).badge > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{
                    background: tab.key === "claims" ? "oklch(0.75 0.15 60 / 20%)" : "oklch(0.6 0.2 20 / 15%)",
                    color: tab.key === "claims" ? "oklch(0.65 0.15 60)" : "oklch(0.6 0.2 20)",
                  }}>
                  {(tab as any).badge}
                </span>
              )}
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
                { label: t.totalRevenue, value: fmt(kpis.totalRevenue), icon: DollarSign, accent: "oklch(0.55 0.18 260)" },
                { label: t.totalCollected, value: fmt(kpis.totalCollected), icon: TrendingUp, accent: "oklch(0.55 0.18 145)" },
                { label: t.avgCPI, value: kpis.avgCPI.toFixed(2), icon: BarChart3, accent: kpis.avgCPI >= 0.9 ? "oklch(0.55 0.18 145)" : "oklch(0.6 0.2 20)" },
                { label: t.avgProfitability, value: `${kpis.avgProfit.toFixed(1)}%`, icon: TrendingUp, accent: kpis.avgProfit >= 15 ? "oklch(0.55 0.18 145)" : "oklch(0.65 0.15 60)" },
                { label: t.activeProjects, value: String(kpis.active), icon: FolderOpen, accent: "oklch(0.55 0.18 260)" },
                { label: t.atRiskProjects, value: String(kpis.atRisk), icon: AlertTriangle, accent: kpis.atRisk > 0 ? "oklch(0.6 0.2 20)" : "oklch(0.55 0.18 145)" },
              ].map((kpi, i) => (
                <div key={i} className="lg-card p-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: `${kpi.accent}20` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.accent }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{kpi.value}</p>
                  <p className="text-xs opacity-50 mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="lg-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />{t.alerts}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.6 0.2 20 / 15%)", color: "oklch(0.6 0.2 20)" }}>{alerts.length}</span>
                </h3>
                <div className="space-y-2">
                  {alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: a.type === "error" ? "oklch(0.6 0.2 20 / 8%)" : "oklch(0.75 0.15 60 / 8%)", border: `1px solid ${a.type === "error" ? "oklch(0.6 0.2 20 / 20%)" : "oklch(0.75 0.15 60 / 20%)"}` }}>
                      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.type === "error" ? "text-red-500" : "text-amber-500"}`} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: a.type === "error" ? "oklch(0.6 0.2 20)" : "oklch(0.65 0.15 60)" }}>{a.project}</p>
                        <p className="text-xs opacity-70">{a.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 lg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                    {cashFlowView === "monthly" ? t.cashFlowMonthly : t.cashFlowQuarterly}
                  </h3>
                  <div className="flex gap-1">
                    {(["monthly", "quarterly"] as const).map(v => (
                      <button key={v} onClick={() => setCashFlowView(v)}
                        className="text-xs px-3 py-1 rounded-lg transition-all"
                        style={{
                          background: cashFlowView === v ? "var(--primary)" : "var(--lg-glass-bg)",
                          color: cashFlowView === v ? "var(--primary-foreground)" : "var(--muted-foreground)",
                          border: "1px solid var(--lg-glass-border)",
                        }}>
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

              <div className="lg-card p-4">
                <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>{t.phaseDistribution}</h3>
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
                            <span className="opacity-70" style={{ color: "var(--foreground)" }}>{d.name}</span>
                          </div>
                          <span className="font-medium" style={{ color: "var(--foreground)" }}>{d.value}</span>
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
            <div className="lg-card overflow-hidden">
              <div className="p-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid var(--lg-border)" }}>
                <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <FolderOpen className="w-4 h-4" style={{ color: "var(--primary)" }} />
                  {t.projectPerformance}
                  <span className="text-xs opacity-40 font-normal">({projects.length})</span>
                </h3>
                <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}
                  className="text-sm rounded-xl px-3 py-1.5 focus:outline-none"
                  style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)", color: "var(--foreground)" }}>
                  <option value="all">{t.allManagers}</option>
                  {managers.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "oklch(0.5 0.01 260 / 5%)" }}>
                      {[t.projectName, t.phase, t.contractValue, t.collected, t.cpi, t.profitability, t.completion, t.status, ""].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-start whitespace-nowrap opacity-50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-8 opacity-40">{isAr ? "لا توجد مشاريع" : "No projects"}</td></tr>
                    ) : projects.map((p: any) => {
                      const status = getStatus(p);
                      const cpi = Number(p.cpi || 0);
                      const profit = Number(p.profitability || 0);
                      const completion = Number(p.percentComplete || 0);
                      return (
                        <tr key={p.id} className="transition-colors"
                          style={{ borderBottom: "1px solid var(--lg-border)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.5 0.01 260 / 4%)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td className="px-4 py-3">
                            <p className="font-medium" style={{ color: "var(--foreground)" }}>{p.name}</p>
                            <p className="text-xs opacity-40">{p.code}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "oklch(0.55 0.18 260 / 12%)", color: "oklch(0.55 0.18 260)" }}>
                              {p.phase || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap opacity-80">{fmt(Number(p.totalContractValue || 0))}</td>
                          <td className="px-4 py-3 whitespace-nowrap opacity-80">{fmt(Number(p.totalCollected || 0))}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold" style={{ color: cpi >= 1 ? "oklch(0.55 0.18 145)" : cpi >= 0.85 ? "oklch(0.65 0.15 60)" : "oklch(0.6 0.2 20)" }}>
                              {cpi > 0 ? cpi.toFixed(2) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold" style={{ color: profit >= 15 ? "oklch(0.55 0.18 145)" : profit >= 0 ? "oklch(0.65 0.15 60)" : "oklch(0.6 0.2 20)" }}>
                              {profit.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 rounded-full h-1.5 min-w-[60px]" style={{ background: "oklch(0.5 0.01 260 / 15%)" }}>
                                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, completion)}%`, background: "var(--primary)" }} />
                              </div>
                              <span className="text-xs opacity-60 whitespace-nowrap">{completion.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}>{status.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => navigate(`/project/${p.id}`)}
                              className="text-xs font-medium transition-opacity opacity-60 hover:opacity-100 whitespace-nowrap"
                              style={{ color: "var(--primary)" }}>
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
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Users className="w-5 h-5" style={{ color: "var(--primary)" }} />
                {t.userManagement}
              </h2>
              <button onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: "var(--primary)" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                <Plus className="w-4 h-4" />
                {t.addEngineer}
              </button>
            </div>

            <div className="lg-card overflow-hidden">
              <div className="p-4" style={{ borderBottom: "1px solid var(--lg-border)" }}>
                <h3 className="font-semibold text-sm opacity-70">{t.engineers}</h3>
              </div>
              {engineers.length === 0 ? (
                <div className="p-8 text-center opacity-40 text-sm">{t.noEngineers}</div>
              ) : (
                <div>
                  {engineers.map(user => {
                    const userProjects = (summary?.projects || []).filter((p: any) => p.appUserId === user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-4 transition-all"
                        style={{ borderBottom: "1px solid var(--lg-border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.5 0.01 260 / 4%)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: "oklch(0.55 0.18 260 / 15%)", color: "oklch(0.55 0.18 260)" }}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: "var(--foreground)" }}>{user.name}</p>
                            {user.nameEn && <p className="text-xs opacity-40">{user.nameEn}</p>}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: user.role === "portfolio_manager" ? "oklch(0.6 0.18 300 / 15%)" : "oklch(0.55 0.18 260 / 15%)",
                                  color: user.role === "portfolio_manager" ? "oklch(0.6 0.18 300)" : "oklch(0.55 0.18 260)",
                                }}>
                                {user.role === "portfolio_manager" ? t.portfolioManager : t.projectManager}
                              </span>
                              <span className="text-xs opacity-40">{userProjects.length} {t.projects}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setChangePinUser({ id: user.id, name: user.name })}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all"
                            style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)", color: "var(--foreground)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "var(--lg-glass-hover)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "var(--lg-glass-bg)")}>
                            <KeyRound className="w-3.5 h-3.5" />
                            {t.changePin}
                          </button>
                          <button onClick={() => setConfirmDeleteId(user.id)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all"
                            style={{ background: "oklch(0.6 0.2 20 / 8%)", border: "1px solid oklch(0.6 0.2 20 / 20%)", color: "oklch(0.6 0.2 20)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.6 0.2 20 / 15%)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.6 0.2 20 / 8%)")}>
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
              <div className="lg-card overflow-hidden">
                <div className="p-4" style={{ borderBottom: "1px solid var(--lg-border)" }}>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: "oklch(0.6 0.18 300)" }} />
                    {t.portfolioManager}
                  </h3>
                </div>
                <div>
                  {(appUsers || []).filter(u => u.role === "portfolio_manager").map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 transition-all"
                      style={{ borderBottom: "1px solid var(--lg-border)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.5 0.01 260 / 4%)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ background: "oklch(0.6 0.18 300 / 15%)", color: "oklch(0.6 0.18 300)" }}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: "var(--foreground)" }}>{user.name}</p>
                          {user.nameEn && <p className="text-xs opacity-40">{user.nameEn}</p>}
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "oklch(0.6 0.18 300 / 15%)", color: "oklch(0.6 0.18 300)" }}>
                            {t.portfolioManager}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setChangePinUser({ id: user.id, name: user.name })}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all"
                        style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)", color: "var(--foreground)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--lg-glass-hover)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "var(--lg-glass-bg)")}>
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

        {/* ===== CLAIMS TAB ===== */}
        {activeTab === "claims" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Receipt className="w-5 h-5" style={{ color: "oklch(0.65 0.15 60)" }} />
                  {t.claimsTitle}
                </h2>
                <p className="text-sm mt-1 opacity-60" style={{ color: "var(--foreground)" }}>{t.claimsDesc}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!claimsDebts) return;
                    setExportingPdf(true);
                    try { await exportClaimsPDF(claimsDebts.claims as ClaimItem[], { totalClaims: claimsDebts.totalClaims }, lang); }
                    finally { setExportingPdf(false); }
                  }}
                  disabled={exportingPdf || !claimsDebts?.claims?.length}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all disabled:opacity-40"
                  style={{ background: "oklch(0.55 0.18 260 / 12%)", border: "1px solid oklch(0.55 0.18 260 / 25%)", color: "oklch(0.55 0.18 260)" }}>
                  {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  {t.exportPdf}
                </button>
                <button
                  onClick={async () => {
                    if (!claimsDebts) return;
                    setExportingExcel(true);
                    try { await exportClaimsExcel(claimsDebts.claims as ClaimItem[], { totalClaims: claimsDebts.totalClaims }, lang); }
                    finally { setExportingExcel(false); }
                  }}
                  disabled={exportingExcel || !claimsDebts?.claims?.length}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all disabled:opacity-40"
                  style={{ background: "oklch(0.55 0.18 145 / 12%)", border: "1px solid oklch(0.55 0.18 145 / 25%)", color: "oklch(0.55 0.18 145)" }}>
                  {exportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                  {t.exportExcel}
                </button>
              </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: t.totalClaims, value: fmt(claimsDebts?.totalClaims || 0) + " " + t.currency, icon: DollarSign, color: "oklch(0.65 0.15 60)" },
                { label: isAr ? "عدد المطالبات" : "Claims Count", value: String(claimsDebts?.claims?.length || 0), icon: FileText, color: "oklch(0.55 0.18 260)" },
                { label: isAr ? "مطالبات مستحقة (Due)" : "Due Claims", value: String((claimsDebts?.claims || []).filter((c: any) => c.status === 'Due').length), icon: AlertTriangle, color: "oklch(0.6 0.2 20)" },
              ].map((kpi, i) => (
                <div key={i} className="lg-card p-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${kpi.color}20` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{kpi.value}</p>
                  <p className="text-xs opacity-50 mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Claims Table */}
            <div className="lg-card overflow-hidden">
              <div className="overflow-x-auto">
                {claimsLoading ? (
                  <div className="p-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--primary)" }} />
                  </div>
                ) : !claimsDebts?.claims?.length ? (
                  <div className="p-12 text-center">
                    <Receipt className="w-12 h-12 opacity-20 mx-auto mb-3" />
                    <p className="opacity-50 text-sm">{t.noClaims}</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "var(--lg-glass-bg)", borderBottom: "1px solid var(--lg-border)" }}>
                        {[t.projectName, t.projectCode, t.manager, t.paymentTitle, t.payType, t.payAmount, t.status, t.payDate, t.requirements].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-xs font-semibold text-start opacity-60" style={{ color: "var(--foreground)" }}>{h}</th>
                        ))}
                        <th className="px-4 py-3 text-xs font-semibold text-start opacity-60" style={{ color: "var(--foreground)" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(claimsDebts.claims as ClaimItem[]).map((c, i) => {
                        const statusColors: Record<string, string> = {
                          Pending: "oklch(0.65 0.15 60)",
                          Due: "oklch(0.6 0.2 20)",
                        };
                        const statusLabels: Record<string, string> = {
                          Pending: t.statusPending,
                          Due: t.statusDue,
                        };
                        return (
                          <tr key={c.id}
                            style={{ borderBottom: "1px solid var(--lg-border)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.5 0.01 260 / 4%)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>{c.projectName}</td>
                            <td className="px-4 py-3 text-xs opacity-60" style={{ color: "var(--foreground)" }}>{c.projectCode}</td>
                            <td className="px-4 py-3 text-xs opacity-70" style={{ color: "var(--foreground)" }}>{c.manager || "—"}</td>
                            <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>{c.title}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.55 0.18 260 / 12%)", color: "oklch(0.55 0.18 260)" }}>{c.type}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>
                              {c.amount.toLocaleString("en-US")} {c.currency}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: `${statusColors[c.status] || "oklch(0.5 0.01 260)"}15`, color: statusColors[c.status] || "var(--foreground)" }}>
                                {statusLabels[c.status] || c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs tabular-nums opacity-70" style={{ color: "var(--foreground)" }}>{c.date}</td>
                            <td className="px-4 py-3 text-xs opacity-50 max-w-[150px] truncate" style={{ color: "var(--foreground)" }}>{c.requirements || "—"}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => navigate(`/project/${c.projectId}`)}
                                className="text-xs font-medium opacity-60 hover:opacity-100 whitespace-nowrap transition-opacity"
                                style={{ color: "var(--primary)" }}>
                                {t.viewProjectLink} →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "oklch(0.75 0.15 60 / 8%)", borderTop: "2px solid oklch(0.75 0.15 60 / 20%)" }}>
                        <td colSpan={5} className="px-4 py-3 font-bold text-sm" style={{ color: "oklch(0.65 0.15 60)" }}>
                          {isAr ? "الإجمالي" : "TOTAL"}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums" style={{ color: "oklch(0.65 0.15 60)" }}>
                          {(claimsDebts.totalClaims).toLocaleString("en-US")} {isAr ? "ر.س" : "SAR"}
                        </td>
                        <td colSpan={4}></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== DEBTS TAB ===== */}
        {activeTab === "debts" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Banknote className="w-5 h-5" style={{ color: "oklch(0.6 0.2 20)" }} />
                  {t.debtsTitle}
                </h2>
                <p className="text-sm mt-1 opacity-60" style={{ color: "var(--foreground)" }}>{t.debtsDesc}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!claimsDebts) return;
                    setExportingPdf(true);
                    try {
                      await exportDebtsPDF(
                        claimsDebts.debts as DebtItem[],
                        { totalDebts: claimsDebts.totalDebts, totalInvoiced: claimsDebts.totalInvoiced, totalPaid: claimsDebts.totalPaid },
                        lang
                      );
                    } finally { setExportingPdf(false); }
                  }}
                  disabled={exportingPdf || !claimsDebts?.debts?.length}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all disabled:opacity-40"
                  style={{ background: "oklch(0.55 0.18 260 / 12%)", border: "1px solid oklch(0.55 0.18 260 / 25%)", color: "oklch(0.55 0.18 260)" }}>
                  {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  {t.exportPdf}
                </button>
                <button
                  onClick={async () => {
                    if (!claimsDebts) return;
                    setExportingExcel(true);
                    try {
                      await exportDebtsExcel(
                        claimsDebts.debts as DebtItem[],
                        { totalDebts: claimsDebts.totalDebts, totalInvoiced: claimsDebts.totalInvoiced, totalPaid: claimsDebts.totalPaid },
                        lang
                      );
                    } finally { setExportingExcel(false); }
                  }}
                  disabled={exportingExcel || !claimsDebts?.debts?.length}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all disabled:opacity-40"
                  style={{ background: "oklch(0.55 0.18 145 / 12%)", border: "1px solid oklch(0.55 0.18 145 / 25%)", color: "oklch(0.55 0.18 145)" }}>
                  {exportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                  {t.exportExcel}
                </button>
              </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t.totalInvoiced, value: fmt(claimsDebts?.totalInvoiced || 0) + " " + t.currency, icon: Receipt, color: "oklch(0.55 0.18 260)" },
                { label: t.totalPaid, value: fmt(claimsDebts?.totalPaid || 0) + " " + t.currency, icon: TrendingUp, color: "oklch(0.55 0.18 145)" },
                { label: t.totalDebts, value: fmt(claimsDebts?.totalDebts || 0) + " " + t.currency, icon: AlertTriangle, color: "oklch(0.6 0.2 20)" },
                { label: isAr ? "عدد الفواتير" : "Invoice Count", value: String(claimsDebts?.debts?.length || 0), icon: FileText, color: "oklch(0.65 0.15 60)" },
              ].map((kpi, i) => (
                <div key={i} className="lg-card p-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${kpi.color}20` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: i === 2 ? "oklch(0.6 0.2 20)" : "var(--foreground)" }}>{kpi.value}</p>
                  <p className="text-xs opacity-50 mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Debts Table */}
            <div className="lg-card overflow-hidden">
              <div className="overflow-x-auto">
                {claimsLoading ? (
                  <div className="p-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--primary)" }} />
                  </div>
                ) : !claimsDebts?.debts?.length ? (
                  <div className="p-12 text-center">
                    <Banknote className="w-12 h-12 opacity-20 mx-auto mb-3" />
                    <p className="opacity-50 text-sm">{t.noDebts}</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "var(--lg-glass-bg)", borderBottom: "1px solid var(--lg-border)" }}>
                        {[t.projectName, t.projectCode, t.manager, t.invoiceTitle, t.payType, t.invoicedAmount, t.paidAmount, t.outstanding, t.status, t.payDate].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-xs font-semibold text-start opacity-60" style={{ color: "var(--foreground)" }}>{h}</th>
                        ))}
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(claimsDebts.debts as DebtItem[]).map((d, i) => {
                        const statusColors: Record<string, string> = {
                          Claimed: "oklch(0.65 0.15 60)",
                          Invoiced: "oklch(0.6 0.2 20)",
                          PaidPartial: "oklch(0.55 0.18 260)",
                        };
                        const statusLabels: Record<string, string> = {
                          Claimed: t.statusClaimed,
                          Invoiced: t.statusInvoiced,
                          PaidPartial: t.statusPaidPartial,
                        };
                        const collectionRate = d.invoicedAmount > 0 ? (d.paidAmount / d.invoicedAmount) * 100 : 0;
                        return (
                          <tr key={d.id}
                            style={{ borderBottom: "1px solid var(--lg-border)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.5 0.01 260 / 4%)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>{d.projectName}</td>
                            <td className="px-4 py-3 text-xs opacity-60" style={{ color: "var(--foreground)" }}>{d.projectCode}</td>
                            <td className="px-4 py-3 text-xs opacity-70" style={{ color: "var(--foreground)" }}>{d.manager || "—"}</td>
                            <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>{d.title}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.55 0.18 260 / 12%)", color: "oklch(0.55 0.18 260)" }}>{d.type}</span>
                            </td>
                            <td className="px-4 py-3 tabular-nums" style={{ color: "var(--foreground)" }}>
                              {d.invoicedAmount.toLocaleString("en-US")} {d.currency}
                            </td>
                            <td className="px-4 py-3 tabular-nums" style={{ color: "oklch(0.55 0.18 145)" }}>
                              {d.paidAmount.toLocaleString("en-US")} {d.currency}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <span className="font-semibold tabular-nums" style={{ color: d.outstanding > 0 ? "oklch(0.6 0.2 20)" : "oklch(0.55 0.18 145)" }}>
                                  {d.outstanding.toLocaleString("en-US")} {d.currency}
                                </span>
                                {d.invoicedAmount > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <div className="flex-1 rounded-full h-1" style={{ background: "oklch(0.5 0.01 260 / 15%)", minWidth: "50px" }}>
                                      <div className="h-1 rounded-full" style={{ width: `${Math.min(100, collectionRate)}%`, background: "oklch(0.55 0.18 145)" }} />
                                    </div>
                                    <span className="text-[10px] opacity-50 tabular-nums">{collectionRate.toFixed(0)}%</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: `${statusColors[d.status] || "oklch(0.5 0.01 260)"}15`, color: statusColors[d.status] || "var(--foreground)" }}>
                                {statusLabels[d.status] || d.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs tabular-nums opacity-70" style={{ color: "var(--foreground)" }}>{d.date}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => navigate(`/project/${d.projectId}`)}
                                className="text-xs font-medium opacity-60 hover:opacity-100 whitespace-nowrap transition-opacity"
                                style={{ color: "var(--primary)" }}>
                                {t.viewProjectLink} →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "oklch(0.6 0.2 20 / 8%)", borderTop: "2px solid oklch(0.6 0.2 20 / 20%)" }}>
                        <td colSpan={5} className="px-4 py-3 font-bold text-sm" style={{ color: "oklch(0.6 0.2 20)" }}>
                          {isAr ? "الإجمالي" : "TOTAL"}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums" style={{ color: "var(--foreground)" }}>
                          {(claimsDebts.totalInvoiced).toLocaleString("en-US")} {isAr ? "ر.س" : "SAR"}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums" style={{ color: "oklch(0.55 0.18 145)" }}>
                          {(claimsDebts.totalPaid).toLocaleString("en-US")} {isAr ? "ر.س" : "SAR"}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums" style={{ color: "oklch(0.6 0.2 20)" }}>
                          {(claimsDebts.totalDebts).toLocaleString("en-US")} {isAr ? "ر.س" : "SAR"}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
