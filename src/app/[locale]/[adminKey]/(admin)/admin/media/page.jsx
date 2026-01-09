import MediaAdminClient from "./MediaAdminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";

  return (
    <div className="p-6">
      <div className="text-white text-2xl font-semibold">Media Slider</div>
      <div className="text-white/70 mt-1">
        อัปโหลดรูป จัดลำดับ เปิด/ปิด และแก้ไขรายละเอียด
      </div>

      <div className="mt-6">
        <MediaAdminClient locale={locale} />
      </div>
    </div>
  );
}
