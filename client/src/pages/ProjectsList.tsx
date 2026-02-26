import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Plus, FolderOpen, Globe } from 'lucide-react';
import { Link } from 'wouter';

export default function ProjectsList() {
  const { lang, toggleLanguage, isRTL, t } = useLanguage();
  const { data } = trpc.projects.list.useQuery(undefined, {});
  const projects = data?.projects ?? [];
  const createProject = trpc.projects.create.useMutation({ onSuccess: () => {} });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    manager: '',
    coordinator: '',
    totalContractValue: '500000',
    overheadMultiplier: '1.5',
    targetMargin: '20',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleCreate = () => {
    if (!form.name || !form.code) return;
    createProject.mutate(form as any);
    setShowForm(false);
    setForm({ name: '', code: '', manager: '', coordinator: '', totalContractValue: '500000', overheadMultiplier: '1.5', targetMargin: '20', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{lang === 'ar' ? 'نظام إدارة مشاريع التصميم' : 'Design PMO'}</h1>
            <p className="text-muted-foreground mt-1">{lang === 'ar' ? 'إدارة ومراقبة مشاريع التصميم' : 'Design Project Management & Control System'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              <Globe className="w-4 h-4 mr-1" />
              {lang === 'ar' ? 'English' : 'عربي'}
            </Button>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {lang === 'ar' ? 'مشروع جديد' : 'New Project'}
            </Button>
          </div>
        </div>

        {/* New Project Form */}
        {showForm && (
          <Card className="p-6 mb-6 border-2 border-primary/20">
            <h2 className="text-lg font-semibold mb-4">{lang === 'ar' ? 'مشروع جديد' : 'New Project'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{lang === 'ar' ? 'اسم المشروع *' : 'Project Name *'}</label>
                <input className="w-full border rounded p-2 mt-1 text-sm bg-background" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={lang === 'ar' ? 'اسم المشروع' : 'Project name'} />
              </div>
              <div>
                <label className="text-sm font-medium">{lang === 'ar' ? 'كود المشروع *' : 'Project Code *'}</label>
                <input className="w-full border rounded p-2 mt-1 text-sm bg-background" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="PMO-001" />
              </div>
              <div>
                <label className="text-sm font-medium">{lang === 'ar' ? 'مدير المشروع' : 'Project Manager'}</label>
                <input className="w-full border rounded p-2 mt-1 text-sm bg-background" value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">{lang === 'ar' ? 'قيمة العقد الإجمالية' : 'Total Contract Value'}</label>
                <input type="number" className="w-full border rounded p-2 mt-1 text-sm bg-background" value={form.totalContractValue} onChange={e => setForm({...form, totalContractValue: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">{lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
                <input type="date" className="w-full border rounded p-2 mt-1 text-sm bg-background" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">{lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</label>
                <input type="date" className="w-full border rounded p-2 mt-1 text-sm bg-background" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate} disabled={!form.name || !form.code}>{lang === 'ar' ? 'إنشاء' : 'Create'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            </div>
          </Card>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{lang === 'ar' ? 'لا توجد مشاريع' : 'No Projects Yet'}</h3>
            <p className="text-muted-foreground mb-4">{lang === 'ar' ? 'أضف مشروعك الأول للبدء' : 'Add your first project to get started'}</p>
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" />{lang === 'ar' ? 'إضافة مشروع' : 'Add Project'}</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-base">{project.name}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{project.code}</span>
                    </div>
                  </div>
                  {project.manager && <p className="text-xs text-muted-foreground mt-1">{lang === 'ar' ? 'م.' : 'PM:'} {project.manager}</p>}
                  <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
                    <span>{new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(Number(project.totalContractValue))}</span>
                    <span>{project.percentComplete ?? 0}% {lang === 'ar' ? 'مكتمل' : 'complete'}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
