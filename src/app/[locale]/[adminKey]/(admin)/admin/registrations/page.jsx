import RegistrationsClient from "./RegistrationsClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { locale, adminKey } = await params;

  return (
    <RegistrationsClient
      locale={locale === "en" ? "en" : "th"}
      adminKey={String(adminKey || "")}
    />
  );
}
