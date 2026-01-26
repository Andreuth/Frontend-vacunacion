import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

function EstadoBadge({ estado }) {
  const late = estado === "ATRASADA";
  return <span className={`badge ${late ? "text-bg-danger" : "text-bg-success"}`}>{estado}</span>;
}

export default function ChildNextVaccines() {
  const { childId } = useParams();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [onlyLate, setOnlyLate] = useState(false);

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      try {
        const res = await api.get(`/children/${childId}/next-vaccines`);
        setItems(res.data.items || []);
      } catch (e) {
        setError(e?.response?.data?.detail || "Error cargando próximas vacunas");
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const hasLate = useMemo(() => items.some((x) => x.estado === "ATRASADA"), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((x) => (onlyLate ? x.estado === "ATRASADA" : true))
      .filter((x) =>
        q
          ? `${x.vaccine_nombre} ${x.dosis_numero} ${x.edad_objetivo_meses} ${x.estado}`.toLowerCase().includes(q)
          : true
      );
  }, [items, query, onlyLate]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h4 className="mb-1">Próximas vacunas</h4>
            <div className="text-muted small">
              Pendientes: <strong>{items.length}</strong>
            </div>
          </div>
          <div className="d-flex gap-2 d-print-none">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
              Imprimir
            </button>
            <Link className="btn btn-outline-dark btn-sm" to="/representative">
              Volver
            </Link>
          </div>
        </div>

        {hasLate && !error && (
          <div className="alert alert-warning d-print-none">
            ⚠️ Hay vacunas <strong>atrasadas</strong>. Recomendación: acudir al centro de salud.
          </div>
        )}

        {loading && <div className="alert alert-info py-2">Cargando próximas vacunas...</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-2 mb-3 d-print-none">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Buscar por vacuna, dosis, edad o estado..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="col-md-6 d-flex align-items-center justify-content-md-end gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="onlyLate"
                checked={onlyLate}
                onChange={(e) => setOnlyLate(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="onlyLate">
                Ver solo atrasadas
              </label>
            </div>
          </div>
        </div>

        <div className="border rounded-3 p-3 bg-white shadow-sm">
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Vacuna</th>
                  <th>Dosis</th>
                  <th>Edad objetivo (meses)</th>
                  <th>Fecha recomendada</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => (
                  <tr key={x.schedule_id}>
                    <td className="fw-semibold">{x.vaccine_nombre}</td>
                    <td>{x.dosis_numero}</td>
                    <td>{x.edad_objetivo_meses}</td>
                    <td>{fmtDate(x.fecha_recomendada)}</td>
                    <td><EstadoBadge estado={x.estado} /></td>
                  </tr>
                ))}

                {filtered.length === 0 && !error && !loading && (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No hay resultados.
                    </td>
                  </tr>
                )}

                {items.length === 0 && !error && !loading && (
                  <tr>
                    <td colSpan="5" className="text-muted">
                      No hay vacunas pendientes 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small mt-2">
            Nota: la “fecha recomendada” se calcula según el esquema y fecha de nacimiento.
          </div>
        </div>
      </div>
    </>
  );
}
