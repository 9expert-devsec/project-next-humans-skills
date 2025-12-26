"use client";

import { useEffect, useMemo, useState } from "react";

export default function CourseDetailClient({ locale = "th", id, ssrItem }) {
  const t = useMemo(() => {
    return locale === "en"
      ? {
          loading: "Loading...",
          notFound: "Course not found",
          active: "Active",
          inactive: "Inactive",
          delete: "Delete",
          deleting: "Deleting...",
          confirmDel: "Delete this course?",
          cover: "Cover",
          titleTH: "Title (TH)",
          titleEN: "Title (EN)",
          slug: "Slug",
          shortTH: "Short (TH)",
          shortEN: "Short (EN)",
          detailTH: "Detail (TH)",
          detailEN: "Detail (EN)",
          status: "Status",
        }
      : {
          loading: "กำลังโหลด...",
          notFound: "ไม่พบคอร์ส",
          active: "Active",
          inactive: "Inactive",
          delete: "ลบคอร์ส",
          deleting: "กำลังลบ...",
          confirmDel: "ต้องการลบคอร์สนี้ใช่ไหม?",
          cover: "รูปปก",
          titleTH: "ชื่อคอร์ส (TH)",
          titleEN: "ชื่อคอร์ส (EN)",
          slug: "Slug",
          shortTH: "คำโปรย (TH)",
          shortEN: "คำโปรย (EN)",
          detailTH: "รายละเอียด (TH)",
          detailEN: "รายละเอียด (EN)",
          status: "สถานะ",
        };
  }, [locale]);

  const [item, setItem] = useState(ssrItem || null);
  const [loading, setLoading] = useState(!ssrItem);
  const [msg, setMsg] = useState("");
  const [busyDel, setBusyDel] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      setMsg("");
      try {
        const res = await fetch(`/api/admin/courses/${id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Load failed");
        if (alive) setItem(data?.item || null);
      } catch (e) {
        if (alive) setMsg(e?.message || "Error");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  async function onDelete() {
    if (!confirm(t.confirmDel)) return;
    setBusyDel(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      location.href = `/${locale}/admin/courses`;
    } catch (e) {
      setMsg(e?.message || "Error");
      setBusyDel(false);
    }
  }

  if (loading) return <div className="ns-muted">{t.loading}</div>;
  if (!item) return <div className="ns-alert">{t.notFound}</div>;

  return (
    <div style={{ paddingTop: 14 }}>
      <div className="ns-grid2">
        <div>
          <div className="ns-muted" style={{ marginBottom: 8 }}>
            {t.status}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="ns-chip" data-active={item.isActive ? "1" : "0"}>
              {item.isActive ? t.active : t.inactive}
            </span>

            <button
              className="ns-btnDanger"
              onClick={onDelete}
              disabled={busyDel}
            >
              {busyDel ? t.deleting : t.delete}
            </button>
          </div>

          <div style={{ marginTop: 14 }} className="ns-infoGrid">
            <div className="ns-infoRow">
              <div className="ns-infoKey">{t.titleTH}</div>
              <div className="ns-infoVal">{item.title_th || "-"}</div>
            </div>
            <div className="ns-infoRow">
              <div className="ns-infoKey">{t.titleEN}</div>
              <div className="ns-infoVal">{item.title_en || "-"}</div>
            </div>
            <div className="ns-infoRow">
              <div className="ns-infoKey">{t.slug}</div>
              <div className="ns-infoVal">
                <code>{item.slug || "-"}</code>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="ns-muted" style={{ marginBottom: 8 }}>
            {t.cover}
          </div>
          {item.coverUrl ? (
            <div className="ns-coverPreview">
              <img src={item.coverUrl} alt="cover" />
            </div>
          ) : (
            <div className="ns-emptyBox">No cover</div>
          )}
        </div>
      </div>

      <div className="ns-grid2" style={{ marginTop: 14 }}>
        <div>
          <div className="ns-muted" style={{ marginBottom: 6 }}>
            {t.shortTH}
          </div>
          <div className="ns-prose">{item.short_th || "-"}</div>
        </div>
        <div>
          <div className="ns-muted" style={{ marginBottom: 6 }}>
            {t.shortEN}
          </div>
          <div className="ns-prose">{item.short_en || "-"}</div>
        </div>
      </div>

      <div className="ns-grid2" style={{ marginTop: 14 }}>
        <div>
          <div className="ns-muted" style={{ marginBottom: 6 }}>
            {t.detailTH}
          </div>
          <div className="ns-prose">{item.detail_th || "-"}</div>
        </div>
        <div>
          <div className="ns-muted" style={{ marginBottom: 6 }}>
            {t.detailEN}
          </div>
          <div className="ns-prose">{item.detail_en || "-"}</div>
        </div>
      </div>

      {msg ? (
        <div className="ns-alert" style={{ marginTop: 12 }}>
          {msg}
        </div>
      ) : null}
    </div>
  );
}
