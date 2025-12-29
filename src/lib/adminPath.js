export function adminBase(locale = "th") {
  const key = String(process.env.ADMIN_PATH_KEY || "").trim();
  return `/${locale}/${key}/admin`;
}
