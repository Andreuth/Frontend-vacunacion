import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

/* ===================== Helpers ===================== */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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
    // ajuste por día del mes
    if (now.getDate() < b.getDate()) months -= 1;
    return Math.max(0, months);
  } catch {
    return null;
  }
}

function Alert({ type = "info", children }) {
  return <div className={`alert alert-${type} py-2 mb-3`}>{children}</div>;
}

function Pill({ children, tone = "secondary" }) {
  return <span className={`badge text-bg-${tone} rounded-pill`}>{children}</span>;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(String(text));
    return true;
  } catch {
    return false;
  }
}

/* ===================== UI Blocks ===================== */
function HeaderClinic({ title, subtitle, right }) {
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div className="text-muted small">Subcentro / Pediatría</div>
          <h4 className="mb-1">{title}</h4>
          {subtitle && <div className="text-muted">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

function CardClinic({ title, icon, children, right }) {
  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: 38, height: 38, background: "#f1f5ff" }}
            >
              <i className={`bi ${icon}`} style={{ fontSize: 18, color: "#0d6efd" }} />
            </div>
            <div>
              <div className="fw-bold">{title}</div>
              <div className="text-muted small">Panel clínico — SISCONI</div>
            </div>
          </div>
          {right}
        </div>
        <hr className="my-3" />
        {children}
      </div>
    </div>
  );
}

