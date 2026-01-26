import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

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
  return <span className={`badge ${late ? "text-bg-danger" : "text-bg-success"} rounded-pill`}>{estado}</span>;
}

function Pill({ children, tone = "secondary" }) {
  return <span className={`badge text-bg-${tone} rounded-pill`}>{children}</span>;
}

export default function ChildNextVaccines() {
  const { childId } = useParams();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("ALL"); // ALL | ATRASADA | AL_DIA

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const res = await api.get(`/children/${childId}/next-vaccines`);
        setItems(res.data.items || []);
      } catch (e) {
        setError(e?.response?.data?.detail || "Error cargando próximas vacunas");
      }
    })();
  }, [childId]);

  const stats = useMemo(() => {
    const atrasadas = items.filter((x) => x.estado === "ATRASADA").length;
    const alDia = items.length - atrasadas;
    return { atrasadas, alDia, total: items.length };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;

    if (estado === "ATRASADA") list = list.filter((x) => x.estado === "ATRASADA");
    if (estado === "AL_DIA") list = list.filter((x) => x.estado !== "ATRASADA");

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((x) => {
        const s = `${x.vaccine_nombre} ${x.dosis_numero} ${x.edad_objetivo_meses} ${x.fecha_recomendada} ${x.estado}`.toLowerCase();
        return s.includes(query);
      });
    }

    // orden por fecha recomendada (si existe)
    return [...list].sort((a, b) => String(a.fecha_recomendada || "").localeCompare(String(b.fecha_recomendada || "")));
  }, [items, q, estado]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <div className="text-muted small">Próximas vacunas</div>
            <h4 className="mb-1">Pendientes y recomendadas</h4>
            <div className="d-flex gap-2 flex-wrap">
              <Pill tone="primary">Total: {stats.total}</Pill>
              <Pill tone="danger">Atrasadas: {stats.atrasadas}</Pill>
              <Pill tone="success">Al día: {stats.alDia}</Pill>
              <Pill tone="secondary">Niño ID: {childId}</Pill>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
              <i className="bi bi-printer me-1" />
              Imprimir
            </button>
            <Link className="btn btn-outline-dark btn-sm" to="/representative">
              Volver
            </Link>
          </div>
        </div>

        {/* filtros */}
        <div className="card border-0 shadow-sm mb-4" style={{ background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 60%)" }}>
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-7">
                <label className="form-label small text-muted mb-1">Buscar</label>
                <input
                  className="form-control"
                  placeholder="Ej: pentavalente, dosis 2, 6 meses..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label small text-muted mb-1">Estado</label>
                <select className="form-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="ALL">Todos</option>
                  <option value="ATRASADA">Atrasadas</option>
                  <option value="AL_DIA">Al día</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <div className="text-muted small">
                Mostrando <strong>{filtered.length}</strong> de {items.length}
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setQ(""); setEstado("ALL"); }}>
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Vacuna</th>
                    <th>Dosis</th>
                    <th>Edad (meses)</th>
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

                  {filtered.length === 0 && !error && (
                    <tr>
                      <td colSpan="5" className="text-muted text-center py-4">
                        No hay vacunas pendientes 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-muted small mt-2">
              Nota: “Atrasada” significa que la fecha recomendada ya pasó.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
