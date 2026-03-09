import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Clock } from "lucide-react";

function toHijri(date: Date): string {
  // Use Intl.DateTimeFormat with Islamic calendar
  try {
    const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    return hijri;
  } catch {
    return "";
  }
}

function toGregorian(date: Date, lang: string): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function LastUpdatedBanner() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const now = useMemo(() => new Date(), []);
  const hijri = useMemo(() => toHijri(now), [now]);
  const gregorian = useMemo(() => toGregorian(now, lang), [now, lang]);

  return (
    <div
      className="last-updated-banner w-full flex items-center justify-center gap-3 px-4 py-1.5 text-[11px] font-medium select-none"
      style={{
        background: "var(--lg-banner-bg)",
        color: "var(--lg-banner-text)",
        borderBottom: "1px solid var(--lg-border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <Clock className="w-3 h-3 opacity-60 flex-shrink-0" />
      <span className="opacity-70">{isAr ? "آخر تحديث:" : "Last updated:"}</span>
      <span className="font-semibold">{hijri}</span>
      <span className="opacity-40 mx-1">|</span>
      <span className="opacity-80">{gregorian}</span>
    </div>
  );
}
