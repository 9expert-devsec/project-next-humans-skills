"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getCoursePublicState } from "@/lib/coursePublicState";
import CourseAlertModal from "@/components/ui/CourseAlertModal";
import { NotebookPen, FileText, Bell } from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function CourseDetailActions({
  locale = "th",
  course,
  size = "compact", // compact | large
  className = "",
}) {
  const isEN = locale === "en";
  const [alertOpen, setAlertOpen] = useState(false);

  const slug = String(course?.slug || "");
  const publicState = getCoursePublicState(course);

  const publicRegisterHref = useMemo(() => {
    return `/${locale}/upcoming-register/${encodeURIComponent(slug)}/step-1`;
  }, [locale, slug]);

  const inhouseHref = useMemo(() => {
    return `/${locale}/register/${encodeURIComponent(slug)}/step-1`;
  }, [locale, slug]);

  const notifyLabel = publicState.isPublicFull
    ? isEN
      ? "Notify me about the next round"
      : "แจ้งเตือนรอบถัดไป"
    : isEN
      ? "Notify me when enrollment opens"
      : "แจ้งเตือนเมื่อเปิดรับ";

  const primaryClass =
    size === "large"
      ? "inline-flex items-center justify-center rounded-xl px-10 py-4 text-lg font-extrabold"
      : "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-extrabold";

  const secondaryClass =
    size === "large"
      ? "inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-10 py-4 text-lg font-extrabold text-white hover:bg-white/15"
      : "inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/15";

  return (
    <>
      <div className={cx("flex shrink-0 flex-wrap gap-2", className)}>
        {publicState.isPublicOpen ? (
          <Link
            href={publicRegisterHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
          >
            <NotebookPen className="h-4 w-4" />
            <span>{isEN ? "Register" : "ลงทะเบียน Public Class"}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setAlertOpen(true)}
            className={cx(
              primaryClass,
              "inline-flex items-center justify-center gap-2 border border-[#E7C34A]/50 bg-[#E7C34A] text-slate-950 hover:brightness-105",
            )}
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span>{notifyLabel}</span>
          </button>
        )}

        <Link href={inhouseHref} className={cx(secondaryClass, "inline-flex items-center gap-2")}>
          <FileText className="h-4 w-4" />
          <span>{isEN ? "Request Quotation (Inhouse)" : "ขอใบเสนอราคา Inhouse"}</span>
        </Link>
      </div>

      <CourseAlertModal
        open={alertOpen}
        onOpenChange={setAlertOpen}
        course={course}
        locale={locale}
        source="course_detail"
      />
    </>
  );
}
