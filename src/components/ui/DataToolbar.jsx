export default function DataToolbar({
  query,
  setQuery,
  onExport,
  pageSize,
  setPageSize,
  extra,
}) {
  return (
    <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
      <div className="d-flex gap-2 flex-wrap">
        <input
          className="form-control"
          style={{ minWidth: 260 }}
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {extra}
      </div>

      <div className="d-flex gap-2 align-items-center">
        <select
          className="form-select"
          style={{ width: 120 }}
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>

        {onExport && (
          <button className="btn btn-outline-dark btn-sm" onClick={onExport}>
            Exportar CSV
          </button>
        )}
      </div>
    </div>
  );
}
