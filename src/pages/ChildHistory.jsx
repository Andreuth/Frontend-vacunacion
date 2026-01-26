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

function Badge({ children, tone = "secondary" }) {
  return <span className={`badge text-bg-${tone} rounded-pill`}>{children}</span>;
}

export default function ChildHistory() {
  const { childId } = useParams();
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [openAll, setOpenAll] = useState(true);

  const [q, setQ] = useState(""); // buscar en historial

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const res = await api.get(`/visits/history/${childId}/full`);
        setData(res.data || []);
      } catch (e) {
        setError(e?.response?.data?.detail || "Error cargando historial");
      }
    })();
  }, [childId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return data;

    return data.filter((item) => {
      const visitStr = `${item.visit?.fecha_atencion} ${item.visit?.peso_kg} ${item.visit?.talla_cm} ${item.visit?.observaciones || ""}`.toLowerCase();
      const appsStr = (item.applications || [])
        .map((a) => `${a.vaccine_nombre} ${a.dosis_numero} ${a.fecha_aplicacion} ${a.lote || ""} ${a.proxima_fecha || ""}`.toLowerCase())
        .join(" ");
      return (visitStr + " " + appsStr).includes(query);
    });
  }, [data, q]);

  const totalApps = useMemo(() => {
    return (data || []).reduce((acc, it) => acc + (it.applications?.length || 0), 0);
  }, [data]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <div className="text-muted small">Historial</div>
            <h4 className="mb-1">Visitas y vacunas aplicadas</h4>
            <div className="d-flex gap-2 flex-wrap">
              <Badge tone="primary">{data.length} visitas</Badge>
              <Badge tone="success">{totalApps} aplicaciones</Badge>
              <Badge tone="secondary">Niño ID: {childId}</Badge>
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

        {/* buscador + acciones */}
        <div className="card border-0 shadow-sm mb-4" style={{ background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 60%)" }}>
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-8">
                <label className="form-label small text-muted mb-1">Buscar en historial</label>
                <input
                  className="form-control"
                  placeholder="Ej: pentavalente, 2026-01, lote, fiebre..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="col-md-4 d-flex gap-2">
                <button className="btn btn-outline-secondary w-100" onClick={() => setQ("")}>
                  Limpiar
                </button>
                <button className="btn btn-primary w-100" onClick={() => setOpenAll((p) => !p)}>
                  {openAll ? "Colapsar" : "Expandir"}
                </button>
              </div>
            </div>
            <div className="text-muted small mt-2">
              Mostrando <strong>{filtered.length}</strong> de {data.length} visitas.
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {filtered.map((item, idx) => (
          <div className="card border-0 shadow-sm mb-3" key={idx}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <div>
                  <div className="fw-bold">
                    Visita: {fmtDate(item.visit?.fecha_atencion)}
                    <span className="text-muted fw-normal">
                      {" "}
                      • Peso: {item.visit?.peso_kg} kg • Talla: {item.visit?.talla_cm} cm
                    </span>
                  </div>
                  {item.visit?.observaciones && (
                    <div className="text-muted mt-1">{item.visit.observaciones}</div>
                  )}
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  <Badge tone="secondary">{(item.applications || []).length} vacunas</Badge>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`apps-${idx}`);
                      if (el) el.classList.toggle("d-none");
                    }}
                  >
                    Ver/ocultar
                  </button>
                </div>
              </div>

              <div id={`apps-${idx}`} className={openAll ? "" : "d-none"}>
                <hr />
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Vacuna</th>
                        <th>Dosis</th>
                        <th>Fecha</th>
                        <th>Lote</th>
                        <th>Próxima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(item.applications || []).map((a) => (
                        <tr key={a.application_id}>
                          <td className="fw-semibold">{a.vaccine_nombre}</td>
                          <td>{a.dosis_numero}</td>
                          <td>{fmtDate(a.fecha_aplicacion)}</td>
                          <td className="text-muted">{a.lote || "-"}</td>
                          <td className="text-muted">{a.proxima_fecha ? fmtDate(a.proxima_fecha) : "-"}</td>
                        </tr>
                      ))}
                      {(item.applications || []).length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-muted">
                            Sin vacunas registradas en esta visita.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        ))}

        {filtered.length === 0 && !error && (
          <div className="text-center text-muted py-5">
            <div style={{ fontSize: 34 }}>🗂️</div>
            <div className="fw-semibold">Sin resultados</div>
            <div className="small">No se encontró información con ese filtro.</div>
          </div>
        )}
      </div>
    </>
  );
}

