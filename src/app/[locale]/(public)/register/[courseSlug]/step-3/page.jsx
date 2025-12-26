import RegisterStep3Client from "./RegisterStep3Client";

export default async function Page({ params }) {
  const p = await params; // Next 15: params อาจเป็น Promise
  return <RegisterStep3Client locale={p?.locale} courseSlug={p?.courseSlug} />;
}
