export function extractYouTubeId(input) {
  const s = String(input || "").trim();
  if (!s) return "";

  let m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = s.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  m = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (m?.[1]) return m[1];

  return "";
}

export function toYouTubeEmbedUrl(urlOrId) {
  const s = String(urlOrId || "").trim();
  if (!s) return "";
  const id = s.includes("/") ? extractYouTubeId(s) : s;
  return id ? `https://www.youtube.com/embed/${id}` : "";
}
