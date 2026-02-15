import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import {
  Loader2, ArrowLeft, ArrowRight, Globe, Wallet, TrendingDown, TrendingUp,
  PieChart, Users, Clock, Plus, Trash2, Settings, Target,
  BarChart3, Sparkles, Pause, Play, Receipt, Banknote, AlertTriangle
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";

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
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;
  const { lang, toggleLanguage, isRTL, t } = useLanguage();
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
  const updatePaymentStatus = trpc.payments.updateStatus.useMutation({ onSuccess: () => utils.payments.list.invalidate({ projectId }) });
  const updateProject = trpc.projects.update.useMutation({ onSuccess: () => utils.projects.get.invalidate({ id: projectId }) });
  const categorizeExpense = trpc.ai.categorizeExpense.useMutation();

  // ---- Input States ----
  const [newStaffForm, setNewStaffForm] = useState({ name: "", role: "", baseRate: "", location: "Cairo" as "Cairo" | "Riyadh" });
  const [newBudgetLaborForm, setNewBudgetLaborForm] = useState({ staffId: "", hours: "" });
  const [newBudgetExpenseForm, setNewBudgetExpenseForm] = useState({ category: "Sub-Consultant", amount: "" });
  const [newLogForm, setNewLogForm] = useState({ staffId: "", hours: "", phase: "Concept", desc: "", startDate: "", endDate: "" });
  const [newExpenseForm, setNewExpenseForm] = useState({ category: "Sub-Consultant", amount: "", desc: "", reimbursable: false });
  const [newPaymentForm, setNewPaymentForm] = useState({ title: "", type: "Contract" as "Contract" | "VO", amount: "", date: "", requirements: "" });

  // ---- Settings State ----
  const [settingsForm, setSettingsForm] = useState<null | {
    name: string; code: string; manager: string; coordinator: string;
    totalContractValue: string; overheadMultiplier: string; targetMargin: string;
    startDate: string; endDate: string; stoppageDays: number;
  }>(null);

  // Initialize settings form when project loads
  if (project && !settingsForm) {
    setSettingsForm({
      name: project.name as string,
      code: project.code,
      manager: project.manager || "",
      coordinator: project.coordinator || "",
      totalContractValue: project.totalContractValue,
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
      totalContractValue: project.totalContractValue,
      overheadMultiplier: project.overheadMultiplier,
      targetMargin: project.targetMargin,
      startDate: project.startDate,
      endDate: project.endDate,
      stoppageDays: project.stoppageDays,
    };

    const totalContractValue = Number(ps.totalContractValue);
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
    const totalBurn = totalLaborLoaded + totalExpenses + stoppageLoss;

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
      netRevenue, productionBudget, totalLaborLoaded, totalExpenses, totalBurn,
      currentMargin, budgetUtilized, riyadhCost, cairoCost, BAC,
      totalEstLaborCost, totalEstExpenses, totalEstHours, totalActualHours,
      EV, CPI, isUnderBudget, durationDays, stoppageLoss, dailyProfitTarget,
      totalInvoiced, totalCollected, financialCompletionRate,
      overheadMultiplier, targetMarginPct, stoppageDays, totalContractValue,
    };
  }, [project, settingsForm, staffList, timeLogsList, expensesList, budgetLaborList, budgetExpensesList, percentComplete, paymentsList]);

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

  const handleAutoCategorize = async () => {
    if (!newExpenseForm.desc) return;
    const result = await categorizeExpense.mutateAsync({ description: newExpenseForm.desc });
    if (result.category) {
      setNewExpenseForm(prev => ({ ...prev, category: result.category }));
    }
  };

  const handleSaveSettings = () => {
    if (!settingsForm) return;
    updateProject.mutate({
      id: projectId,
      name: settingsForm.name,
      code: settingsForm.code,
      manager: settingsForm.manager,
      coordinator: settingsForm.coordinator,
      totalContractValue: settingsForm.totalContractValue,
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

        {/* Stoppage Widget */}
        <Card className={`w-full md:w-80 border-2 p-4 ${isProjectPaused ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className={`font-bold flex items-center gap-2 ${isProjectPaused ? 'text-rose-900' : 'text-emerald-900'}`}>
                {isProjectPaused ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {t.projectStatus}: {isProjectPaused ? t.statusPaused : t.statusActive}
              </h3>
              <div className="text-center my-4">
                <span className="text-xs text-muted-foreground block mb-1">{t.daysCount}</span>
                <div className="text-4xl font-mono font-bold tracking-widest">{financials.stoppageDays}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Button variant={isProjectPaused ? "default" : "destructive"} className="w-full justify-center"
                onClick={() => setIsProjectPaused(!isProjectPaused)}>
                {isProjectPaused ? <><Play className="w-4 h-4 mr-1" />{t.resumeProject}</> : <><Pause className="w-4 h-4 mr-1" />{t.pauseProject}</>}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Stoppage Alert */}
      {financials.stoppageDays > 0 && (
        <Card className="bg-rose-50 border-rose-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <div>
                <h4 className="font-bold text-sm">{t.stoppageAnalysis}</h4>
                <p className="text-xs mt-0.5 opacity-80">{t.stoppageDesc}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-xl font-bold text-rose-600">-{fmtMoney(financials.stoppageLoss)}</span>
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
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-sm font-medium">{t.extExpenses}</span>
              <span className="font-bold">{fmtMoney(financials.totalExpenses)}</span>
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
                  disabled={categorizeExpense.isPending || !newExpenseForm.desc} className="whitespace-nowrap px-3">
                  {categorizeExpense.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
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
              <input type="number" value={settingsForm.totalContractValue} onChange={(e) => setSettingsForm({ ...settingsForm, totalContractValue: e.target.value })}
                className="w-full border rounded p-2" />
              <p className="text-xs text-muted-foreground mt-1">{t.feeNote}</p>
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
      </div>
    );
  };

  // ============ MAIN LAYOUT ============
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon"><BackArrow className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{settingsForm?.name || project.name}</h1>
              <p className="text-muted-foreground text-sm">Design | Project Fee Burn & Profitability Tracker</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={toggleLanguage}
              className="flex items-center gap-2 text-sm bg-white border px-3 py-1.5 rounded-md hover:bg-slate-50">
              <Globe className="w-4 h-4" />
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <div className="flex gap-2">
              <div className="bg-white px-4 py-2 rounded-lg border text-sm">
                <span className="text-muted-foreground block text-xs">CPI (Efficiency)</span>
                <span className={`font-bold ${financials.CPI >= 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {financials.CPI.toFixed(2)}
                </span>
                <div className="text-[9px] text-muted-foreground mt-1 max-w-[120px] leading-tight">{t.cpiDefinition}</div>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border text-sm">
                <span className="text-muted-foreground block text-xs">Profit</span>
                <span className="font-bold">{fmtMoney(financials.currentMargin * financials.netRevenue / 100)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 border-b overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.key ? 'border-slate-900 text-slate-900' : 'border-transparent text-muted-foreground hover:text-slate-700'}`}>
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
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}
