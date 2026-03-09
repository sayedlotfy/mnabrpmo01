import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAppUser } from "@/contexts/AppUserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Loader2, FolderPlus, ArrowRight, ArrowLeft, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LOGO_URL = "https://static-assets.manus.space/files/webdev/design-pmo/logo.png";

const PHASES = ["Concept", "Schematic", "DD", "CD", "Tender", "Construction"];

export default function CreateProject() {
  const { currentUser, isPortfolioManager } = useAppUser();
  const { lang } = useLanguage();
  const [, navigate] = useLocation();
  const isAr = lang === "ar";

  // Load all app users for portfolio manager dropdown
  const { data: appUsers } = trpc.appUsers.list.useQuery();
  const projectManagers = (appUsers || []).filter(u => u.role === "project_manager");

  // selectedManagerId: for portfolio manager to pick from dropdown
  const [selectedManagerId, setSelectedManagerId] = useState<number | "">("" );

  const [form, setForm] = useState({
    name: "",
    code: "",
    manager: "",
    coordinator: "",
    phase: "Concept" as typeof PHASES[number],
    currency: "SAR",
    overheadMultiplier: "2.5",
    targetMargin: "20",
    startDate: "",
    endDate: "",
  });

  // Auto-fill manager name for project managers
  useEffect(() => {
    if (!isPortfolioManager && currentUser) {
      setForm(prev => ({ ...prev, manager: currentUser.name }));
    }
  }, [currentUser, isPortfolioManager]);

  // When portfolio manager selects a manager from dropdown, update form.manager
  useEffect(() => {
    if (isPortfolioManager && selectedManagerId !== "") {
      const found = projectManagers.find(u => u.id === selectedManagerId);
      if (found) setForm(prev => ({ ...prev, manager: found.name }));
    }
  }, [selectedManagerId]);

  // appUserId to assign to the project
  const assignedAppUserId = isPortfolioManager
    ? (selectedManagerId !== "" ? selectedManagerId as number : undefined)
    : currentUser?.id;

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم إنشاء المشروع بنجاح" : "Project created successfully");
      navigate("/projects");
    },
    onError: (err) => {
      toast.error(isAr ? `خطأ: ${err.message}` : `Error: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.startDate || !form.endDate) {
      toast.error(isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    if (isPortfolioManager && !selectedManagerId) {
      toast.error(isAr ? "يرجى اختيار مدير المشروع" : "Please select a project manager");
      return;
    }
    createProject.mutate({
      ...form,
      phase: form.phase as any,
      appUserId: assignedAppUserId,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center gap-3 shadow-lg">
        <img src={LOGO_URL} alt="Logo" className="h-9 w-9 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div>
          <h1 className="font-bold text-sm">المنابر للاستشارات الهندسية</h1>
          <p className="text-slate-400 text-xs">{isAr ? "إنشاء مشروع جديد" : "Create New Project"}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">{isAr ? "مشروع جديد" : "New Project"}</h2>
              <p className="text-slate-500 text-sm">{isAr ? "أدخل بيانات المشروع الأساسية" : "Enter basic project information"}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isAr ? "اسم المشروع *" : "Project Name *"}
                </label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isAr ? "مثال: برج المنابر" : "e.g. Al Mnabr Tower"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isAr ? "كود المشروع *" : "Project Code *"}
                </label>
                <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. MNB-2025-001" />
              </div>
              {/* Project Manager - conditional rendering */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isAr ? "مدير المشروع" : "Project Manager"}
                </label>
                {isPortfolioManager ? (
                  /* Portfolio manager: dropdown to select from project managers */
                  <div className="relative">
                    <select
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                    >
                      <option value="">{isAr ? "-- اختر مدير المشروع --" : "-- Select Project Manager --"}</option>
                      {projectManagers.map(pm => (
                        <option key={pm.id} value={pm.id}>
                          {pm.name}{pm.nameEn ? ` · ${pm.nameEn}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute top-2.5 ${isAr ? "left-2.5" : "right-2.5"} w-4 h-4 text-slate-400 pointer-events-none`} />
                    {projectManagers.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {isAr ? "لا يوجد مدراء مشاريع مسجلون. أضف مهندسين أولاً من لوحة التحكم." : "No project managers found. Add engineers first from the dashboard."}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Project manager: auto-filled, read-only */
                  <div className="relative">
                    <div className={`absolute top-2.5 ${isAr ? "right-3" : "left-3"} text-slate-400`}>
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={form.manager}
                      readOnly
                      className={`w-full border border-slate-100 rounded-lg ${isAr ? "pr-9 pl-3" : "pl-9 pr-3"} py-2 text-sm bg-slate-50 text-slate-600 cursor-not-allowed`}
                    />
                    <span className={`absolute top-2 ${isAr ? "left-2" : "right-2"} text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium`}>
                      {isAr ? "تلقائي" : "Auto"}
                    </span>
                  </div>
                )}
              </div>

              {/* Project Coordinator - always text input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isAr ? "منسق المشروع" : "Project Coordinator"}
                </label>
                <input
                  type="text"
                  value={form.coordinator}
                  onChange={(e) => setForm({ ...form, coordinator: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isAr ? "اكتب اسم المنسق" : "Type coordinator name"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isAr ? "المرحلة الحالية" : "Current Phase"}
                </label>
                <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isAr ? "العملة" : "Currency"}
                </label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="SAR">SAR - ريال سعودي</option>
                  <option value="EGP">EGP - جنيه مصري</option>
                  <option value="USD">USD - دولار أمريكي</option>
                  <option value="AED">AED - درهم إماراتي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isAr ? "تاريخ البداية *" : "Start Date *"}
                </label>
                <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isAr ? "تاريخ الانتهاء *" : "End Date *"}
                </label>
                <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Financial Settings */}
            <div className="border-t border-slate-100 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{isAr ? "الإعدادات المالية" : "Financial Settings"}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isAr ? "معامل الأوفرهيد" : "Overhead Multiplier"}
                  </label>
                  <input type="number" step="0.1" min="1" max="10" value={form.overheadMultiplier}
                    onChange={(e) => setForm({ ...form, overheadMultiplier: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-slate-400 mt-1">{isAr ? "الافتراضي: 2.5" : "Default: 2.5"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isAr ? "هامش الربح المستهدف (%)" : "Target Profit Margin (%)"}
                  </label>
                  <input type="number" step="1" min="0" max="100" value={form.targetMargin}
                    onChange={(e) => setForm({ ...form, targetMargin: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-slate-400 mt-1">{isAr ? "الافتراضي: 20%" : "Default: 20%"}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/projects")}
                className="flex-1 flex items-center justify-center gap-2">
                {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={createProject.isPending} className="flex-1">
                {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                {isAr ? "إنشاء المشروع" : "Create Project"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
