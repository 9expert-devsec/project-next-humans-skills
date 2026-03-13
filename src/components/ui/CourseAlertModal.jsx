"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

function clean(x) {
  return String(x || "").trim();
}

function pickTitle(course, isEN) {
  return (
    (isEN ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    course?.title ||
    "Untitled"
  );
}

export default function CourseAlertModal({
  open = false,
  onOpenChange,
  course,
  locale = "th",
  source = "unknown",
}) {
  const isEN = locale === "en";
  const title = useMemo(() => pickTitle(course, isEN), [course, isEN]);
  const courseSlug = clean(course?.slug);

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [consentNotify, setConsentNotify] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setConsentNotify(false);
      setConsentMarketing(false);
      setLoading(false);
      setErr("");
      setDone(false);
      setAlreadyExists(false);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setErr("");

    if (!clean(email)) {
      setErr(isEN ? "Please enter your email." : "กรุณากรอกอีเมล");
      return;
    }

    if (!consentNotify) {
      setErr(
        isEN
          ? "Please accept the consent terms."
          : "กรุณายอมรับเงื่อนไขการใช้ข้อมูล",
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/public/course-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseSlug,
          email: clean(email),
          locale,
          source,
          consentNotify,
          consentMarketing,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            (isEN ? "Unable to save your email." : "ไม่สามารถบันทึกอีเมลได้"),
        );
      }

      setAlreadyExists(!!data?.alreadyExists);
      setDone(true);
    } catch (e2) {
      setErr(
        e2?.message ||
          (isEN ? "Unable to save your email." : "ไม่สามารถบันทึกอีเมลได้"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || !open) return null;

  const modalNode = (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#13263B] shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
            <div>
              <div className="text-lg font-extrabold text-white md:text-xl">
                {isEN
                  ? "Notify me when enrollment opens"
                  : "แจ้งเตือนเมื่อเปิดรับ"}
              </div>
              <div className="mt-1 text-sm text-white/65">{title}</div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label={isEN ? "Close" : "ปิด"}
            >
              <X className="h-4 w-4 shrink-0"/>
            </button>
          </div>

          <div className="px-5 py-5 md:px-6 md:py-6">
            {done ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="text-base font-extrabold text-emerald-200">
                  {alreadyExists
                    ? isEN
                      ? "You're already on the notification list."
                      : "อีเมลนี้อยู่ในรายการแจ้งเตือนแล้ว"
                    : isEN
                      ? "Your email has been saved."
                      : "บันทึกอีเมลเรียบร้อยแล้ว"}
                </div>

                <div className="mt-2 text-sm text-emerald-100/80">
                  {isEN
                    ? "We’ll notify you when this course opens for public registration."
                    : "เราจะแจ้งให้คุณทราบเมื่อหลักสูตรนี้เปิดรอบอบรมแบบ Public"}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => onOpenChange?.(false)}
                    className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white/90"
                  >
                    {isEN ? "Done" : "เรียบร้อย"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-white">
                    {isEN ? "Email" : "อีเมล"}
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isEN ? "your@email.com" : "example@email.com"}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 outline-none ring-0 transition focus:border-white/20 focus:bg-white/10"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0"
                    checked={consentNotify}
                    onChange={(e) => setConsentNotify(e.target.checked)}
                  />
                  <span className="text-sm leading-relaxed text-white/80">
                    {isEN
                      ? "I consent to The Next Humans Skills collecting and using my email to notify me when this course opens for public registration and to send information related to enrollment."
                      : "ข้าพเจ้ายินยอมให้ The Next Humans Skills เก็บและใช้อีเมลของข้าพเจ้าเพื่อแจ้งเมื่อหลักสูตรนี้เปิดรอบอบรมแบบ Public และส่งข้อมูลที่เกี่ยวข้องกับการลงทะเบียน"}
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0"
                    checked={consentMarketing}
                    onChange={(e) => setConsentMarketing(e.target.checked)}
                  />
                  <span className="text-sm leading-relaxed text-white/80">
                    {isEN
                      ? "I consent to receiving future news, courses, activities, or promotional updates from The Next Humans Skills."
                      : "ข้าพเจ้ายินยอมรับข่าวสารหลักสูตร กิจกรรม หรือข้อเสนออื่นจาก The Next Humans Skills ในอนาคต"}
                  </span>
                </label>

                {err ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {err}
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenChange?.(false)}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/10"
                  >
                    {isEN ? "Cancel" : "ยกเลิก"}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#E7C34A] px-4 py-3 text-sm font-extrabold text-slate-950 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? isEN
                        ? "Saving..."
                        : "กำลังบันทึก..."
                      : isEN
                        ? "Save my email"
                        : "บันทึกอีเมล"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
