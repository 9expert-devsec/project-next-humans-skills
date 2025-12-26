import RegisterStep2Client from "./RegisterStep2Client";

export default async function Page({ params }) {
  // Next 15: params อาจเป็น Promise ต้อง await ก่อนใช้งาน
  const p = await params;

  return <RegisterStep2Client locale={p?.locale} courseSlug={p?.courseSlug} />;
}
