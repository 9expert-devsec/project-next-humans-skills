"use client";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

export default function PrintPreviewModal({
  open,
  title = "Print Preview",
  subtitle = "",
  filters = [],
  summary = [],
  columns = [],
  rows = [],
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  const previewRows = rows.slice(0, 8);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 p-4">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
        <div className="max-h-[90vh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              The Next Humans Skills
            </div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            ) : null}
          </div>

          <div className="max-h-[calc(90vh-148px)] overflow-auto px-6 py-5">
            {!!summary.length && (
              <div className="mb-4 grid gap-3 md:grid-cols-3">
                {summary.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!!filters.length && (
              <div className="mb-4 flex flex-wrap gap-2">
                {filters
                  .filter((x) => x?.value)
                  .map((item, i) => (
                    <div
                      key={i}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
                    >
                      <span className="text-slate-500">{item.label}: </span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="border-b border-slate-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="odd:bg-white even:bg-slate-50">
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700 align-top"
                            dangerouslySetInnerHTML={{
                              __html: row[col.key] ?? "-",
                            }}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {rows.length > previewRows.length ? (
              <p className="mt-3 text-sm text-slate-500">
                Preview showing first {previewRows.length} rows from{" "}
                {rows.length} total rows
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Open Print View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
