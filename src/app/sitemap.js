export default async function sitemap() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thenexthumansskills.com";

  // ดึงคอร์สจาก API ของคุณ
  const res = await fetch(`${baseUrl}/api/public/courses`, {
    cache: "no-store",
  }).catch(() => null);
  const data = (await res?.json().catch(() => ({}))) || {};
  const items = Array.isArray(data?.items) ? data.items : [];

  const now = new Date();

  const base = [
    {
      url: `${baseUrl}/th`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/th/courses`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en/courses`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const coursePages = items.flatMap((c) => {
    const slug = encodeURIComponent(String(c?.slug || ""));
    if (!slug) return [];
    const last = c?.updatedAt ? new Date(c.updatedAt) : now;

    return [
      {
        url: `${baseUrl}/th/courses/${slug}`,
        lastModified: last,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/en/courses/${slug}`,
        lastModified: last,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];
  });

  return [...base, ...coursePages];
}
