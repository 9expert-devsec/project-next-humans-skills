import PublicRegistersClient from "./PublicRegistersClient";

export default async function Page({ params }) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "th";
  const adminKey = p?.adminKey || "";

  return (
    <>
      <PublicRegistersClient locale={locale} adminKey={adminKey} />
    </>
  );
}
