import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

function calcAgeLabel(fecha_nacimiento) {
  if (!fecha_nacimiento) return "-";
  const birth = new Date(fecha_nacimiento + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return fecha_nacimiento;

  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) months = 0;

  if (months < 24) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years} años ${rem} meses` : `${years} años`;
}

function SexBadge({ sexo }) {
  const map = { M: "Niño", F: "Niña", OTRO: "Otro" };
  return <span className="badge text-bg-light border">{map[sexo] || sexo || "-"}</span>;
}

export default function RepresentativeDashboard() {
  const [children, setChildren] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const navigate = useNavigate();

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/children/my");
      setChildren(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Error cargando niños");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return children;
    return children.filter((c) =>
      `${c.nombres} ${c.apellidos} ${c.numero_documento}`.toLowerCase().includes(q)
    );
  }, [children, query]);

  const goHistory = (childId) => navigate(`/representative/history/${childId}`);
  const goNext = (childId) => navigate(`/representative/next/${childId}`);

  return (
    <>
      <Navbar />

      <div className="container py-4">
        {/* Header estilo “familia” (diferente al admin/pediatra) */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h4 className="mb-1">Mis hijos</h4>
            <div className="text-muted small">
              Consulta historial y próximas vacunas de cada niño.
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm d-print-none" onClick={load} disabled={loading}>
              {loading ? "Cargando..." : "Refrescar"}
            </button>
            <button className="btn btn-outline-dark btn-sm d-print-none" onClick={() => window.print()}>
              Imprimir
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 mb-3 d-print-none">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Buscar por nombre o documento..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="col-md-6 d-flex align-items-center justify-content-md-end text-muted small">
            Total: <strong className="ms-1">{children.length}</strong>
          </div>
        </div>

        <div className="row g-3">
          {filtered.map((c) => (
            <div className="col-md-6" key={c.id}>
              <div className="border rounded-3 p-3 bg-white shadow-sm h-100">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <div>
                    <div className="fw-semibold fs-5">
                      {c.nombres} {c.apellidos}
                    </div>
                    <div className="text-muted small mt-1">
                      Edad: <strong>{calcAgeLabel(c.fecha_nacimiento)}</strong>
                    </div>
                  </div>
                  <SexBadge sexo={c.sexo} />
                </div>

                <hr className="my-3" />

                <div className="small">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Documento</span>
                    <span className="fw-semibold">{c.numero_documento}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Nacimiento</span>
                    <span className="fw-semibold">{c.fecha_nacimiento || "-"}</span>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3 d-print-none flex-wrap">
                  <button className="btn btn-outline-primary btn-sm" onClick={() => goHistory(c.id)}>
                    Ver historial
                  </button>
                  <button className="btn btn-outline-success btn-sm" onClick={() => goNext(c.id)}>
                    Ver próximas
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !error && (
            <div className="text-muted">No tienes niños asociados.</div>
          )}
        </div>
      </div>
    </>
  );
}
