import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAppUser } from "@/contexts/AppUserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Lock, ChevronRight, User, Building2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LastUpdatedBanner from "@/components/LastUpdatedBanner";

const LOGO_URL = "https://static-assets.manus.space/files/webdev/design-pmo/logo.png";

export default function PinLogin() {
  const { setCurrentUser } = useAppUser();
  const { lang } = useLanguage();
  const [step, setStep] = useState<"select" | "pin">("select");
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string; nameEn?: string | null; role: string } | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: users, isLoading: usersLoading } = trpc.appUsers.list.useQuery();
  const verifyPin = trpc.appUsers.verifyPin.useMutation();

  const handleSelectUser = (user: typeof selectedUser) => {
    setSelectedUser(user);
    setPin("");
    setError("");
    setStep("pin");
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) handleVerify(newPin);
    }
  };

  const handleVerify = async (pinValue: string) => {
    if (!selectedUser) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await verifyPin.mutateAsync({ userId: selectedUser.id, pin: pinValue });
      if (result.success && result.user) {
        setCurrentUser({
          id: result.user.id,
          name: result.user.name,
          nameEn: result.user.nameEn,
          role: result.user.role as "portfolio_manager" | "project_manager",
        });
      }
    } catch {
      setError(lang === "ar" ? "رقم PIN غير صحيح. حاول مرة أخرى." : "Incorrect PIN. Please try again.");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => { setPin(prev => prev.slice(0, -1)); setError(""); };
  const isAr = lang === "ar";

  return (
    <div
      className="min-h-screen flex flex-col"
      dir={isAr ? "rtl" : "ltr"}
      style={{ background: "var(--lg-bg-gradient)", backgroundAttachment: "fixed" }}
    >
      {/* Top banner */}
      <LastUpdatedBanner />

      {/* Theme toggle top-right */}
      <div className="absolute top-10 end-4 z-50">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={LOGO_URL} alt="Al Mnabr" className="h-14 w-14 object-contain drop-shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className={isAr ? "text-right" : "text-left"}>
                <h1 className="font-bold text-xl" style={{ color: "var(--foreground)" }}>
                  المنابر للاستشارات الهندسية
                </h1>
                <p className="text-sm opacity-60">Design PMO · Project Portfolio</p>
              </div>
            </div>
          </div>

          {/* Select user card */}
          {step === "select" && (
            <div className="lg-card p-6">
              <h2 className="font-semibold text-lg mb-1 text-center" style={{ color: "var(--foreground)" }}>
                {isAr ? "اختر حسابك" : "Select Your Account"}
              </h2>
              <p className="text-sm text-center mb-6 opacity-60">
                {isAr ? "اختر اسمك للمتابعة" : "Choose your name to continue"}
              </p>

              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin opacity-50" />
                </div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 opacity-30 mx-auto mb-3" />
                  <p className="text-sm opacity-50">
                    {isAr ? "لا يوجد مستخدمون. تواصل مع مدير النظام." : "No users yet. Contact system admin."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.filter(u => u.role === "portfolio_manager").length > 0 && (
                    <>
                      <p className="text-xs opacity-50 uppercase tracking-wider mb-2 px-1">
                        {isAr ? "مدير المحفظة" : "Portfolio Manager"}
                      </p>
                      {users.filter(u => u.role === "portfolio_manager").map(user => (
                        <button key={user.id} onClick={() => handleSelectUser(user)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl transition-all group"
                          style={{
                            background: "oklch(0.75 0.15 50 / 12%)",
                            border: "1px solid oklch(0.75 0.15 50 / 30%)",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.75 0.15 50 / 20%)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.75 0.15 50 / 12%)")}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "oklch(0.75 0.15 50 / 20%)" }}>
                            <Building2 className="w-5 h-5" style={{ color: "oklch(0.75 0.15 50)" }} />
                          </div>
                          <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
                            <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{user.name}</p>
                            {user.nameEn && <p className="text-xs opacity-50">{user.nameEn}</p>}
                          </div>
                          <ChevronRight className={`w-4 h-4 opacity-40 group-hover:opacity-80 transition-opacity ${isAr ? "rotate-180" : ""}`} />
                        </button>
                      ))}
                      <div className="my-3" style={{ borderTop: "1px solid var(--lg-border)" }} />
                    </>
                  )}

                  {users.filter(u => u.role === "project_manager").length > 0 && (
                    <>
                      <p className="text-xs opacity-50 uppercase tracking-wider mb-2 px-1">
                        {isAr ? "مديرو المشاريع" : "Project Managers"}
                      </p>
                      {users.filter(u => u.role === "project_manager").map(user => (
                        <button key={user.id} onClick={() => handleSelectUser(user)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl transition-all group"
                          style={{
                            background: "var(--lg-glass-bg)",
                            border: "1px solid var(--lg-glass-border)",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--lg-glass-hover)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "var(--lg-glass-bg)")}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "oklch(0.55 0.18 260 / 15%)" }}>
                            <User className="w-5 h-5" style={{ color: "oklch(0.55 0.18 260)" }} />
                          </div>
                          <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
                            <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{user.name}</p>
                            {user.nameEn && <p className="text-xs opacity-50">{user.nameEn}</p>}
                          </div>
                          <ChevronRight className={`w-4 h-4 opacity-40 group-hover:opacity-80 transition-opacity ${isAr ? "rotate-180" : ""}`} />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PIN entry card */}
          {step === "pin" && selectedUser && (
            <div className="lg-card p-6">
              <button onClick={() => { setStep("select"); setPin(""); setError(""); }}
                className="text-sm flex items-center gap-1 mb-4 transition-opacity opacity-60 hover:opacity-100">
                <ChevronRight className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
                {isAr ? "رجوع" : "Back"}
              </button>

              <div className="text-center mb-6">
                <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  selectedUser.role === "portfolio_manager"
                    ? "bg-amber-500/20"
                    : "bg-blue-500/20"
                }`}>
                  {selectedUser.role === "portfolio_manager"
                    ? <Building2 className="w-7 h-7 text-amber-500" />
                    : <User className="w-7 h-7 text-blue-500" />}
                </div>
                <h2 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>{selectedUser.name}</h2>
                <p className="text-sm opacity-60 mt-1">
                  {isAr ? "أدخل رقم PIN المكون من 4 أرقام" : "Enter your 4-digit PIN"}
                </p>
              </div>

              {/* PIN Dots */}
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                    i < pin.length
                      ? "scale-110"
                      : ""
                  }`} style={{
                    background: i < pin.length ? "var(--primary)" : "transparent",
                    borderColor: i < pin.length ? "var(--primary)" : "oklch(0.5 0.01 260 / 40%)",
                  }} />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm text-center mb-4 animate-pulse">{error}</p>}
              {isLoading && (
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--primary)" }} />
                </div>
              )}

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                  <button key={d} onClick={() => handlePinDigit(String(d))}
                    disabled={isLoading || pin.length >= 4}
                    className="h-14 rounded-xl font-semibold text-xl transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      background: "var(--lg-glass-bg)",
                      border: "1px solid var(--lg-glass-border)",
                      color: "var(--foreground)",
                      boxShadow: "var(--lg-specular)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--lg-glass-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--lg-glass-bg)")}
                  >
                    {d}
                  </button>
                ))}
                <button onClick={() => setPin("")} disabled={isLoading}
                  className="h-14 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50 opacity-60 hover:opacity-100"
                  style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)", color: "var(--foreground)" }}>
                  {isAr ? "مسح" : "Clear"}
                </button>
                <button onClick={() => handlePinDigit("0")} disabled={isLoading || pin.length >= 4}
                  className="h-14 rounded-xl font-semibold text-xl transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: "var(--lg-glass-bg)",
                    border: "1px solid var(--lg-glass-border)",
                    color: "var(--foreground)",
                    boxShadow: "var(--lg-specular)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--lg-glass-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--lg-glass-bg)")}
                >
                  0
                </button>
                <button onClick={handleDelete} disabled={isLoading || pin.length === 0}
                  className="h-14 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center opacity-60 hover:opacity-100"
                  style={{ background: "var(--lg-glass-bg)", border: "1px solid var(--lg-glass-border)", color: "var(--foreground)" }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs opacity-40">
                <Lock className="w-3 h-3" />
                <span>{isAr ? "الدخول آمن ومشفر" : "Secure encrypted access"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
