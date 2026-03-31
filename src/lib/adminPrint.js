function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderFilters(filters = []) {
  const safe = filters.filter((x) => x && x.value);
  if (!safe.length) return "";

  return `
    <div class="meta-row">
      ${safe
        .map(
          (x) => `
            <div class="meta-chip">
              <span class="meta-label">${esc(x.label)}</span>
              <span class="meta-value">${esc(x.value)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderSummary(summary = []) {
  if (!summary.length) return "";

  return `
    <div class="summary-row">
      ${summary
        .map(
          (x) => `
            <div class="summary-card">
              <div class="summary-label">${esc(x.label)}</div>
              <div class="summary-value">${esc(x.value)}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTable(columns = [], rows = []) {
  return `
    <table>
      <thead>
        <tr>
          ${columns.map((c) => `<th>${esc(c.label)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row) => `
                    <tr>
                      ${columns
                        .map((c) => `<td>${row[c.key] ?? ""}</td>`)
                        .join("")}
                    </tr>
                  `,
                )
                .join("")
            : `<tr><td colspan="${columns.length}" class="empty">No data</td></tr>`
        }
      </tbody>
    </table>
  `;
}

export function openAdminPrintWindow({
  reportTitle = "Report",
  brandTitle = "The Next Humans Skills",
  printedAt = "",
  filters = [],
  summary = [],
  columns = [],
  rows = [],
}) {
  const html = `
    <!doctype html>
    <html lang="th">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${esc(brandTitle)} - ${esc(reportTitle)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 14mm;
          }

          * { box-sizing: border-box; }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            padding: 0;
          }

          .page {
            width: 100%;
            padding: 0;
          }

          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }

          .brand {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.02em;
          }

          .report-title {
            margin-top: 4px;
            font-size: 16px;
            font-weight: 700;
          }

          .printed-at {
            margin-top: 6px;
            font-size: 12px;
            color: #475569;
          }

          .summary-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 12px 0 10px;
          }

          .summary-card {
            min-width: 160px;
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            border-radius: 10px;
            background: #f8fafc;
          }

          .summary-label {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 4px;
          }

          .summary-value {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }

          .meta-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin: 8px 0 14px;
          }

          .meta-chip {
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 11px;
            background: #fff;
          }

          .meta-label {
            color: #64748b;
            margin-right: 6px;
          }

          .meta-value {
            color: #0f172a;
            font-weight: 700;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          thead {
            display: table-header-group;
          }

          th, td {
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            vertical-align: top;
            text-align: left;
            word-break: break-word;
            font-size: 11px;
            line-height: 1.45;
          }

          th {
            background: #e2e8f0;
            font-weight: 700;
          }

          tbody tr:nth-child(even) td {
            background: #f8fafc;
          }

          .empty {
            text-align: center;
            padding: 24px;
            color: #64748b;
          }

          .footer {
            margin-top: 10px;
            font-size: 10px;
            color: #64748b;
            text-align: right;
          }

          @media print {
            html, body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="brand">${esc(brandTitle)}</div>
            <div class="report-title">${esc(reportTitle)}</div>
            <div class="printed-at">Printed at: ${esc(printedAt)}</div>
          </div>

          ${renderSummary(summary)}
          ${renderFilters(filters)}
          ${renderTable(columns, rows)}

          <div class="footer">${esc(brandTitle)}</div>
        </div>
      </body>
    </html>
  `;

  // สำคัญ: อย่าใส่ noopener,noreferrer ตอนที่ยังต้องเขียน document ลงหน้าต่างใหม่
  const w = window.open("", "_blank");

  if (!w) {
    alert(
      "Browser blocked the print window. Please allow pop-ups and try again.",
    );
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();

  w.focus();

  // รอให้ DOM และ layout เสร็จก่อนค่อย print
  setTimeout(() => {
    try {
      w.print();
    } catch (err) {
      console.error("print failed:", err);
    }
  }, 400);
}
