import { useMemo, useState } from "react";

/**
 * Simple client-side table with:
 * - Search (all columns)
 * - Pagination
 *
 * props:
 *  - rows: array of objects
 *  - columns: [{ key, header, render?(row) }]
 *  - keyField: unique key (default "id")
 */
export default function DataTable({ rows = [], columns = [], keyField = "id", searchPlaceholder = "Buscar..." }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const qq = q.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = r?.[c.key];
        return String(v ?? "").toLowerCase().includes(qq);
      })
    );
  }, [rows, q, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
      <div className="d-flex gap-2 align-items-center mb-2">
        <input
          className="form-control"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
        />
        <div className="text-muted small">{filtered.length} registros</div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r[keyField]}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(r) : String(r?.[c.key] ?? "")}</td>
                ))}
              </tr>
            ))}
            {!paged.length && (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-4">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-secondary btn-sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          ◀ Anterior
        </button>
        <div className="text-muted small">
          Página {safePage} / {totalPages}
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={safePage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Siguiente ▶
        </button>
      </div>
    </div>
  );
}