/* ===================== Component ===================== */
export default function PediatricDashboard() {
  // ===== Data =====
  const [children, setChildren] = useState([]);
  const [scheduleFull, setScheduleFull] = useState([]);

  // ===== UX =====
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // ===== Registro rápido =====
  const [reg, setReg] = useState({
    representante: { nombres: "", apellidos: "", numero_documento: "", password: "" },
    nino: { nombres: "", apellidos: "", numero_documento: "", fecha_nacimiento: "", sexo: "M" },
    parentesco: "madre",
    es_principal: true,
  });
  const [regMsg, setRegMsg] = useState("");

  // ===== Visita =====
  const [visitForm, setVisitForm] = useState({
    child_id: "",
    fecha_atencion: "",
    peso_kg: "",
    talla_cm: "",
    observaciones: "",
  });
  const [visitMsg, setVisitMsg] = useState("");

  // ===== Aplicación =====
  const [applyForm, setApplyForm] = useState({
    visit_id: "",
    schedule_id: "",
    fecha_aplicacion: "",
    lote: "",
    proxima_fecha: "",
  });
  const [applyMsg, setApplyMsg] = useState("");

  // ===== Filtros =====
  const [childQuery, setChildQuery] = useState("");
  const [sexoFilter, setSexoFilter] = useState("ALL"); // ALL|M|F|OTRO

  const [doseQuery, setDoseQuery] = useState("");

  const notify = (type, text) => {
    setMsg({ type, text });
    if (text) {
      window.clearTimeout(notify._t);
      notify._t = window.setTimeout(() => setMsg({ type: "", text: "" }), 4500);
    }
  };

  // ===== Load =====
  const load = async () => {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const [c, s] = await Promise.all([
        api.get("/children/"),
        api.get("/vaccines/schedule/full"),
      ]);
      setChildren(c.data || []);
      setScheduleFull(s.data || []);
    } catch (e) {
      console.log(e);
      notify("danger", e?.response?.data?.detail || "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ===== Derived selected child =====
  const selectedChild = useMemo(() => {
    const id = Number(visitForm.child_id || 0);
    return children.find((c) => c.id === id) || null;
  }, [children, visitForm.child_id]);

  const selectedChildAgeMonths = useMemo(() => {
    if (!selectedChild?.fecha_nacimiento) return null;
    return calcAgeMonths(selectedChild.fecha_nacimiento);
  }, [selectedChild]);

  // auto sugerencias al escoger niño
  useEffect(() => {
    if (!visitForm.child_id) return;
    setVisitForm((p) => ({ ...p, fecha_atencion: p.fecha_atencion || todayISO() }));
  }, [visitForm.child_id]);

  // ===== Filters: children =====
  const filteredChildren = useMemo(() => {
    let list = children;
    if (sexoFilter !== "ALL") list = list.filter((c) => c.sexo === sexoFilter);

    const q = childQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const s = `${c.nombres} ${c.apellidos} ${c.numero_documento} ${c.sexo} ${c.fecha_nacimiento}`.toLowerCase();
        return s.includes(q);
      });
    }

    // ordenar por apellidos/nombres
    return [...list].sort((a, b) => {
      const aa = `${a.apellidos || ""} ${a.nombres || ""}`.toLowerCase();
      const bb = `${b.apellidos || ""} ${b.nombres || ""}`.toLowerCase();
      return aa.localeCompare(bb, "es", { sensitivity: "base" });
    });
  }, [children, childQuery, sexoFilter]);

  // ===== Filters: doses =====
  const filteredDoses = useMemo(() => {
    const q = doseQuery.trim().toLowerCase();
    if (!q) return scheduleFull;
    return scheduleFull.filter((s) => {
      const str = `${s.vaccine_nombre} dosis ${s.dosis_numero} ${s.edad_objetivo_meses} meses ${s.schedule_id}`.toLowerCase();
      return str.includes(q);
    });
  }, [scheduleFull, doseQuery]);

  /* ===================== Actions ===================== */
  const registerChild = async (e) => {
    e.preventDefault();
    setRegMsg("");
    try {
      const res = await api.post("/children/register/", reg);
      setRegMsg(`✅ Registrado: representante_id=${res.data.representante_id}, nino_id=${res.data.nino_id}`);
      notify("success", "Registro rápido completado.");
      setReg({
        representante: { nombres: "", apellidos: "", numero_documento: "", password: "" },
        nino: { nombres: "", apellidos: "", numero_documento: "", fecha_nacimiento: "", sexo: "M" },
        parentesco: "madre",
        es_principal: true,
      });
      await load();
    } catch (e2) {
      const m = e2?.response?.data?.detail || "Error en registro rápido";
      setRegMsg(m);
      notify("danger", m);
    }
  };

  const createVisit = async (e) => {
    e.preventDefault();
    setVisitMsg("");
    try {
      const payload = {
        ...visitForm,
        child_id: Number(visitForm.child_id),
        peso_kg: Number(visitForm.peso_kg),
        talla_cm: Number(visitForm.talla_cm),
      };
      const res = await api.post("/visits/", payload);
      setVisitMsg(`✅ Visita creada. ID=${res.data.id}`);
      notify("success", `Visita creada (ID ${res.data.id}).`);

      // setea automáticamente el visit_id para aplicar vacuna
      setApplyForm((p) => ({
        ...p,
        visit_id: String(res.data.id),
        fecha_aplicacion: p.fecha_aplicacion || todayISO(),
      }));
    } catch (e2) {
      const m = e2?.response?.data?.detail || "Error creando visita";
      setVisitMsg(m);
      notify("danger", m);
    }
  };

  const applyVaccine = async (e) => {
    e.preventDefault();
    setApplyMsg("");
    try {
      const payload = {
        schedule_id: Number(applyForm.schedule_id),
        fecha_aplicacion: applyForm.fecha_aplicacion,
        lote: applyForm.lote || null,
        proxima_fecha: applyForm.proxima_fecha || null,
      };
      const res = await api.post(`/visits/${applyForm.visit_id}/apply`, payload);
      setApplyMsg(`✅ Vacuna aplicada. ID=${res.data.id}`);
      notify("success", "Vacuna aplicada correctamente.");
    } catch (e2) {
      const m = e2?.response?.data?.detail || "Error aplicando vacuna";
      setApplyMsg(m);
      notify("danger", m);
    }
  };

  /* ===================== UI ===================== */
  return (
    <>
      <Navbar />
      {/* Importa bootstrap-icons en tu app (ya lo hiciste en Login) */}
      <div className="container py-4">
        <HeaderClinic
          title="Panel de Pediatría"
          subtitle="Registro rápido, control de visita y aplicación de vacunas."
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

        {msg.text && <Alert type={msg.type}>{msg.text}</Alert>}

        {/* Resumen clínico del niño seleccionado */}
        <div className="card border-0 shadow-sm mb-4" style={{ background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 60%)" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between gap-2 flex-wrap">
              <div>
                <div className="text-muted small">Paciente seleccionado</div>
                <div className="fw-bold">
                  {selectedChild ? (
                    <>
                      {selectedChild.nombres} {selectedChild.apellidos}{" "}
                      <span className="text-muted fw-normal">• Doc: {selectedChild.numero_documento}</span>
                    </>
                  ) : (
                    <span className="text-muted">Selecciona un niño en “Crear visita”.</span>
                  )}
                </div>
                <div className="mt-1 d-flex gap-2 flex-wrap">
                  <Pill tone="primary">{selectedChild?.sexo || "—"}</Pill>
                  <Pill tone="secondary">Nacimiento: {selectedChild?.fecha_nacimiento ? fmtDate(selectedChild.fecha_nacimiento) : "—"}</Pill>
                  <Pill tone="success">Edad aprox: {selectedChildAgeMonths != null ? `${selectedChildAgeMonths} meses` : "—"}</Pill>
                </div>
              </div>

              <div className="text-end">
                <div className="text-muted small">Esquema cargado</div>
                <div className="fw-bold" style={{ fontSize: 20 }}>
                  {scheduleFull.length} <span className="text-muted fw-normal">dosis</span>
                </div>
                <div className="text-muted small">{children.length} niños registrados</div>
              </div>
            </div>
          </div>
        </div>

        {/* 1) Registro rápido */}
        <CardClinic
          title="Registro rápido"
          icon="bi-person-plus"
          right={<span className="text-muted small">Representante + Niño</span>}
        >
          {regMsg && <Alert type="info">{regMsg}</Alert>}

          <form className="row g-2" onSubmit={registerChild}>
            <div className="col-12 text-muted small">Datos del representante</div>

            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Nombres"
                value={reg.representante.nombres}
                onChange={(e) =>
                  setReg({ ...reg, representante: { ...reg.representante, nombres: e.target.value } })
                }
                required
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Apellidos"
                value={reg.representante.apellidos}
                onChange={(e) =>
                  setReg({ ...reg, representante: { ...reg.representante, apellidos: e.target.value } })
                }
                required
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Documento"
                value={reg.representante.numero_documento}
                onChange={(e) =>
                  setReg({ ...reg, representante: { ...reg.representante, numero_documento: e.target.value } })
                }
                required
              />
            </div>
            <div className="col-md-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={reg.representante.password}
                onChange={(e) =>
                  setReg({ ...reg, representante: { ...reg.representante, password: e.target.value } })
                }
                required
              />
            </div>

            <div className="col-12 mt-2 text-muted small">Datos del niño</div>

            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Nombres"
                value={reg.nino.nombres}
                onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, nombres: e.target.value } })}
                required
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Apellidos"
                value={reg.nino.apellidos}
                onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, apellidos: e.target.value } })}
                required
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Documento"
                value={reg.nino.numero_documento}
                onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, numero_documento: e.target.value } })}
                required
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={reg.nino.fecha_nacimiento}
                onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, fecha_nacimiento: e.target.value } })}
                required
              />
            </div>
            <div className="col-md-1">
              <select
                className="form-select"
                value={reg.nino.sexo}
                onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, sexo: e.target.value } })}
              >
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>

            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Parentesco (madre/padre/tutor)"
                value={reg.parentesco}
                onChange={(e) => setReg({ ...reg, parentesco: e.target.value })}
                required
              />
            </div>

            <div className="col-12 d-flex gap-2">
              <button className="btn btn-primary btn-sm" disabled={loading}>
                Registrar
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() =>
                  setReg({
                    representante: { nombres: "", apellidos: "", numero_documento: "", password: "" },
                    nino: { nombres: "", apellidos: "", numero_documento: "", fecha_nacimiento: "", sexo: "M" },
                    parentesco: "madre",
                    es_principal: true,
                  })
                }
              >
                Limpiar
              </button>
            </div>
          </form>
        </CardClinic>

        {/* 2) Crear visita */}
        <CardClinic
          title="Crear visita"
          icon="bi-clipboard2-pulse"
          right={
            <div className="d-flex gap-2 flex-wrap">
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 220 }}
                placeholder="Buscar niño..."
                value={childQuery}
                onChange={(e) => setChildQuery(e.target.value)}
              />
              <select
                className="form-select form-select-sm"
                style={{ width: 140 }}
                value={sexoFilter}
                onChange={(e) => setSexoFilter(e.target.value)}
              >
                <option value="ALL">Sexo: todos</option>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="OTRO">OTRO</option>
              </select>
            </div>
          }
        >
          {visitMsg && <Alert type="info">{visitMsg}</Alert>}

          <form className="row g-2" onSubmit={createVisit}>
            <div className="col-md-5">
              <label className="form-label small text-muted mb-1">Seleccione niño</label>
              <select
                className="form-select"
                value={visitForm.child_id}
                onChange={(e) => setVisitForm({ ...visitForm, child_id: e.target.value })}
                required
              >
                <option value="">Seleccione...</option>
                {filteredChildren.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.apellidos} {c.nombres} — {c.numero_documento} — {c.sexo}
                  </option>
                ))}
              </select>
              <div className="text-muted small mt-1">
                Tip: escribe en “Buscar niño…” para encontrar más rápido.
              </div>
            </div>

            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Fecha atención</label>
              <input
                type="date"
                className="form-control"
                value={visitForm.fecha_atencion}
                onChange={(e) => setVisitForm({ ...visitForm, fecha_atencion: e.target.value })}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mt-2 w-100"
                onClick={() => setVisitForm((p) => ({ ...p, fecha_atencion: todayISO() }))}
              >
                Hoy
              </button>
            </div>

            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Peso (kg)</label>
              <input
                className="form-control"
                placeholder="Ej: 12.5"
                value={visitForm.peso_kg}
                onChange={(e) => setVisitForm({ ...visitForm, peso_kg: e.target.value })}
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Talla (cm)</label>
              <input
                className="form-control"
                placeholder="Ej: 85"
                value={visitForm.talla_cm}
                onChange={(e) => setVisitForm({ ...visitForm, talla_cm: e.target.value })}
                required
              />
            </div>

            <div className="col-md-1 d-grid">
              <label className="form-label small text-muted mb-1">&nbsp;</label>
              <button className="btn btn-success" disabled={loading}>
                <i className="bi bi-check2-circle me-1" />
                Crear
              </button>
            </div>

            <div className="col-12">
              <label className="form-label small text-muted mb-1">Observaciones</label>
              <input
                className="form-control"
                placeholder="Ej: fiebre, tos, dolor abdominal..."
                value={visitForm.observaciones}
                onChange={(e) => setVisitForm({ ...visitForm, observaciones: e.target.value })}
              />
            </div>
          </form>

          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <div className="text-muted small">
              Cuando creas la visita, el sistema coloca el <strong>Visit ID</strong> automáticamente para aplicar vacuna.
            </div>
            <button
              className="btn btn-outline-dark btn-sm"
              type="button"
              onClick={async () => {
                const id = applyForm.visit_id;
                if (!id) return notify("info", "Aún no hay Visit ID para copiar.");
                const ok = await copyText(id);
                notify(ok ? "success" : "danger", ok ? "Visit ID copiado ✅" : "No se pudo copiar");
              }}
            >
              Copiar Visit ID
            </button>
          </div>
        </CardClinic>

        {/* 3) Aplicar vacuna */}
        <CardClinic
          title="Aplicar vacuna"
          icon="bi-droplet-half"
          right={
            <div className="d-flex gap-2 flex-wrap">
              <input
                className="form-control form-control-sm"
                style={{ maxWidth: 240 }}
                placeholder="Buscar dosis (vacuna/dosis/meses)..."
                value={doseQuery}
                onChange={(e) => setDoseQuery(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                onClick={() => setApplyForm((p) => ({ ...p, fecha_aplicacion: p.fecha_aplicacion || todayISO() }))}
              >
                Fecha hoy
              </button>
            </div>
          }
        >
          {applyMsg && <Alert type="info">{applyMsg}</Alert>}

          <form className="row g-2" onSubmit={applyVaccine}>
            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Visit ID</label>
              <input
                className="form-control"
                placeholder="Ej: 12"
                value={applyForm.visit_id}
                onChange={(e) => setApplyForm({ ...applyForm, visit_id: e.target.value })}
                required
              />
            </div>

            <div className="col-md-5">
              <label className="form-label small text-muted mb-1">Dosis (esquema)</label>
              <select
                className="form-select"
                value={applyForm.schedule_id}
                onChange={(e) => setApplyForm({ ...applyForm, schedule_id: e.target.value })}
                required
              >
                <option value="">Seleccione...</option>
                {filteredDoses.map((s) => (
                  <option key={s.schedule_id} value={s.schedule_id}>
                    {s.vaccine_nombre} — Dosis {s.dosis_numero} — {s.edad_objetivo_meses} meses
                  </option>
                ))}
              </select>
              <div className="text-muted small mt-1">
                Tip: usa el buscador para encontrar rápido (ej: “pentavalente dosis 2”).
              </div>
            </div>

            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Fecha aplicación</label>
              <input
                type="date"
                className="form-control"
                value={applyForm.fecha_aplicacion}
                onChange={(e) => setApplyForm({ ...applyForm, fecha_aplicacion: e.target.value })}
                required
              />
            </div>

            <div className="col-md-1">
              <label className="form-label small text-muted mb-1">Lote</label>
              <input
                className="form-control"
                placeholder="Opc."
                value={applyForm.lote}
                onChange={(e) => setApplyForm({ ...applyForm, lote: e.target.value })}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small text-muted mb-1">Próxima fecha</label>
              <input
                type="date"
                className="form-control"
                value={applyForm.proxima_fecha}
                onChange={(e) => setApplyForm({ ...applyForm, proxima_fecha: e.target.value })}
              />
            </div>

            <div className="col-12 d-flex gap-2">
              <button className="btn btn-primary" disabled={loading}>
                <i className="bi bi-syringe me-1" />
                Registrar aplicación
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setApplyForm({ visit_id: applyForm.visit_id, schedule_id: "", fecha_aplicacion: todayISO(), lote: "", proxima_fecha: "" })
                }
              >
                Limpiar dosis
              </button>
            </div>
          </form>

          <div className="mt-3 text-muted small">
            <strong>Tip clínico:</strong> Puedes registrar observaciones en la visita y lote en la aplicación para auditoría.
          </div>
        </CardClinic>
      </div>
    </>
  );
}
