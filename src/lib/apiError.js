export function toJsonError(err) {
  const status = Number(err?.status || err?.code || 500);
  const msg = String(err?.message || "Server error");
  return Response.json({ ok: false, error: msg }, { status });
}