import RegistrationsClient from "./RegistrationsClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { locale } = await params;
  return <RegistrationsClient locale={locale || "th"} />;
}
