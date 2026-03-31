import PublicRegisterEditClient from "./PublicRegisterEditClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const p = await params;

  return (
    <PublicRegisterEditClient
      locale={p?.locale === "en" ? "en" : "th"}
      adminKey={String(p?.adminKey || "")}
      id={String(p?.id || "")}
    />
  );
}
