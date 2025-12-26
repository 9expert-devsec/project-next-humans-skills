"use client";

import { usePathname, useRouter } from "next/navigation";

export default function LocaleSwitch() {
  const router = useRouter();
  const pathname = usePathname(); // เช่น /th/register/xxx/step-2

  function switchTo(nextLocale) {
    if (!pathname) return;

    const parts = pathname.split("/");
    // parts = ["", "th", "register", ...]
    if (parts.length < 2) return;

    parts[1] = nextLocale;
    router.push(parts.join("/"));
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
      <button
        onClick={() => switchTo("th")}
        className="h-9 rounded-full px-4 text-sm font-extrabold text-white/80 hover:bg-white/10"
      >
        TH
      </button>
      <button
        onClick={() => switchTo("en")}
        className="h-9 rounded-full px-4 text-sm font-extrabold text-white/80 hover:bg-white/10"
      >
        EN
      </button>
    </div>
  );
}
