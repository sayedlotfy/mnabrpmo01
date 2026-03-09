import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAppUser, AppUserSession } from "@/contexts/AppUserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Lock, ChevronRight, User, Building2 } from "lucide-react";

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
      if (newPin.length === 4) {
        handleVerify(newPin);
      }
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

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const isAr = lang === "ar";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={LOGO_URL} alt="Al Mnabr" className="h-14 w-14 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className={isAr ? "text-right" : "text-left"}>
              <h1 className="text-white font-bold text-xl">المنابر للاستشارات الهندسية</h1>
              <p className="text-slate-400 text-sm">Design PMO · Project Portfolio</p>
            </div>
          </div>
        </div>

        {step === "select" && (
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700 p-6">
            <h2 className="text-white font-semibold text-lg mb-1 text-center">
              {isAr ? "اختر حسابك" : "Select Your Account"}
            </h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              {isAr ? "اختر اسمك للمتابعة" : "Choose your name to continue"}
            </p>

            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  {isAr ? "لا يوجد مستخدمون بعد. تواصل مع مدير النظام." : "No users yet. Contact system admin."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Portfolio Managers first */}
                {users.filter(u => u.role === "portfolio_manager").length > 0 && (
                  <>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">
                      {isAr ? "مدير المحفظة" : "Portfolio Manager"}
                    </p>
                    {users.filter(u => u.role === "portfolio_manager").map(user => (
                      <button key={user.id} onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          {user.nameEn && <p className="text-slate-400 text-xs">{user.nameEn}</p>}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors ${isAr ? "rotate-180" : ""}`} />
                      </button>
                    ))}
                    <div className="border-t border-slate-700 my-3" />
                  </>
                )}

                {/* Project Managers */}
                {users.filter(u => u.role === "project_manager").length > 0 && (
                  <>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">
                      {isAr ? "مديرو المشاريع" : "Project Managers"}
                    </p>
                    {users.filter(u => u.role === "project_manager").map(user => (
                      <button key={user.id} onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          {user.nameEn && <p className="text-slate-400 text-xs">{user.nameEn}</p>}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors ${isAr ? "rotate-180" : ""}`} />
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {step === "pin" && selectedUser && (
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700 p-6">
            <button onClick={() => { setStep("select"); setPin(""); setError(""); }}
              className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors">
              <ChevronRight className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
              {isAr ? "رجوع" : "Back"}
            </button>

            <div className="text-center mb-6">
              <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${selectedUser.role === "portfolio_manager" ? "bg-amber-500/20" : "bg-blue-500/20"}`}>
                {selectedUser.role === "portfolio_manager"
                  ? <Building2 className="w-7 h-7 text-amber-400" />
                  : <User className="w-7 h-7 text-blue-400" />}
              </div>
              <h2 className="text-white font-semibold text-lg">{selectedUser.name}</h2>
              <p className="text-slate-400 text-sm mt-1">
                {isAr ? "أدخل رقم PIN المكون من 4 أرقام" : "Enter your 4-digit PIN"}
              </p>
            </div>

            {/* PIN Dots */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? "bg-blue-400 border-blue-400 scale-110"
                    : "bg-transparent border-slate-500"
                }`} />
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4 animate-pulse">{error}</p>
            )}

            {isLoading && (
              <div className="flex justify-center mb-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                <button key={d} onClick={() => handlePinDigit(String(d))}
                  disabled={isLoading || pin.length >= 4}
                  className="h-14 rounded-xl bg-slate-700/70 hover:bg-slate-600 active:scale-95 text-white font-semibold text-xl transition-all disabled:opacity-50 border border-slate-600/50">
                  {d}
                </button>
              ))}
              <button onClick={() => setPin("")} disabled={isLoading}
                className="h-14 rounded-xl bg-slate-700/40 hover:bg-slate-600/60 active:scale-95 text-slate-400 text-sm font-medium transition-all disabled:opacity-50">
                {isAr ? "مسح" : "Clear"}
              </button>
              <button onClick={() => handlePinDigit("0")} disabled={isLoading || pin.length >= 4}
                className="h-14 rounded-xl bg-slate-700/70 hover:bg-slate-600 active:scale-95 text-white font-semibold text-xl transition-all disabled:opacity-50 border border-slate-600/50">
                0
              </button>
              <button onClick={handleDelete} disabled={isLoading || pin.length === 0}
                className="h-14 rounded-xl bg-slate-700/40 hover:bg-slate-600/60 active:scale-95 text-slate-300 transition-all disabled:opacity-50 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 text-xs">
              <Lock className="w-3 h-3" />
              <span>{isAr ? "الدخول آمن ومشفر" : "Secure encrypted access"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
