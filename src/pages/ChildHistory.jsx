import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import AppLayout from "../components/AppLayout";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

export default function ChildHistory() {
  const { childId } = useParams();
  const [data, setData] = useState(null);
  const [child, setChild] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      // Historial completo
      const res = await api.get(`/visits/history/${childId}/full`);
      setData(res.data || null);

      // Info del niño (por encabezado)
      const all = await api.get("/children/");
      const found = (all.data || []).find((c) => String(c.id) === String(childId));
      setChild(found || null);
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo cargar historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [childId]);

  const items = useMemo(() => {
    // backend puede devolver array directo o {items:[...]}
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.history)) return data.history;
    return [];
  }, [data]);

  return (
    <AppLayout title="Cartilla / Historial">
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="bg-white shadow-sm p-3 mb-3 no-print" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="fw-bold">{child ? `${child.nombres} ${child.apellidos}` : `Niño #${childId}`}</div>
            <div className="text-muted small">Formato listo para imprimir.</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              Imprimir / PDF
            </button>
            <Link className="btn btn-outline-secondary btn-sm" to={`/children/${childId}/next-vaccines`}>
              Ver próximas
            </Link>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>
              Recargar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-muted">Cargando...</div>
      ) : (
        <div className="print-page">
          <div className="bg-white shadow-sm p-4 print-card" style={{ borderRadius: 16 }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="m-0">Cartilla de Vacunación Infantil</h5>
                <div className="text-muted">SISCONI — Centro de salud “María Auxiliadora”</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Fecha de impresión</div>
                <div>{new Date().toLocaleString()}</div>
              </div>
            </div>

            <hr />

            <div className="row g-2 mb-3">
              <div className="col-12 col-md-4">
                <div className="text-muted small">Paciente</div>
                <div className="fw-bold">{child ? `${child.nombres} ${child.apellidos}` : `#${childId}`}</div>
              </div>
              <div className="col-12 col-md-4">
                <div className="text-muted small">Documento</div>
                <div>{child?.numero_documento ?? "—"}</div>
              </div>
              <div className="col-12 col-md-4">
                <div className="text-muted small">Nacimiento</div>
                <div>{fmtDate(child?.fecha_nacimiento)}</div>
              </div>
            </div>

            <h6 className="mt-3">Historial de vacunas aplicadas</h6>

            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vacuna</th>
                    <th>Dosis</th>
                    <th>Fecha</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{it.vaccine_nombre ?? it.vaccine ?? it.nombre ?? "—"}</td>
                      <td>{it.dosis_numero ?? it.dosis ?? "—"}</td>
                      <td>{fmtDate(it.fecha_aplicacion ?? it.fecha_atencion ?? it.date ?? it.created_at)}</td>
                      <td>{it.observacion ?? it.note ?? "—"}</td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">
                        Sin registros aún
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <div className="text-muted small">Firmas</div>
              <div className="row g-3 mt-1">
                <div className="col-12 col-md-6">
                  <div style={{ borderTop: "1px solid #aaa", paddingTop: 8 }}>Pediatra / Responsable</div>
                </div>
                <div className="col-12 col-md-6">
                  <div style={{ borderTop: "1px solid #aaa", paddingTop: 8 }}>Representante</div>
                </div>
              </div>
            </div>

            <div className="text-muted small mt-3">
              Este documento fue generado automáticamente por SISCONI. Verifique la información en el sistema.
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
