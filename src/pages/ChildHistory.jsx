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

export default function ChildHistory() {
  const { childId } = useParams();
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      try {
        const res = await api.get(`/visits/history/${childId}/full`);
        setData(res.data || []);
      } catch (e) {
        setError(e?.response?.data?.detail || "Error cargando historial");
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const totalApps = useMemo(() => {
    return data.reduce((acc, x) => acc + (x.applications?.length || 0), 0);
  }, [data]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        {/* Header (con resumen) */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h4 className="mb-1">Historial de atenciones</h4>
            <div className="text-muted small">
              Visitas registradas: <strong>{data.length}</strong> • Vacunas aplicadas:{" "}
              <strong>{totalApps}</strong>
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

        {loading && <div className="alert alert-info py-2">Cargando historial...</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {data.map((item, idx) => (
          <div className="border rounded-3 p-3 bg-white shadow-sm mb-3" key={idx}>
            <div className="d-flex justify-content-between flex-wrap gap-2">
              <div>
                <div className="fw-semibold">
                  Visita: {fmtDate(item.visit.fecha_atencion)}
                </div>
                <div className="text-muted small mt-1">
                  Peso: <strong>{item.visit.peso_kg}</strong> kg • Talla:{" "}
                  <strong>{item.visit.talla_cm}</strong> cm
                </div>
              </div>

              <div className="text-muted small">
                Vacunas en visita: <strong>{item.applications?.length || 0}</strong>
              </div>
            </div>

            {item.visit.observaciones && (
              <div className="mt-2 p-2 rounded bg-light">
                <div className="text-muted small">Observaciones</div>
                <div>{item.visit.observaciones}</div>
              </div>
            )}

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
                  {item.applications.map((a) => (
                    <tr key={a.application_id}>
                      <td className="fw-semibold">{a.vaccine_nombre}</td>
                      <td>{a.dosis_numero}</td>
                      <td>{fmtDate(a.fecha_aplicacion)}</td>
                      <td className="text-muted">{a.lote || "-"}</td>
                      <td className="text-muted">{a.proxima_fecha ? fmtDate(a.proxima_fecha) : "-"}</td>
                    </tr>
                  ))}
                  {(!item.applications || item.applications.length === 0) && (
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
        ))}

        {data.length === 0 && !error && !loading && (
          <div className="text-muted">Sin historial aún.</div>
        )}
      </div>
    </>
  );
}
