import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import PrintCartilla from "../components/PrintCartilla";

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

export default function ChildHistory() {
  const { childId } = useParams();

  const [data, setData] = useState([]);
  const [child, setChild] = useState(null);
  const [error, setError] = useState("");

  // filtros para hacerlo más pro
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(""); // yyyy-mm-dd
  const [to, setTo] = useState("");     // yyyy-mm-dd

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const [historyRes, myChildrenRes] = await Promise.all([
          api.get(`/visits/history/${childId}/full`),
          api.get(`/children/my`), // ✅ para datos del niño
        ]);

        setData(historyRes.data || []);

        const found = (myChildrenRes.data || []).find((c) => String(c.id) === String(childId));
        setChild(found || null);
      } catch (e) {
        setError(e?.response?.data?.detail || "Error cargando historial");
      }
    })();
  }, [childId]);

  // Flatten de aplicaciones para estadísticas (opcional)
  const stats = useMemo(() => {
    const visits = data.length;
    let apps = 0;
    data.forEach((x) => (apps += (x.applications || []).length));
    return { visits, apps };
  }, [data]);

  // Filtrado pro (por texto + rango fechas)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const inRange = (visitDate) => {
      if (!visitDate) return true;
      const d = String(visitDate).slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    return (data || [])
      .filter((item) => inRange(item?.visit?.fecha_atencion))
      .filter((item) => {
        if (!query) return true;
        const visitStr = `${item?.visit?.fecha_atencion} ${item?.visit?.peso_kg} ${item?.visit?.talla_cm} ${item?.visit?.observaciones || ""}`.toLowerCase();
        const appsStr = (item?.applications || [])
          .map((a) => `${a.vaccine_nombre} ${a.dosis_numero} ${a.fecha_aplicacion} ${a.lote || ""}`)
          .join(" ")
          .toLowerCase();
        return (visitStr + " " + appsStr).includes(query);
      })
      .sort((a, b) => String(b?.visit?.fecha_atencion || "").localeCompare(String(a?.visit?.fecha_atencion || "")));
  }, [data, q, from, to]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        {/* UI normal */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <div className="text-muted small">Historial</div>
            <h4 className="mb-1">Visitas y vacunas aplicadas</h4>
            <div className="text-muted small">
              Visitas: <strong>{stats.visits}</strong> • Aplicaciones: <strong>{stats.apps}</strong>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()} disabled={!child}>
              <i className="bi bi-printer me-1" />
              Imprimir cartilla
            </button>
            <Link className="btn btn-outline-dark btn-sm" to="/representative">
              Volver
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-6">
                <label className="form-label small text-muted mb-1">Buscar</label>
                <input
                  className="form-control"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ej: polio, fiebre, lote, dosis 2..."
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Desde</label>
                <input className="form-control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Hasta</label>
                <input className="form-control" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="col-12 mt-2 d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => { setQ(""); setFrom(""); setTo(""); }}>
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Tabla / tarjetas UI */}
        {filtered.map((item, idx) => (
          <div className="card border-0 shadow-sm mb-3" key={idx}>
            <div className="card-body">
              <div className="d-flex justify-content-between flex-wrap gap-2">
                <h6 className="mb-1">
                  Visita: {fmtDate(item.visit.fecha_atencion)}{" "}
                  <span className="text-muted fw-normal">
                    • Peso: {item.visit.peso_kg} kg • Talla: {item.visit.talla_cm} cm
                  </span>
                </h6>
              </div>

              {item.visit.observaciones && <div className="text-muted small mt-1">{item.visit.observaciones}</div>}

              <div className="table-responsive mt-3">
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
        ))}

        {filtered.length === 0 && !error && (
          <div className="text-muted text-center py-4">Sin historial aún.</div>
        )}

        {/* ====== SOLO ESTO SE IMPRIME ====== */}
        {child && (
          <PrintCartilla
            child={child}
            subtitle="Historial de visitas y vacunas aplicadas"
            rightMetaLines={[
              `Niño ID: ${childId}`,
              `Visitas: ${stats.visits} | Aplicaciones: ${stats.apps}`,
            ]}
          >
            <div className="section-title">Historial de vacunas aplicadas</div>

            {(data || []).length === 0 ? (
              <div className="avoid-break">
                <table>
                  <tbody>
                    <tr>
                      <td>No existe historial registrado.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              (data || [])
                .slice()
                .sort((a, b) => String(a?.visit?.fecha_atencion || "").localeCompare(String(b?.visit?.fecha_atencion || "")))
                .map((item, idx) => (
                  <div key={idx} className="avoid-break" style={{ marginTop: 10 }}>
                    <div className="section-title" style={{ marginTop: 8 }}>
                      Visita: {fmtDate(item.visit.fecha_atencion)} — Peso: {item.visit.peso_kg} kg — Talla:{" "}
                      {item.visit.talla_cm} cm
                    </div>

                    {item.visit.observaciones ? (
                      <div className="small-note">Observaciones: {item.visit.observaciones}</div>
                    ) : null}

                    <table>
                      <thead>
                        <tr>
                          <th>Vacuna</th>
                          <th>Dosis</th>
                          <th>Fecha aplicación</th>
                          <th>Lote</th>
                          <th>Próxima fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(item.applications || []).map((a) => (
                          <tr key={a.application_id}>
                            <td><strong>{a.vaccine_nombre}</strong></td>
                            <td>{a.dosis_numero}</td>
                            <td>{fmtDate(a.fecha_aplicacion)}</td>
                            <td>{a.lote || "-"}</td>
                            <td>{a.proxima_fecha ? fmtDate(a.proxima_fecha) : "-"}</td>
                          </tr>
                        ))}

                        {(item.applications || []).length === 0 && (
                          <tr>
                            <td colSpan="5">Sin vacunas registradas en esta visita.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))
            )}
          </PrintCartilla>
        )}
      </div>
    </>
  );
}
