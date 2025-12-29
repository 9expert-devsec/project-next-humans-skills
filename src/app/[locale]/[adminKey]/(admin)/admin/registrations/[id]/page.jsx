import RegistrationDetailClient from "./RegistrationDetailClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  const { locale, id } = await params;
  return <RegistrationDetailClient locale={locale || "th"} id={id} />;
}
