import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, FolderOpen, Globe, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function ProjectsList() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { lang, toggleLanguage, isRTL, t } = useLanguage();
  const { data: projects, isLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-8 max-w-md w-full text-center">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/87107394/RmpqaaQjPrvNhjEn.png" alt="Logo" className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Design PMO</h1>
          <p className="text-muted-foreground mb-6">
            {lang === 'ar' ? 'نظام إدارة ومراقبة مشاريع التصميم' : 'Design Project Management & Control System'}
          </p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/87107394/RmpqaaQjPrvNhjEn.png" alt="Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold">Design PMO</h1>
              <p className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage}>
              <Globe className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t.projects}</h2>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              {t.newProject}
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.code}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.totalContractValue}</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
                          style: 'currency',
                          currency: project.currency,
                          maximumFractionDigits: 0,
                        }).format(Number(project.totalContractValue))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.percentComplete}</span>
                      <span className="font-semibold">{project.percentComplete}%</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t.noData}</h3>
            <p className="text-muted-foreground mb-4">
              {lang === 'ar' ? 'لم تقم بإنشاء أي مشاريع بعد' : 'You haven\'t created any projects yet'}
            </p>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                {t.newProject}
              </Link>
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
