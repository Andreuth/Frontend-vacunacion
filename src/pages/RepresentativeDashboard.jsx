import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function calcAgeMonths(birthISO) {
  if (!birthISO) return null;
  try {
    const b = new Date(birthISO + "T00:00:00");
    const now = new Date();
    let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
    if (now.getDate() < b.getDate()) months -= 1;
    return Math.max(0, months);
  } catch {
    return null;
  }
}

function Header({ title, subtitle, right }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div className="text-muted small">Representante</div>
          <h4 className="mb-1">{title}</h4>
          {subtitle && <div className="text-muted">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center text-muted py-5">
      <div className="mb-2" style={{ fontSize: 34 }}>👶</div>
      <div className="fw-semibold">Sin registros</div>
      <div className="small">{text}</div>
    </div>
  );
}

function SexPill({ sexo }) {
  const map = { M: "primary", F: "danger", OTRO: "secondary" };
  const tone = map[sexo] || "secondary";
  return <span className={`badge text-bg-${tone} rounded-pill`}>{sexo || "—"}</span>;
}

export default function RepresentativeDashboard() {
  const [children, setChildren] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // filtros
  const [query, setQuery] = useState("");
  const [sexo, setSexo] = useState("ALL");
  const [sort, setSort] = useState("NAME_ASC"); // NAME_ASC | NAME_DESC | BIRTH_ASC | BIRTH_DESC

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
    let list = children;

    if (sexo !== "ALL") list = list.filter((c) => c.sexo === sexo);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const s = `${c.nombres} ${c.apellidos} ${c.numero_documento} ${c.fecha_nacimiento} ${c.sexo}`.toLowerCase();
        return s.includes(q);
      });
    }

    const sorters = {
      NAME_ASC: (a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`, "es", { sensitivity: "base" }),
      NAME_DESC: (a, b) => `${b.apellidos} ${b.nombres}`.localeCompare(`${a.apellidos} ${a.nombres}`, "es", { sensitivity: "base" }),
      BIRTH_ASC: (a, b) => String(a.fecha_nacimiento || "").localeCompare(String(b.fecha_nacimiento || "")),
      BIRTH_DESC: (a, b) => String(b.fecha_nacimiento || "").localeCompare(String(a.fecha_nacimiento || "")),
    };

    return [...list].sort(sorters[sort]);
  }, [children, query, sexo, sort]);

  const goHistory = (childId) => navigate(`/representative/history/${childId}`);
  const goNext = (childId) => navigate(`/representative/next/${childId}`);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <Header
          title="Mis niños"
          subtitle="Consulta historial y próximas vacunas."
          right={
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
                {loading ? "Cargando..." : "Refrescar"}
              </button>
              <button className="btn btn-outline-dark btn-sm" onClick={() => window.print()}>
                Imprimir
              </button>
            </div>
          }
        />

        {/* panel de filtros */}
        <div className="card border-0 shadow-sm mb-4" style={{ background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 60%)" }}>
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-5">
                <label className="form-label small text-muted mb-1">Buscar</label>
                <input
                  className="form-control"
                  placeholder="Nombre, documento, fecha..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Sexo</label>
                <select className="form-select" value={sexo} onChange={(e) => setSexo(e.target.value)}>
                  <option value="ALL">Todos</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Ordenar</label>
                <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="NAME_ASC">Nombre (A → Z)</option>
                  <option value="NAME_DESC">Nombre (Z → A)</option>
                  <option value="BIRTH_ASC">Nacimiento (más antiguo)</option>
                  <option value="BIRTH_DESC">Nacimiento (más reciente)</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <div className="text-muted small">
                Total: <strong>{filtered.length}</strong> / {children.length}
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => { setQuery(""); setSexo("ALL"); setSort("NAME_ASC"); }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Cards */}
        <div className="row g-3">
          {filtered.map((c) => {
            const ageM = calcAgeMonths(c.fecha_nacimiento);
            return (
              <div className="col-md-6" key={c.id}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between gap-2">
                      <div>
                        <div className="text-muted small">Paciente</div>
                        <div className="fw-bold" style={{ fontSize: 18 }}>
                          {c.nombres} {c.apellidos}
                        </div>
                        <div className="text-muted small mt-1">
                          Doc: <strong>{c.numero_documento}</strong> • Nacimiento: <strong>{fmtDate(c.fecha_nacimiento)}</strong>
                        </div>
                      </div>
                      <div className="text-end">
                        <SexPill sexo={c.sexo} />
                        <div className="text-muted small mt-2">
                          Edad aprox: <strong>{ageM != null ? `${ageM} m` : "—"}</strong>
                        </div>
                      </div>
                    </div>

                    <hr />

                    <div className="d-flex gap-2 flex-wrap">
                      <button className="btn btn-primary btn-sm" onClick={() => goNext(c.id)}>
                        <i className="bi bi-calendar2-check me-1" />
                        Próximas
                      </button>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => goHistory(c.id)}>
                        <i className="bi bi-clock-history me-1" />
                        Historial
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
                        <i className="bi bi-printer me-1" />
                        Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && filtered.length === 0 && !error && (
            <div className="col-12">
              <EmptyState text="No tienes niños asociados o los filtros no encontraron resultados." />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
