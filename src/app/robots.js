export default function robots() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thenexthumansskills.com";
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: "*",
        disallow: [
          "/th/*/admin",
          "/en/*/admin",
          "/th/*/admin/",
          "/en/*/admin/",
          "/th/*/admin-login",
          "/en/*/admin-login",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
