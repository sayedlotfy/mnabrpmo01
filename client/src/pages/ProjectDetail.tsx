import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import {
  Loader2, ArrowLeft, ArrowRight, Globe, Wallet, TrendingDown, TrendingUp,
  PieChart, Users, Clock, Plus, Trash2, Settings, Target,
  BarChart3, Sparkles, Pause, Play, Receipt, Banknote, AlertTriangle,
  Archive, ArchiveRestore, X
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useAppUser } from "@/contexts/AppUserContext";
import { exportProjectPDF } from "@/lib/exportPdf";
import { FileDown } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LastUpdatedBanner from "@/components/LastUpdatedBanner";
import DurationLogTab from "@/components/DurationLogTab";

// ---- Helper Components ----
function MetricCard({ title, value, subtext, trend, icon: Icon, indicatorColor }: {
  title: string; value: string; subtext?: string; trend?: "up" | "down";
  icon?: React.ElementType; indicatorColor?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="text-muted-foreground text-sm font-medium">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className={`text-2xl font-bold mb-1 ${indicatorColor || ''}`}>{value}</div>
      {subtext && (
        <div className={`text-xs flex items-center gap-1 ${trend === 'down' ? 'text-rose-600' : trend === 'up' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {subtext}
        </div>
      )}
    </Card>
  );
}

function Badge({ children, type = "neutral" }: { children: React.ReactNode; type?: string }) {
  const colors: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800",
    neutral: "bg-slate-100 text-slate-800",
    brand: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || colors.neutral}`}>
      {children}
    </span>
  );
}

// ---- Main Component ----
export default function ProjectDetail() {
  const [matchProjects, paramsProjects] = useRoute("/projects/:id");
  const [matchProject, paramsProject] = useRoute("/project/:id");
  const rawId = paramsProject?.id || paramsProjects?.id;
  const projectId = rawId ? parseInt(rawId) : 0;
  const { lang, toggleLanguage, isRTL, t } = useLanguage();
  const { isPortfolioManager, currentUser } = useAppUser();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [percentComplete, setPercentComplete] = useState(0);
  const [isProjectPaused, setIsProjectPaused] = useState(false);

  // ---- Queries ----
  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { id: projectId }, { enabled: projectId > 0 }
  );
  const { data: staffList = [] } = trpc.staff.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: budgetLaborList = [] } = trpc.budgetLabor.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: budgetExpensesList = [] } = trpc.budgetExpenses.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: timeLogsList = [] } = trpc.timeLogs.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: expensesList = [] } = trpc.expenses.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: paymentsList = [] } = trpc.payments.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const { data: internalTransfersList = [] } = trpc.internalTransfers.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  // ---- Project Phases ----
  const { data: phasesList = [], refetch: refetchPhases } = trpc.projectPhases.list.useQuery(
    { projectId }, { enabled: projectId > 0 }
  );
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDays, setNewPhaseDays] = useState(0);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState("");
  const [editingPhaseDays, setEditingPhaseDays] = useState(0);
  const createPhase = trpc.projectPhases.create.useMutation({ onSuccess: () => { refetchPhases(); setNewPhaseName(""); setNewPhaseDays(0); } });
  const updatePhase = trpc.projectPhases.update.useMutation({ onSuccess: () => { refetchPhases(); setEditingPhaseId(null); } });
  const deletePhase = trpc.projectPhases.delete.useMutation({ onSuccess: () => refetchPhases() });

  // ---- Mutations ----
  const createStaff = trpc.staff.create.useMutation({ onSuccess: () => utils.staff.list.invalidate({ projectId }) });
  const deleteStaff = trpc.staff.delete.useMutation({ onSuccess: () => utils.staff.list.invalidate({ projectId }) });
  const createBudgetLabor = trpc.budgetLabor.create.useMutation({ onSuccess: () => utils.budgetLabor.list.invalidate({ projectId }) });
  const deleteBudgetLabor = trpc.budgetLabor.delete.useMutation({ onSuccess: () => utils.budgetLabor.list.invalidate({ projectId }) });
  const createBudgetExpense = trpc.budgetExpenses.create.useMutation({ onSuccess: () => utils.budgetExpenses.list.invalidate({ projectId }) });
  const deleteBudgetExpense = trpc.budgetExpenses.delete.useMutation({ onSuccess: () => utils.budgetExpenses.list.invalidate({ projectId }) });
  const createTimeLog = trpc.timeLogs.create.useMutation({ onSuccess: () => utils.timeLogs.list.invalidate({ projectId }) });
  const deleteTimeLog = trpc.timeLogs.delete.useMutation({ onSuccess: () => utils.timeLogs.list.invalidate({ projectId }) });
  const createExpense = trpc.expenses.create.useMutation({ onSuccess: () => utils.expenses.list.invalidate({ projectId }) });
  const deleteExpense = trpc.expenses.delete.useMutation({ onSuccess: () => utils.expenses.list.invalidate({ projectId }) });
  const createPayment = trpc.payments.create.useMutation({ onSuccess: () => utils.payments.list.invalidate({ projectId }) });
  const deletePayment = trpc.payments.delete.useMutation({ onSuccess: () => utils.payments.list.invalidate({ projectId }) });
  const createInternalTransfer = trpc.internalTransfers.create.useMutation({ onSuccess: () => utils.internalTransfers.list.invalidate({ projectId }) });
  const updateInternalTransfer = trpc.internalTransfers.update.useMutation({ onSuccess: () => utils.internalTransfers.list.invalidate({ projectId }) });
  const deleteInternalTransfer = trpc.internalTransfers.delete.useMutation({ onSuccess: () => utils.internalTransfers.list.invalidate({ projectId }) });
  const updatePaymentStatus = trpc.payments.updateStatus.useMutation({ onSuccess: () => utils.payments.list.invalidate({ projectId }) });
  const updateProject = trpc.projects.update.useMutation({ onSuccess: () => utils.projects.get.invalidate({ id: projectId }) });
  const archiveMutation = trpc.projects.archive.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); },
    onError: (e) => alert(e.message),
  });
  const unarchiveMutation = trpc.projects.unarchive.useMutation({
    onSuccess: () => { utils.projects.get.invalidate({ id: projectId }); },
    onError: (e) => alert(e.message),
  });
  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => { window.location.href = "/projects"; },
    onError: (e) => alert(e.message),
  });
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePin1, setDeletePin1] = useState("");
  const [deletePin2, setDeletePin2] = useState("");
  const [deleteStep, setDeleteStep] = useState<"pm" | "portfolio">("pm");
  // categorizeExpense removed - AI auto-categorize not available in current API

  // ---- Input States ----
  const [newStaffForm, setNewStaffForm] = useState({ name: "", role: "", baseRate: "", location: "Cairo" as "Cairo" | "Riyadh" });
  const [newBudgetLaborForm, setNewBudgetLaborForm] = useState({ staffId: "", hours: "" });
  const [newBudgetExpenseForm, setNewBudgetExpenseForm] = useState({ category: "Sub-Consultant", amount: "" });
  const [newLogForm, setNewLogForm] = useState({ staffId: "", hours: "", phase: "Concept", desc: "", startDate: "", endDate: "" });
  const [newExpenseForm, setNewExpenseForm] = useState({ category: "Sub-Consultant", amount: "", desc: "", reimbursable: false });
  const [newPaymentForm, setNewPaymentForm] = useState({ title: "", type: "Contract" as "Contract" | "VO", amount: "", date: "", requirements: "" });
  const [newTransferForm, setNewTransferForm] = useState({ recipient: "", department: "Structural", amount: "", date: "", description: "", status: "Pending" as "Pending" | "Paid" });

  // ---- Settings State ----
  const [settingsForm, setSettingsForm] = useState<null | {
    name: string; code: string; manager: string; coordinator: string;
    overheadMultiplier: string; targetMargin: string;
    startDate: string; endDate: string; stoppageDays: number;
  }>(null);

  // Initialize settings form when project loads
  if (project && !settingsForm) {
    setSettingsForm({
      name: project.name as string,
      code: project.code,
      manager: project.manager || "",
      coordinator: project.coordinator || "",
      overheadMultiplier: project.overheadMultiplier,
      targetMargin: project.targetMargin,
      startDate: project.startDate,
      endDate: project.endDate,
      stoppageDays: project.stoppageDays,
    });
    if (Number(project.percentComplete) > 0) {
      setPercentComplete(Number(project.percentComplete));
    }
  }

  // ---- Financial Calculations ----
  const financials = useMemo(() => {
    if (!project) return null;
    const ps = settingsForm || {
      overheadMultiplier: project.overheadMultiplier,
      targetMargin: project.targetMargin,
      startDate: project.startDate,
      endDate: project.endDate,
      stoppageDays: project.stoppageDays,
    };

    const totalContractValue = Number(project.totalContractValue);
    const overheadMultiplier = Number(ps.overheadMultiplier);
    const targetMarginPct = Number(ps.targetMargin);
    const stoppageDays = ps.stoppageDays;

    const voTotal = paymentsList.filter(p => p.type === 'VO').reduce((sum, p) => sum + Number(p.amount), 0);
    const netRevenue = totalContractValue + voTotal;
    const profitTargetAmount = netRevenue * (targetMarginPct / 100);
    const productionBudget = netRevenue - profitTargetAmount;

    // Payments
    const totalInvoiced = paymentsList
      .filter(p => ['Invoiced', 'PaidFull', 'PaidPartial'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalCollected = paymentsList.reduce((sum, p) => {
      if (p.status === 'PaidFull') return sum + Number(p.amount);
      if (p.status === 'PaidPartial') return sum + (Number(p.paidAmount) || 0);
      return sum;
    }, 0);
    const financialCompletionRate = netRevenue > 0 ? (totalInvoiced / netRevenue) * 100 : 0;

    // Stoppage
    const start = new Date(ps.startDate);
    const end = new Date(ps.endDate);
    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyProfitTarget = profitTargetAmount / durationDays;
    const stoppageLoss = dailyProfitTarget * stoppageDays * 0.40;

    // Labor costs
    let totalLaborLoaded = 0;
    let riyadhCost = 0;
    let cairoCost = 0;
    let totalActualHours = 0;

    timeLogsList.forEach(log => {
      const person = staffList.find(s => s.id === Number(log.staffId));
      if (person) {
        const direct = Number(log.hours) * Number(person.baseRate);
        const loaded = direct * overheadMultiplier;
        totalLaborLoaded += loaded;
        totalActualHours += Number(log.hours);
        if (person.location === "Riyadh") riyadhCost += loaded;
        else cairoCost += loaded;
      }
    });

    const totalExpenses = expensesList.reduce((sum, exp) => exp.reimbursable ? sum : sum + Number(exp.amount), 0);
    const totalInternalTransfers = internalTransfersList.reduce((sum, tr) => sum + Number(tr.amount), 0);
    const totalBurn = totalLaborLoaded + totalExpenses + totalInternalTransfers + stoppageLoss;

    // Budget estimates
    let totalEstLaborCost = 0;
    let totalEstHours = 0;
    budgetLaborList.forEach(item => {
      const person = staffList.find(s => s.id === Number(item.staffId));
      if (person) {
        totalEstLaborCost += Number(item.hours) * Number(person.baseRate) * overheadMultiplier;
        totalEstHours += Number(item.hours);
      }
    });
    const totalEstExpenses = budgetExpensesList.reduce((sum, item) => sum + Number(item.amount), 0);
    const BAC = totalEstLaborCost + totalEstExpenses;

    const EV = BAC * (percentComplete / 100);
    const CPI = totalBurn > 0 ? (EV / totalBurn) : 0;
    const isUnderBudget = CPI >= 1;
    const currentMargin = netRevenue > 0 ? ((netRevenue - totalBurn) / netRevenue) * 100 : 0;
    const budgetUtilized = productionBudget > 0 ? (totalBurn / productionBudget) * 100 : 0;

    return {
      netRevenue, productionBudget, totalLaborLoaded, totalExpenses, totalInternalTransfers, totalBurn,
      currentMargin, budgetUtilized, riyadhCost, cairoCost, BAC,
      totalEstLaborCost, totalEstExpenses, totalEstHours, totalActualHours,
      EV, CPI, isUnderBudget, durationDays, stoppageLoss, dailyProfitTarget,
      totalInvoiced, totalCollected, financialCompletionRate,
      overheadMultiplier, targetMarginPct, stoppageDays, totalContractValue,
    };
  }, [project, settingsForm, staffList, timeLogsList, expensesList, budgetLaborList, budgetExpensesList, percentComplete, paymentsList, internalTransfersList]);

  // ---- Formatters ----
  const currency = project?.currency || "SAR";
  const fmtMoney = (val: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(val);
  const fmtPct = (val: number) => `${val.toFixed(1)}%`;
  const fmtNum = (val: number) => new Intl.NumberFormat('en-US').format(val);

  // ---- Handlers ----
  const handleAddStaff = () => {
    if (!newStaffForm.name || !newStaffForm.baseRate) return;
    createStaff.mutate({ projectId, name: newStaffForm.name, role: newStaffForm.role, baseRate: newStaffForm.baseRate, location: newStaffForm.location });
    setNewStaffForm({ name: "", role: "", baseRate: "", location: "Cairo" });
  };

  const handleAddBudgetLabor = () => {
    if (!newBudgetLaborForm.staffId || !newBudgetLaborForm.hours) return;
    createBudgetLabor.mutate({ projectId, staffId: Number(newBudgetLaborForm.staffId), hours: newBudgetLaborForm.hours });
    setNewBudgetLaborForm({ staffId: "", hours: "" });
  };

  const handleAddBudgetExpense = () => {
    if (!newBudgetExpenseForm.amount) return;
    createBudgetExpense.mutate({ projectId, category: newBudgetExpenseForm.category, amount: newBudgetExpenseForm.amount });
    setNewBudgetExpenseForm({ category: "Sub-Consultant", amount: "" });
  };

  const handleAddLog = () => {
    if (!newLogForm.staffId || !newLogForm.hours) return;
    createTimeLog.mutate({
      projectId, staffId: Number(newLogForm.staffId), hours: newLogForm.hours,
      phase: newLogForm.phase, description: newLogForm.desc,
      startDate: newLogForm.startDate, endDate: newLogForm.endDate,
    });
    setNewLogForm({ ...newLogForm, hours: "", desc: "" });
  };

  const handleAddExpense = () => {
    if (!newExpenseForm.amount) return;
    createExpense.mutate({
      projectId, category: newExpenseForm.category, amount: newExpenseForm.amount,
      description: newExpenseForm.desc, reimbursable: newExpenseForm.reimbursable,
    });
    setNewExpenseForm({ ...newExpenseForm, amount: "", desc: "" });
  };

  const handleAddPayment = () => {
    if (!newPaymentForm.title || !newPaymentForm.amount) return;
    createPayment.mutate({
      projectId, title: newPaymentForm.title, type: newPaymentForm.type,
      amount: newPaymentForm.amount, date: newPaymentForm.date,
      requirements: newPaymentForm.requirements,
    });
    setNewPaymentForm({ title: "", type: "Contract", amount: "", date: "", requirements: "" });
  };

  const handleAddTransfer = () => {
    if (!newTransferForm.recipient || !newTransferForm.amount) return;
    createInternalTransfer.mutate({
      projectId,
      recipient: newTransferForm.recipient,
      department: newTransferForm.department,
      amount: newTransferForm.amount,
      date: newTransferForm.date || new Date().toISOString().slice(0, 10),
      description: newTransferForm.description,
      status: newTransferForm.status,
    });
    setNewTransferForm({ recipient: "", department: "Structural", amount: "", date: "", description: "", status: "Pending" });
  };

  const handleAutoCategorize = async () => {
    // Auto-categorize is not available without AI integration
    // Just a placeholder for now
  };

  const handleSaveSettings = () => {
    if (!settingsForm) return;
    updateProject.mutate({
      id: projectId,
      name: settingsForm.name,
      code: settingsForm.code,
      manager: settingsForm.manager,
      coordinator: settingsForm.coordinator,
      overheadMultiplier: settingsForm.overheadMultiplier,
      targetMargin: settingsForm.targetMargin,
      startDate: settingsForm.startDate,
      endDate: settingsForm.endDate,
      stoppageDays: settingsForm.stoppageDays,
      percentComplete: String(percentComplete),
    });
  };

  const handleSaveProgress = () => {
    updateProject.mutate({ id: projectId, percentComplete: String(percentComplete) });
  };

  // ---- Loading / Error ----
  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project || !financials) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t.error}</h2>
          <p className="text-muted-foreground">{t.noData}</p>
          <Button className="mt-4" asChild><Link href="/projects">{t.backToProjects}</Link></Button>
        </div>
      </div>
    );
  }

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // ============ TABS ============
  const tabs = [
    { key: "dashboard", label: t.dashboard },
    { key: "budget", label: t.budgeting },
    { key: "logs", label: t.timeExpenses },
    { key: "payments", label: t.payments },
    { key: "timeline", label: t.timelineTab || (lang === 'ar' ? 'الجدول الزمني والمدة' : 'Timeline & Duration') },
    { key: "settings", label: t.settings },
  ];

  // ============ RENDER DASHBOARD ============
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* EVM + Stoppage */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="bg-slate-900 text-white border-none flex-1 p-4">
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  {t.earnedValueTitle}
                </h3>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{t.financialCompletion}</span>
                  <span className="text-2xl font-bold text-emerald-400">{fmtPct(financials.financialCompletionRate)}</span>
                  <span className="text-[10px] text-slate-500 block">{t.finCompDesc}</span>
                </div>
              </div>
              <div className="mb-4 mt-2">
                <label className="text-xs text-slate-400 mb-1 block">{t.progress}</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="0" max="100" value={percentComplete}
                    onChange={(e) => setPercentComplete(Number(e.target.value))}
                    onMouseUp={handleSaveProgress} onTouchEnd={handleSaveProgress}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  <span className="text-xl font-bold font-mono text-emerald-400">{percentComplete}%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mt-auto">
              <div className="bg-slate-800 p-2 rounded">
                <span className="text-xs text-slate-400 block">{t.budgetVsActual}</span>
                <span className="font-bold text-sm block">{fmtMoney(financials.BAC)}</span>
                <span className="text-xs text-slate-500">vs {fmtMoney(financials.totalBurn)}</span>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <span className="text-xs text-slate-400 block">{t.ev}</span>
                <span className="font-bold text-lg text-emerald-300 block">{fmtMoney(financials.EV)}</span>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <span className="text-xs text-slate-400 block">{t.cpi}</span>
                <span className={`font-bold text-lg block ${financials.isUnderBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {financials.CPI.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500">{t.cpiDesc}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Project Status Badge — full controls in Timeline tab */}
        <Card className={`w-full md:w-56 border-2 p-4 flex flex-col items-center justify-center gap-3`}
          style={{
            borderColor: (project?.isPaused) ? 'oklch(0.75 0.15 20)' : 'oklch(0.75 0.15 145)',
            background: (project?.isPaused) ? 'oklch(0.97 0.01 20)' : 'oklch(0.97 0.01 145)'
          }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: (project?.isPaused) ? 'oklch(0.92 0.04 20)' : 'oklch(0.92 0.04 145)' }}>
            {(project?.isPaused)
              ? <Pause className="w-7 h-7" style={{ color: 'oklch(0.55 0.18 20)' }} />
              : <Play className="w-7 h-7" style={{ color: 'oklch(0.45 0.18 145)' }} />}
          </div>
          <div className="text-center">
            <div className="font-bold text-sm"
              style={{ color: (project?.isPaused) ? 'oklch(0.45 0.18 20)' : 'oklch(0.35 0.18 145)' }}>
              {(project?.isPaused) ? t.statusPaused : t.statusActive}
            </div>
            {(project?.stoppageDays ?? 0) > 0 && (
              <div className="text-2xl font-mono font-bold mt-1"
                style={{ color: 'oklch(0.55 0.18 20)' }}>
                {project?.stoppageDays}
                <span className="text-xs font-normal ms-1" style={{ color: 'var(--muted-foreground)' }}>
                  {t.stoppageDays}
                </span>
              </div>
            )}
            <div className="text-xs mt-2 opacity-60" style={{ color: 'var(--muted-foreground)' }}>
              {lang === 'ar' ? '← تاب سجل المدة' : 'Timeline tab →'}
            </div>
          </div>
        </Card>
      </div>

      {/* Stoppage Financial Impact Alert */}
      {(project?.isPaused || (project?.stoppageDays ?? 0) > 0) && (
        <Card className="p-4" style={{ background: 'oklch(0.97 0.01 20)', border: '1px solid oklch(0.85 0.05 20)' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" style={{ color: '#ef4444' }} />
              <div>
                <h4 className="font-bold text-sm">{t.stoppageAnalysis}</h4>
                <p className="text-xs mt-0.5 opacity-80">{t.stoppageDesc}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-xl font-bold" style={{ color: '#ef4444' }}>-{fmtMoney(financials.stoppageLoss)}</span>
              <span className="text-xs">{financials.stoppageDays} {t.stoppageDays}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title={t.totalContractValue} value={fmtMoney(financials.netRevenue)} subtext={t.approvedFee} icon={Wallet} />
        <MetricCard title={t.totalBurn} value={fmtMoney(financials.totalBurn)}
          subtext={`${t.includesOverhead} ${financials.overheadMultiplier}x`}
          trend={financials.CPI < 1 ? "down" : "up"} icon={TrendingDown}
          indicatorColor={financials.CPI < 1 ? "text-rose-600" : ""} />
        <MetricCard title={t.remainingBudget} value={fmtMoney(financials.productionBudget - financials.totalBurn)}
          subtext={`${t.prodBudget}: ${fmtMoney(financials.productionBudget)}`} icon={PieChart} />
        <MetricCard title={t.currentMargin} value={fmtPct(financials.currentMargin)}
          subtext={`${t.target}: ${financials.targetMarginPct}%`}
          trend={financials.currentMargin < financials.targetMarginPct ? "down" : "up"} icon={TrendingUp} />
      </div>

      {/* Variance + Cost Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" /> {t.varianceAnalysis}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Actual Cost (AC)</span><span>Estimated Cost (BAC)</span></div>
              <div className="relative h-6 bg-slate-100 rounded overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 bg-slate-300 border-r border-white" style={{ width: '100%' }} />
                <div className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${financials.totalBurn > financials.BAC ? 'bg-rose-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(financials.BAC > 0 ? (financials.totalBurn / financials.BAC) * 100 : 0, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1 font-bold"><span>{fmtMoney(financials.totalBurn)}</span><span>{fmtMoney(financials.BAC)}</span></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span>Actual Hours</span><span>Estimated Hours</span></div>
              <div className="relative h-6 bg-slate-100 rounded overflow-hidden">
                <div className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${financials.totalActualHours > financials.totalEstHours ? 'bg-rose-400' : 'bg-indigo-400'}`}
                  style={{ width: `${Math.min(financials.totalEstHours > 0 ? (financials.totalActualHours / financials.totalEstHours) * 100 : 0, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1 font-bold"><span>{fmtNum(financials.totalActualHours)} h</span><span>{fmtNum(financials.totalEstHours)} h</span></div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> {t.costDist}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-sm font-medium">{t.riyadhMgmt}</span>
              <span className="font-bold">{fmtMoney(financials.riyadhCost)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-sm font-medium">{t.cairoProd}</span>
              <span className="font-bold">{fmtMoney(financials.cairoCost)}</span>
            </div>
                    <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">{t.extExpenses}</span>
              <span className="font-bold">{fmtMoney(financials.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-amber-500" />
                {t.internalTransfers}
              </span>
              <span className="font-bold text-amber-700">{fmtMoney(financials.totalInternalTransfers)}</span>
            </div>
            {financials.stoppageDays > 0 && (
              <div className="flex justify-between items-center p-2 bg-rose-50 rounded border border-rose-100">
                <span className="text-sm font-medium text-rose-800">{t.stoppageCost}</span>
                <span className="font-bold text-rose-700">{fmtMoney(financials.stoppageLoss)}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  // ============ RENDER BUDGET ============
  const renderBudget = () => (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <span className="block text-sm text-muted-foreground">{t.totalEstCost}</span>
            <span className="block text-xl font-bold">{fmtMoney(financials.BAC)}</span>
          </div>
          <div>
            <span className="block text-sm text-muted-foreground">{t.plannedProfit}</span>
            <span className="block text-xl font-bold text-emerald-700">{fmtMoney(financials.totalContractValue - financials.BAC)}</span>
          </div>
          <div>
            <span className="block text-sm text-muted-foreground">{t.marginPotential}</span>
            <span className="block text-xl font-bold text-emerald-700">
              {fmtPct(financials.totalContractValue > 0 ? ((financials.totalContractValue - financials.BAC) / financials.totalContractValue) * 100 : 0)}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Labor Budget */}
        <Card className="flex-1 p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-muted-foreground" />{t.laborBudget}</h3>
          <div className="flex gap-2 mb-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground">{t.staffMember}</label>
              <select className="w-full text-sm border rounded p-1 bg-background"
                value={newBudgetLaborForm.staffId}
                onChange={(e) => setNewBudgetLaborForm({ ...newBudgetLaborForm, staffId: e.target.value })}>
                <option value="">{t.selectResource}</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({fmtMoney(Number(s.baseRate) * financials.overheadMultiplier)}/h)</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs font-bold text-muted-foreground">{t.estHours}</label>
              <input type="number" className="w-full text-sm border rounded p-1" value={newBudgetLaborForm.hours}
                onChange={(e) => setNewBudgetLaborForm({ ...newBudgetLaborForm, hours: e.target.value })} />
            </div>
            <Button size="sm" onClick={handleAddBudgetLabor}><Plus className="w-4 h-4" /></Button>
          </div>
          <table className="w-full text-sm text-start">
            <thead className="bg-muted text-muted-foreground">
              <tr><th className="p-2 text-start">{t.role}</th><th className="p-2 text-start">{t.estHours}</th><th className="p-2 text-start">{t.estCost}</th><th></th></tr>
            </thead>
            <tbody className="divide-y">
              {budgetLaborList.map(item => {
                const person = staffList.find(s => s.id === Number(item.staffId));
                const cost = person ? Number(item.hours) * Number(person.baseRate) * financials.overheadMultiplier : 0;
                return (
                  <tr key={item.id}>
                    <td className="p-2">{person?.name}</td>
                    <td className="p-2">{item.hours}</td>
                    <td className="p-2 font-medium">{fmtMoney(cost)}</td>
                    <td className="p-2 text-end">
                      <button onClick={() => deleteBudgetLabor.mutate({ id: item.id })} className="text-rose-400"><Trash2 className="w-3 h-3" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Expense Budget */}
        <Card className="flex-1 p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-muted-foreground" />{t.expenseBudget}</h3>
          <div className="flex gap-2 mb-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground">{t.category}</label>
              <select className="w-full text-sm border rounded p-1 bg-background"
                value={newBudgetExpenseForm.category}
                onChange={(e) => setNewBudgetExpenseForm({ ...newBudgetExpenseForm, category: e.target.value })}>
                <option value="Sub-Consultant">Sub-Consultant</option>
                <option value="Printing">Printing</option>
                <option value="Travel">Travel</option>
                <option value="Software License">Software License</option>
                <option value="Commission">Commission</option>
                <option value="Others">{t.others}</option>
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs font-bold text-muted-foreground">{t.amount}</label>
              <input type="number" className="w-full text-sm border rounded p-1" value={newBudgetExpenseForm.amount}
                onChange={(e) => setNewBudgetExpenseForm({ ...newBudgetExpenseForm, amount: e.target.value })} />
            </div>
            <Button size="sm" onClick={handleAddBudgetExpense}><Plus className="w-4 h-4" /></Button>
          </div>
          <table className="w-full text-sm text-start">
            <thead className="bg-muted text-muted-foreground">
              <tr><th className="p-2 text-start">{t.category}</th><th className="p-2 text-start">{t.amount}</th><th></th></tr>
            </thead>
            <tbody className="divide-y">
              {budgetExpensesList.map(item => (
                <tr key={item.id}>
                  <td className="p-2">{item.category}</td>
                  <td className="p-2 font-medium">{fmtMoney(Number(item.amount))}</td>
                  <td className="p-2 text-end">
                    <button onClick={() => deleteBudgetExpense.mutate({ id: item.id })} className="text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );

  // ============ RENDER LOGS ============
  const renderLogs = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Time Log */}
        <Card className="flex-1 p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-muted-foreground" />{t.logHours}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.staffMember}</label>
              <select className="w-full border rounded p-2 text-sm bg-background" value={newLogForm.staffId}
                onChange={(e) => setNewLogForm({ ...newLogForm, staffId: e.target.value })}>
                <option value="">{t.selectResource}</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.hoursSpent}</label>
              <input type="number" className="w-full border rounded p-2 text-sm" value={newLogForm.hours}
                onChange={(e) => setNewLogForm({ ...newLogForm, hours: e.target.value })} placeholder="0.0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.phase}</label>
              <select className="w-full border rounded p-2 text-sm bg-background" value={newLogForm.phase}
                onChange={(e) => setNewLogForm({ ...newLogForm, phase: e.target.value })}>
                <option>Concept</option><option>Schematic</option><option>Design Dev (DD)</option>
                <option>Construction Doc (CD)</option><option>Tender</option><option value="Other">{t.phaseOther}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.description}</label>
              <input type="text" className="w-full border rounded p-2 text-sm" value={newLogForm.desc}
                onChange={(e) => setNewLogForm({ ...newLogForm, desc: e.target.value })} placeholder={t.taskDetail} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.periodFrom}</label>
              <input type="date" className="w-full border rounded p-2 text-sm" value={newLogForm.startDate}
                onChange={(e) => setNewLogForm({ ...newLogForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.periodTo}</label>
              <input type="date" className="w-full border rounded p-2 text-sm" value={newLogForm.endDate}
                onChange={(e) => setNewLogForm({ ...newLogForm, endDate: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleAddLog} className="w-full justify-center"><Plus className="w-4 h-4" /> {t.addTimeLog}</Button>
        </Card>

        {/* Expense Log */}
        <Card className="flex-1 p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-muted-foreground" />{t.logExpenses}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.description}</label>
              <div className="flex gap-2">
                <input type="text" className="w-full border rounded p-2 text-sm" value={newExpenseForm.desc}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, desc: e.target.value })}
                  placeholder={lang === 'ar' ? 'اكتب الوصف ثم اضغط التصنيف التلقائي...' : 'e.g. Flight to Dubai...'} />
                <Button variant="outline" onClick={handleAutoCategorize}
                  disabled={!newExpenseForm.desc} className="whitespace-nowrap px-3">
                  <Sparkles className="w-4 h-4" />
                  {t.aiCategorize}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.category}</label>
              <select className="w-full border rounded p-2 text-sm bg-muted" value={newExpenseForm.category}
                onChange={(e) => setNewExpenseForm({ ...newExpenseForm, category: e.target.value })}>
                <option value="Sub-Consultant">Sub-Consultant</option><option value="Printing">Printing</option>
                <option value="Travel">Travel</option><option value="Software License">Software License</option>
                <option value="Commission">Commission</option><option value="Others">{t.others}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t.amount}</label>
              <input type="number" className="w-full border rounded p-2 text-sm" value={newExpenseForm.amount}
                onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={newExpenseForm.reimbursable}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, reimbursable: e.target.checked })}
                  className="rounded text-blue-600" />
                <span className="text-sm">{t.reimbursable}</span>
              </label>
            </div>
          </div>
          <Button variant="secondary" onClick={handleAddExpense} className="w-full justify-center mt-auto">
            <Plus className="w-4 h-4" /> {t.addExpense}
          </Button>
        </Card>
      </div>

      {/* Internal Transfers */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Banknote className="w-5 h-5 text-amber-500" />
            {t.internalTransfers}
          </h3>
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
              {t.totalTransfers}: {fmtMoney(financials.totalInternalTransfers)}
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {internalTransfersList.filter(tr => tr.status === 'Pending').length} {t.transfersPending}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{t.internalTransfersDesc}</p>

        {/* Add Transfer Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-muted/40">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t.recipient}</label>
            <input type="text" className="w-full border rounded p-2 text-sm bg-background" value={newTransferForm.recipient}
              onChange={(e) => setNewTransferForm({ ...newTransferForm, recipient: e.target.value })}
              placeholder={lang === 'ar' ? 'اسم المستفيد...' : 'Recipient name...'} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t.department}</label>
            <select className="w-full border rounded p-2 text-sm bg-background" value={newTransferForm.department}
              onChange={(e) => setNewTransferForm({ ...newTransferForm, department: e.target.value })}>
              <option value="Structural">{lang === 'ar' ? 'الإنشائي' : 'Structural'}</option>
              <option value="MEP">{lang === 'ar' ? 'الميكانيكا والكهرباء' : 'MEP'}</option>
              <option value="IT">{lang === 'ar' ? 'تقنية المعلومات' : 'IT'}</option>
              <option value="Admin">{lang === 'ar' ? 'الإدارة' : 'Admin'}</option>
              <option value="Finance">{lang === 'ar' ? 'المالية' : 'Finance'}</option>
              <option value="HR">{lang === 'ar' ? 'الموارد البشرية' : 'HR'}</option>
              <option value="Marketing">{lang === 'ar' ? 'التسويق' : 'Marketing'}</option>
              <option value="Other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t.amount}</label>
            <input type="number" className="w-full border rounded p-2 text-sm bg-background" value={newTransferForm.amount}
              onChange={(e) => setNewTransferForm({ ...newTransferForm, amount: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t.transferDate}</label>
            <input type="date" className="w-full border rounded p-2 text-sm bg-background" value={newTransferForm.date}
              onChange={(e) => setNewTransferForm({ ...newTransferForm, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t.description}</label>
            <input type="text" className="w-full border rounded p-2 text-sm bg-background" value={newTransferForm.description}
              onChange={(e) => setNewTransferForm({ ...newTransferForm, description: e.target.value })}
              placeholder={lang === 'ar' ? 'ملاحظات...' : 'Notes...'} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t.transferStatus}</label>
            <select className="w-full border rounded p-2 text-sm bg-background" value={newTransferForm.status}
              onChange={(e) => setNewTransferForm({ ...newTransferForm, status: e.target.value as 'Pending' | 'Paid' })}>
              <option value="Pending">{t.statusPending}</option>
              <option value="Paid">{t.statusPaid}</option>
            </select>
          </div>
        </div>
        <Button onClick={handleAddTransfer} variant="outline" className="w-full justify-center mb-4 border-amber-300 text-amber-700 hover:bg-amber-50">
          <Plus className="w-4 h-4" /> {t.addTransfer}
        </Button>

        {/* Transfers Table */}
        {internalTransfersList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-2 text-start">{t.recipient}</th>
                  <th className="p-2 text-start">{t.department}</th>
                  <th className="p-2 text-start">{t.amount}</th>
                  <th className="p-2 text-start">{t.transferDate}</th>
                  <th className="p-2 text-start">{t.description}</th>
                  <th className="p-2 text-start">{t.transferStatus}</th>
                  <th className="p-2 text-end">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {internalTransfersList.map(tr => (
                  <tr key={tr.id}>
                    <td className="p-2 font-medium">{tr.recipient}</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{tr.department}</span>
                    </td>
                    <td className="p-2 font-semibold text-amber-700">{fmtMoney(Number(tr.amount))}</td>
                    <td className="p-2 text-muted-foreground text-xs">{tr.date}</td>
                    <td className="p-2 text-muted-foreground text-xs">{tr.description || '-'}</td>
                    <td className="p-2">
                      <select
                        className="text-xs border rounded px-1 py-0.5 bg-background"
                        value={tr.status}
                        onChange={(e) => updateInternalTransfer.mutate({ id: tr.id, status: e.target.value as 'Pending' | 'Paid' })}>
                        <option value="Pending">{t.statusPending}</option>
                        <option value="Paid">{t.statusPaid}</option>
                      </select>
                    </td>
                    <td className="p-2 text-end">
                      <button onClick={() => deleteInternalTransfer.mutate({ id: tr.id })} className="text-rose-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted font-bold">
                <tr>
                  <td colSpan={2} className="p-2">{lang === 'ar' ? 'الإجمالي' : 'Total'}</td>
                  <td className="p-2 text-amber-700">{fmtMoney(financials.totalInternalTransfers)}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground italic text-sm">{t.noTransfers}</div>
        )}
      </Card>

      {/* Recent Transactions */}
      <Card className="p-4">
        <h3 className="font-bold mb-4">{t.recentTrans}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-start">{t.type}</th><th className="p-3 text-start">{t.description}</th>
                <th className="p-3 text-start">{t.dateRange}</th><th className="p-3 text-start">{t.costType}</th>
                <th className="p-3 text-start">{t.amount} / {t.costType}</th><th className="p-3 text-end">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {timeLogsList.map(log => {
                const person = staffList.find(s => s.id === Number(log.staffId));
                const cost = person ? Number(log.hours) * Number(person.baseRate) * financials.overheadMultiplier : 0;
                return (
                  <tr key={`log-${log.id}`}>
                    <td className="p-3 flex items-center gap-2"><Badge type="neutral">{t.labor}</Badge><span className="font-medium">{person?.name}</span></td>
                    <td className="p-3 text-muted-foreground">{log.description} ({log.phase === 'Other' ? t.phaseOther : log.phase})</td>
                    <td className="p-3 text-muted-foreground text-xs">{log.startDate} → {log.endDate}</td>
                    <td className="p-3">{t.loadedCost}</td>
                    <td className="p-3 font-medium">{fmtMoney(cost)}</td>
                    <td className="p-3 text-end">
                      <button onClick={() => deleteTimeLog.mutate({ id: log.id })} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {expensesList.map(exp => (
                <tr key={`exp-${exp.id}`}>
                  <td className="p-3"><Badge type={exp.reimbursable ? "success" : "warning"}>{t.expense}</Badge></td>
                  <td className="p-3 text-muted-foreground">{exp.description} ({exp.category})</td>
                  <td className="p-3 text-muted-foreground text-xs">-</td>
                  <td className="p-3">{exp.reimbursable ? t.reimbursable : t.directCost}</td>
                  <td className="p-3 font-medium">{fmtMoney(Number(exp.amount))}</td>
                  <td className="p-3 text-end">
                    <button onClick={() => deleteExpense.mutate({ id: exp.id })} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {timeLogsList.length === 0 && expensesList.length === 0 && (
            <div className="p-6 text-center text-muted-foreground italic">{t.noEntries}</div>
          )}
        </div>
      </Card>
    </div>
  );

  // ============ RENDER PAYMENTS ============
  const renderPayments = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title={t.totalContractValue} value={fmtMoney(financials.netRevenue)} subtext="Base + VOs" icon={Wallet} />
        <MetricCard title={t.totalInvoiced} value={fmtMoney(financials.totalInvoiced)}
          subtext={`Pending: ${fmtMoney(financials.netRevenue - financials.totalInvoiced)}`} icon={Receipt} />
        <MetricCard title={t.totalCollected} value={fmtMoney(financials.totalCollected)}
          subtext={`${t.outstanding}: ${fmtMoney(financials.totalInvoiced - financials.totalCollected)}`} icon={Banknote} />
      </div>

      <Card className="p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-muted-foreground" />{t.addPayment}</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-muted-foreground mb-1">{t.payTitle}</label>
            <input type="text" className="w-full text-sm border rounded p-2" value={newPaymentForm.title}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{t.payType}</label>
            <select className="w-full text-sm border rounded p-2 bg-background" value={newPaymentForm.type}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, type: e.target.value as "Contract" | "VO" })}>
              <option value="Contract">{t.typeContract}</option><option value="VO">{t.typeVO}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{t.payAmount}</label>
            <input type="number" className="w-full text-sm border rounded p-2" value={newPaymentForm.amount}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, amount: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">{t.payDate}</label>
            <input type="date" className="w-full text-sm border rounded p-2" value={newPaymentForm.date}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, date: e.target.value })} />
          </div>
          <Button onClick={handleAddPayment} className="h-9 justify-center">{t.add}</Button>
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-muted-foreground mb-1">{t.payReq}</label>
            <input type="text" className="w-full text-sm border rounded p-2" value={newPaymentForm.requirements}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, requirements: e.target.value })} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-start">{t.payTitle}</th><th className="p-3 text-start">{t.payType}</th>
                <th className="p-3 text-start">{t.payDate}</th><th className="p-3 text-start">{t.payReq}</th>
                <th className="p-3 text-start">{t.payAmount}</th><th className="p-3 text-start">{t.payStatus}</th>
                <th className="p-3 text-end">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paymentsList.map(p => (
                <tr key={p.id} className={p.type === 'VO' ? 'bg-amber-50/50' : ''}>
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3"><Badge type={p.type === 'VO' ? 'warning' : 'neutral'}>{p.type === 'VO' ? t.typeVO : t.typeContract}</Badge></td>
                  <td className="p-3">{p.date}</td>
                  <td className="p-3 text-muted-foreground max-w-xs truncate">{p.requirements}</td>
                  <td className="p-3 font-bold">{fmtMoney(Number(p.amount))}</td>
                  <td className="p-3">
                    <select value={p.status}
                      onChange={(e) => updatePaymentStatus.mutate({ id: p.id, status: e.target.value as any })}
                      className={`text-xs p-1 rounded border-none font-medium cursor-pointer focus:ring-0
                        ${p.status === 'PaidFull' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'Invoiced' ? 'bg-purple-100 text-purple-800' :
                          p.status === 'Due' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                      <option value="Pending">{t.statusPending}</option><option value="Due">{t.statusDue}</option>
                      <option value="Claimed">{t.statusClaimed}</option><option value="Invoiced">{t.statusInvoiced}</option>
                      <option value="PaidPartial">{t.statusPaidPartial}</option><option value="PaidFull">{t.statusPaidFull}</option>
                    </select>
                  </td>
                  <td className="p-3 text-end">
                    <button onClick={() => deletePayment.mutate({ id: p.id })} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // ============ RENDER SETTINGS ============
  const renderSettings = () => {
    if (!settingsForm) return null;
    return (
      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="font-bold mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-muted-foreground" />{t.projectParams}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">{t.projectName}</label>
              <input type="text" value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.projectCode}</label>
              <input type="text" value={settingsForm.code} onChange={(e) => setSettingsForm({ ...settingsForm, code: e.target.value })}
                className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.totalContractValue}</label>
              <input type="number" value={project.totalContractValue} readOnly
                className="w-full border rounded p-2 bg-muted cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-1">يُحسب تلقائياً من مجموع الدفعات وأوامر التغيير</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.overhead}</label>
              <input type="number" step="0.01" value={settingsForm.overheadMultiplier} onChange={(e) => setSettingsForm({ ...settingsForm, overheadMultiplier: e.target.value })}
                className="w-full border rounded p-2" />
              <p className="text-xs text-muted-foreground mt-1">{t.overheadNote}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.targetMargin}</label>
              <input type="number" value={settingsForm.targetMargin} onChange={(e) => setSettingsForm({ ...settingsForm, targetMargin: e.target.value })}
                className="w-full border rounded p-2" />
              <p className="text-xs text-muted-foreground mt-1">{t.marginNote}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.projectManager}</label>
              <input type="text" value={settingsForm.manager} onChange={(e) => setSettingsForm({ ...settingsForm, manager: e.target.value })}
                className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.projectCoordinator}</label>
              <input type="text" value={settingsForm.coordinator} onChange={(e) => setSettingsForm({ ...settingsForm, coordinator: e.target.value })}
                className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.startDate}</label>
              <input type="date" value={settingsForm.startDate} onChange={(e) => setSettingsForm({ ...settingsForm, startDate: e.target.value })}
                className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.endDate}</label>
              <input type="date" value={settingsForm.endDate} onChange={(e) => setSettingsForm({ ...settingsForm, endDate: e.target.value })}
                className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-rose-600">{t.stoppageDays}</label>
              <input type="number" value={settingsForm.stoppageDays} onChange={(e) => setSettingsForm({ ...settingsForm, stoppageDays: Number(e.target.value) })}
                className="w-full border border-rose-300 rounded p-2 bg-rose-50" />
              <p className="text-xs text-rose-500 mt-1">{t.stoppageDesc}</p>
            </div>
          </div>
          <Button className="mt-6" onClick={handleSaveSettings} disabled={updateProject.isPending}>
            {updateProject.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t.save}
          </Button>
        </Card>

        {/* Staff Rate Card */}
        <Card className="p-4">
          <h3 className="font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-muted-foreground" />{t.staffRateCard}</h3>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2 items-end bg-muted p-3 rounded">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground">{t.name}</label>
              <input type="text" value={newStaffForm.name} onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })} className="w-full text-sm p-1 border rounded" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">{t.role}</label>
              <input type="text" value={newStaffForm.role} onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value })} className="w-full text-sm p-1 border rounded" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">{t.baseRate}</label>
              <input type="number" value={newStaffForm.baseRate} onChange={e => setNewStaffForm({ ...newStaffForm, baseRate: e.target.value })} className="w-full text-sm p-1 border rounded" />
            </div>
            <Button onClick={handleAddStaff} className="h-8 justify-center">{t.add}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-start">{t.name}</th><th className="p-2 text-start">{t.role}</th>
                  <th className="p-2 text-start">{t.location}</th><th className="p-2 text-start">{t.baseRate}</th>
                  <th className="p-2 text-start">{t.loadedRate} (x{financials.overheadMultiplier})</th>
                  <th className="p-2 text-end">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staffList.map(s => (
                  <tr key={s.id}>
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className="p-2 text-muted-foreground">{s.role}</td>
                    <td className="p-2"><Badge type={s.location === "Riyadh" ? "brand" : "neutral"}>{s.location}</Badge></td>
                    <td className="p-2">{fmtMoney(Number(s.baseRate))}</td>
                    <td className="p-2 font-bold">{fmtMoney(Number(s.baseRate) * financials.overheadMultiplier)}</td>
                    <td className="p-2 text-end">
                      <button onClick={() => deleteStaff.mutate({ id: s.id })} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Project Phases Card */}
        <Card className="p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            {lang === 'ar' ? 'مراحل المشروع' : 'Project Phases'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {lang === 'ar' ? 'أضف مراحل المشروع بأسماء مخصصة ومدة كل مرحلة بأيام العمل' : 'Add custom project phases with names and duration in working days'}
          </p>
          {/* Add new phase */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end bg-muted p-3 rounded mb-4">
            <div className="md:col-span-3">
              <label className="text-xs font-bold text-muted-foreground">{lang === 'ar' ? 'اسم المرحلة' : 'Phase Name'}</label>
              <input type="text" value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: التصميم الأولي، الرسومات التنفيذية...' : 'e.g. Concept Design, Working Drawings...'}
                className="w-full text-sm p-2 border rounded" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">{lang === 'ar' ? 'المدة (أيام)' : 'Duration (days)'}</label>
              <input type="number" min={0} value={newPhaseDays} onChange={e => setNewPhaseDays(Number(e.target.value))}
                className="w-full text-sm p-2 border rounded" />
            </div>
            <Button onClick={() => {
              if (!newPhaseName.trim()) return;
              createPhase.mutate({ projectId, name: newPhaseName.trim(), durationDays: newPhaseDays, sortOrder: phasesList.length });
            }} disabled={createPhase.isPending || !newPhaseName.trim()} className="h-9">
              {createPhase.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {lang === 'ar' ? 'إضافة' : 'Add'}
            </Button>
          </div>
          {/* Phases list */}
          {phasesList.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">{lang === 'ar' ? 'لا توجد مراحل بعد. أضف أول مرحلة أعلاه.' : 'No phases yet. Add the first phase above.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-start">#</th>
                    <th className="p-2 text-start">{lang === 'ar' ? 'اسم المرحلة' : 'Phase Name'}</th>
                    <th className="p-2 text-start">{lang === 'ar' ? 'المدة (أيام عمل)' : 'Duration (working days)'}</th>
                    <th className="p-2 text-end">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {phasesList.map((ph, idx) => (
                    <tr key={ph.id}>
                      <td className="p-2 text-muted-foreground">{idx + 1}</td>
                      <td className="p-2">
                        {editingPhaseId === ph.id ? (
                          <input type="text" value={editingPhaseName} onChange={e => setEditingPhaseName(e.target.value)}
                            className="w-full text-sm p-1 border rounded" />
                        ) : (
                          <span className="font-medium">{ph.name}</span>
                        )}
                      </td>
                      <td className="p-2">
                        {editingPhaseId === ph.id ? (
                          <input type="number" min={0} value={editingPhaseDays} onChange={e => setEditingPhaseDays(Number(e.target.value))}
                            className="w-24 text-sm p-1 border rounded" />
                        ) : (
                          <span>{ph.durationDays} {lang === 'ar' ? 'يوم' : 'days'}</span>
                        )}
                      </td>
                      <td className="p-2 text-end flex justify-end gap-2">
                        {editingPhaseId === ph.id ? (
                          <>
                            <button onClick={() => updatePhase.mutate({ id: ph.id, name: editingPhaseName, durationDays: editingPhaseDays })}
                              className="text-emerald-600 text-xs px-2 py-1 rounded border border-emerald-300 hover:bg-emerald-50">
                              {lang === 'ar' ? 'حفظ' : 'Save'}
                            </button>
                            <button onClick={() => setEditingPhaseId(null)}
                              className="text-muted-foreground text-xs px-2 py-1 rounded border hover:bg-muted">
                              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingPhaseId(ph.id); setEditingPhaseName(ph.name); setEditingPhaseDays(ph.durationDays); }}
                              className="text-blue-500 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                              {lang === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button onClick={() => deletePhase.mutate({ id: ph.id })} className="text-rose-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted">
                  <tr>
                    <td colSpan={2} className="p-2 font-bold">{lang === 'ar' ? 'الإجمالي' : 'Total'}</td>
                    <td className="p-2 font-bold">{phasesList.reduce((s, p) => s + p.durationDays, 0)} {lang === 'ar' ? 'يوم' : 'days'}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // ============ MAIN LAYOUT ============
  return (
    <div className="min-h-screen p-4 md:p-8" dir={isRTL ? "rtl" : "ltr"}
      style={{ background: "var(--lg-bg-gradient)", backgroundAttachment: "fixed", color: "var(--foreground)" }}>
      <LastUpdatedBanner />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="lg-card px-5 py-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Link href="/projects">
                <button className="p-2 rounded-xl transition-all" style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--lg-glass-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--lg-glass-bg)")}>
                  <BackArrow className="w-5 h-5" style={{ color: "var(--foreground)" }} />
                </button>
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{settingsForm?.name || project.name}</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "oklch(0.55 0.18 260 / 12%)", color: "oklch(0.55 0.18 260)" }}>{project.code}</span>
                  {project.phase && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(0.6 0.18 300 / 12%)", color: "oklch(0.6 0.18 300)" }}>{project.phase}</span>
                  )}
                  {isProjectPaused && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(0.65 0.15 60 / 12%)", color: "oklch(0.65 0.15 60)" }}>
                      {lang === 'ar' ? 'متوقف' : 'Paused'}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 opacity-40">{lang === 'ar' ? 'تتبع الميزانية والربحية' : 'Fee Burn & Profitability Tracker'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* CPI Badge */}
              <div className="px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{
                  background: financials.CPI >= 1 ? "oklch(0.55 0.18 145 / 12%)" : financials.CPI >= 0.8 ? "oklch(0.65 0.15 60 / 12%)" : "oklch(0.6 0.2 20 / 12%)",
                  border: `1px solid ${financials.CPI >= 1 ? "oklch(0.55 0.18 145 / 30%)" : financials.CPI >= 0.8 ? "oklch(0.65 0.15 60 / 30%)" : "oklch(0.6 0.2 20 / 30%)"}`,
                  color: financials.CPI >= 1 ? "oklch(0.45 0.18 145)" : financials.CPI >= 0.8 ? "oklch(0.5 0.15 60)" : "oklch(0.5 0.2 20)",
                }}>
                CPI: {financials.CPI > 0 ? financials.CPI.toFixed(2) : 'N/A'}
              </div>
              {/* Profit Badge */}
              <div className="px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{
                  background: financials.currentMargin >= Number(project.targetMargin) ? "oklch(0.55 0.18 145 / 12%)" : financials.currentMargin >= 10 ? "oklch(0.65 0.15 60 / 12%)" : "oklch(0.6 0.2 20 / 12%)",
                  border: `1px solid ${financials.currentMargin >= Number(project.targetMargin) ? "oklch(0.55 0.18 145 / 30%)" : financials.currentMargin >= 10 ? "oklch(0.65 0.15 60 / 30%)" : "oklch(0.6 0.2 20 / 30%)"}`,
                  color: financials.currentMargin >= Number(project.targetMargin) ? "oklch(0.45 0.18 145)" : financials.currentMargin >= 10 ? "oklch(0.5 0.15 60)" : "oklch(0.5 0.2 20)",
                }}>
                {lang === 'ar' ? 'ربح:' : 'Profit:'} {fmtMoney(financials.currentMargin * financials.netRevenue / 100)}
              </div>
              {/* Theme Toggle */}
              <ThemeToggle />
              {/* Export PDF */}
              <button
                onClick={async () => {
                  setIsExportingPdf(true);
                  try {
                    await exportProjectPDF({
                      projectName: project.name,
                      projectCode: project.code,
                      manager: project.manager,
                      phase: project.phase,
                      currency: project.currency,
                      startDate: project.startDate,
                      endDate: project.endDate,
                      percentComplete: percentComplete,
                      totalContractValue: financials.totalContractValue,
                      approvedFee: financials.netRevenue,
                      totalBurn: financials.totalBurn,
                      remainingBudget: financials.productionBudget - financials.totalBurn,
                      profitMargin: financials.currentMargin,
                      cpi: financials.CPI,
                      earnedValue: financials.EV,
                      plannedValue: financials.BAC,
                      payments: paymentsList.map(p => ({
                        title: p.title,
                        type: p.type,
                        amount: Number(p.amount),
                        status: p.status,
                        date: p.date,
                        paidAmount: Number(p.paidAmount || 0),
                      })),
                      expenses: expensesList.map(e => ({
                        description: e.description ?? '',
                        category: e.category,
                        amount: Number(e.amount),
                        date: (e as any).date ?? '',
                      })),
                      lang: lang as 'ar' | 'en',
                    });
                  } finally {
                    setIsExportingPdf(false);
                  }
                }}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                PDF
              </button>
              {/* Language Toggle */}
              <button onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all"
                style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)", color: "var(--foreground)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--lg-glass-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--lg-glass-bg)")}>
                <Globe className="w-4 h-4" />
                {lang === 'ar' ? 'EN' : 'ع'}
              </button>
            </div>
          </div>
        </header>

        {/* Archive Banner */}
        {(project as any).isArchived && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "oklch(0.65 0.15 60 / 12%)", border: "1px solid oklch(0.65 0.15 60 / 30%)" }}>
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4" style={{ color: "oklch(0.55 0.15 60)" }} />
              <span className="text-sm font-medium" style={{ color: "oklch(0.45 0.15 60)" }}>
                {lang === 'ar' ? 'هذا المشروع مؤرشف — غير نشط في لوحة التحكم' : 'This project is archived — not visible in the dashboard'}
              </span>
            </div>
            {isPortfolioManager && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => unarchiveMutation.mutate({ projectId })}
                  disabled={unarchiveMutation.isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all disabled:opacity-50"
                  style={{ background: "oklch(0.55 0.18 145 / 12%)", border: "1px solid oklch(0.55 0.18 145 / 30%)", color: "oklch(0.45 0.18 145)" }}>
                  {unarchiveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
                  {lang === 'ar' ? 'إعادة تنشيط' : 'Reactivate'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(true); setDeleteStep("pm"); setDeletePin1(""); setDeletePin2(""); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
                  style={{ background: "oklch(0.6 0.2 20 / 10%)", border: "1px solid oklch(0.6 0.2 20 / 25%)", color: "oklch(0.5 0.2 20)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'حذف نهائي' : 'Delete Permanently'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirm Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  {lang === 'ar' ? 'حذف المشروع نهائياً' : 'Delete Project Permanently'}
                </h2>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              {deleteStep === "pm" ? (
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    {lang === 'ar' ? 'الخطوة 1/2: أدخل PIN مدير المشروع للتأكيد' : 'Step 1/2: Enter Project Manager PIN to confirm'}
                  </p>
                  <input
                    type="password" maxLength={4} value={deletePin1}
                    onChange={e => setDeletePin1(e.target.value)}
                    placeholder={lang === 'ar' ? 'PIN مدير المشروع' : 'Project Manager PIN'}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-center tracking-widest mb-4 focus:outline-none focus:ring-2 focus:ring-red-400" />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (deletePin1.length < 4) return alert(lang === 'ar' ? 'أدخل 4 أرقام' : 'Enter 4 digits');
                        setDeleteStep("portfolio");
                      }}
                      className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700">
                      {lang === 'ar' ? 'التالي' : 'Next'}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50">
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    {lang === 'ar' ? 'الخطوة 2/2: أدخل PIN مدير المحفظة للتأكيد النهائي' : 'Step 2/2: Enter Portfolio Manager PIN for final confirmation'}
                  </p>
                  <input
                    type="password" maxLength={4} value={deletePin2}
                    onChange={e => setDeletePin2(e.target.value)}
                    placeholder={lang === 'ar' ? 'PIN مدير المحفظة' : 'Portfolio Manager PIN'}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-center tracking-widest mb-4 focus:outline-none focus:ring-2 focus:ring-red-400" />
                  <div className="flex gap-3">
                    <button
                      onClick={() => deleteProjectMutation.mutate({ id: projectId, pmPin: deletePin1, portfolioPin: deletePin2 })}
                      disabled={deleteProjectMutation.isPending}
                      className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {deleteProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      {lang === 'ar' ? 'حذف نهائياً' : 'Delete Permanently'}
                    </button>
                    <button onClick={() => setDeleteStep("pm")}
                      className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50">
                      {lang === 'ar' ? 'رجوع' : 'Back'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto" style={{ borderBottom: "1px solid var(--lg-border)" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap"
              style={{
                borderBottomColor: activeTab === tab.key ? "var(--primary)" : "transparent",
                color: activeTab === tab.key ? "var(--primary)" : "var(--muted-foreground)",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'budget' && renderBudget()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'payments' && renderPayments()}
          {activeTab === 'timeline' && project && (
            <DurationLogTab
              projectId={projectId}
              startDate={project.startDate}
              endDate={project.endDate}
              stoppageDays={project.stoppageDays ?? 0}
              isPaused={project.isPaused ?? false}
              pauseStartDate={project.pauseStartDate ?? null}
              isPortfolioManager={isPortfolioManager}
            />
          )}
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}
