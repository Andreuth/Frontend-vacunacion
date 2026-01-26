import { useEffect, useMemo, useState } from "react";
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

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function StepCard({ step, title, subtitle, children }) {
  return (
    <div className="border rounded-3 p-3 mb-3 bg-white shadow-sm">
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div>
          <div className="badge text-bg-primary">{step}</div>
          <h5 className="mt-2 mb-1">{title}</h5>
          {subtitle && <div className="text-muted small">{subtitle}</div>}
        </div>
      </div>
      <hr className="my-3" />
      {children}
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="border rounded-3 p-3 mb-3 bg-light">
      <div className="fw-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

export default function PediatricDashboard() {
  // UI
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" }); // success|info|danger

  // Registro rápido
  const [reg, setReg] = useState({
    representante: { nombres: "", apellidos: "", numero_documento: "", password: "" },
    nino: { nombres: "", apellidos: "", numero_documento: "", fecha_nacimiento: "", sexo: "M" },
    parentesco: "madre",
    es_principal: true,
  });
  const [regMsg, setRegMsg] = useState("");

  // Para visita y aplicación
  const [children, setChildren] = useState([]);
  const [scheduleFull, setScheduleFull] = useState([]);

  const [visitMsg, setVisitMsg] = useState("");
  const [applyMsg, setApplyMsg] = useState("");

  const [childQuery, setChildQuery] = useState("");
  const [doseQuery, setDoseQuery] = useState("");

  const [visitForm, setVisitForm] = useState({
    child_id: "",
    fecha_atencion: "",
    peso_kg: "",
    talla_cm: "",
    observaciones: "",
  });

  const [applyForm, setApplyForm] = useState({
    visit_id: "",
    schedule_id: "",
    fecha_aplicacion: "",
    lote: "",
    proxima_fecha: "",
  });

  const notify = (type, text) => {
    setToast({ type, text });
    if (text) {
      window.clearTimeout(notify._t);
      notify._t = window.setTimeout(() => setToast({ type: "", text: "" }), 4500);
    }
  };

  // ==========================
  // Cargar niños + esquema FULL
  // ==========================
  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        api.get("/children/"),
        api.get("/vaccines/schedule/full"),
      ]);
      setChildren(c.data || []);
      setScheduleFull(s.data || []);
    } catch (e) {
      console.log(e);
      notify("danger", e?.response?.data?.detail || "No se pudo cargar niños/esquema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ==========================
  // Filtros (más funcionalidad)
  // ==========================
  const filteredChildren = useMemo(() => {
    const q = childQuery.trim().toLowerCase();
    if (!q) return children;
    return children.filter((c) =>
      `${c.nombres} ${c.apellidos} ${c.numero_documento}`.toLowerCase().includes(q)
    );
  }, [children, childQuery]);

  const filteredDoses = useMemo(() => {
    const q = doseQuery.trim().toLowerCase();
    if (!q) return scheduleFull;
    return scheduleFull.filter((s) =>
      `${s.vaccine_nombre} ${s.dosis_numero} ${s.edad_objetivo_meses} ${s.schedule_id}`.toLowerCase().includes(q)
    );
  }, [scheduleFull, doseQuery]);

  // ==========================
  // Registro rápido
  // ==========================
  const registerChild = async (e) => {
    e.preventDefault();
    setRegMsg("");
    try {
      const res = await api.post("/children/register/", reg);
      const msg = `✅ Registrado: representante_id=${res.data.representante_id}, nino_id=${res.data.nino_id}`;
      setRegMsg(msg);
      notify("success", "Registro rápido completado.");
      await load();
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error en registro rápido";
      setRegMsg(msg);
      notify("danger", msg);
    }
  };

  const clearRegister = () => {
    setReg({
      representante: { nombres: "", apellidos: "", numero_documento: "", password: "" },
      nino: { nombres: "", apellidos: "", numero_documento: "", fecha_nacimiento: "", sexo: "M" },
      parentesco: "madre",
      es_principal: true,
    });
    setRegMsg("");
  };

  // ==========================
  // Crear visita
  // ==========================
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
      const msg = `✅ Visita creada. ID=${res.data.id}`;
      setVisitMsg(msg);
      notify("success", `Visita creada (ID ${res.data.id}).`);

      // UX pro: autocompletar para aplicar vacuna
      setApplyForm((prev) => ({
        ...prev,
        visit_id: String(res.data.id),
        fecha_aplicacion: prev.fecha_aplicacion || todayISO(),
      }));
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando visita";
      setVisitMsg(msg);
      notify("danger", msg);
    }
  };

  const clearVisit = () => {
    setVisitForm({ child_id: "", fecha_atencion: "", peso_kg: "", talla_cm: "", observaciones: "" });
    setVisitMsg("");
  };

  // ==========================
  // Aplicar vacuna
  // ==========================
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
      const msg = `✅ Vacuna aplicada. ID=${res.data.id}`;
      setApplyMsg(msg);
      notify("success", "Vacuna aplicada correctamente.");
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error aplicando vacuna";
      setApplyMsg(msg);
      notify("danger", msg);
    }
  };

  const clearApply = () => {
    setApplyForm({ visit_id: "", schedule_id: "", fecha_aplicacion: "", lote: "", proxima_fecha: "" });
    setApplyMsg("");
  };

  const selectedChild = useMemo(() => {
    const id = Number(visitForm.child_id || 0);
    return children.find((c) => c.id === id);
  }, [children, visitForm.child_id]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        {/* Header distinto al Admin */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h4 className="mb-0">Panel Pediatría</h4>
            <div className="text-muted small">
              Flujo clínico rápido: registrar → crear visita → aplicar vacuna.
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
              {loading ? "Cargando..." : "Refrescar datos"}
            </button>
          </div>
        </div>

        {toast.text && (
          <div className={`alert alert-${toast.type} py-2`} role="alert">
            {toast.text}
          </div>
        )}

        {/* Layout diferente: 2 columnas */}
        <div className="row g-3">
          {/* Col izquierda: workflow */}
          <div className="col-lg-8">
            {/* STEP 1 */}
            <StepCard
              step="Paso 1"
              title="Registro rápido"
              subtitle="Crear Representante + Niño para iniciar el control de vacunación."
            >
              {regMsg && <div className="alert alert-info py-2">{regMsg}</div>}

              <form className="row g-2" onSubmit={registerChild}>
                <div className="col-12"><span className="badge text-bg-light border">Representante</span></div>

                <div className="col-md-3">
                  <input className="form-control" placeholder="Nombres"
                    value={reg.representante.nombres}
                    onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, nombres: e.target.value } })}
                    required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Apellidos"
                    value={reg.representante.apellidos}
                    onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, apellidos: e.target.value } })}
                    required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Documento"
                    value={reg.representante.numero_documento}
                    onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, numero_documento: e.target.value } })}
                    required />
                </div>
                <div className="col-md-3">
                  <input type="password" className="form-control" placeholder="Password"
                    value={reg.representante.password}
                    onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, password: e.target.value } })}
                    required />
                </div>

                <div className="col-12 mt-2"><span className="badge text-bg-light border">Niño</span></div>

                <div className="col-md-3">
                  <input className="form-control" placeholder="Nombres"
                    value={reg.nino.nombres}
                    onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, nombres: e.target.value } })}
                    required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Apellidos"
                    value={reg.nino.apellidos}
                    onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, apellidos: e.target.value } })}
                    required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Documento"
                    value={reg.nino.numero_documento}
                    onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, numero_documento: e.target.value } })}
                    required />
                </div>
                <div className="col-md-2">
                  <input type="date" className="form-control"
                    value={reg.nino.fecha_nacimiento}
                    onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, fecha_nacimiento: e.target.value } })}
                    required />
                </div>
                <div className="col-md-1">
                  <select className="form-select"
                    value={reg.nino.sexo}
                    onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, sexo: e.target.value } })}
                  >
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <input className="form-control" placeholder="Parentesco (madre/padre/tutor)"
                    value={reg.parentesco}
                    onChange={(e) => setReg({ ...reg, parentesco: e.target.value })}
                    required />
                </div>

                <div className="col-12 d-flex gap-2 mt-2">
                  <button className="btn btn-primary btn-sm" disabled={loading}>
                    {loading ? "Procesando..." : "Registrar"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearRegister}>
                    Limpiar
                  </button>
                </div>
              </form>
            </StepCard>

            {/* STEP 2 */}
            <StepCard
              step="Paso 2"
              title="Crear visita"
              subtitle="Registra fecha, peso, talla y observaciones clínicas."
            >
              {visitMsg && <div className="alert alert-info py-2">{visitMsg}</div>}

              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <input
                    className="form-control"
                    placeholder="Buscar niño por nombre o documento..."
                    value={childQuery}
                    onChange={(e) => setChildQuery(e.target.value)}
                  />
                </div>
                <div className="col-md-6 text-md-end text-muted small d-flex align-items-center justify-content-md-end">
                  {selectedChild ? (
                    <span>
                      Seleccionado: <strong>{selectedChild.nombres} {selectedChild.apellidos}</strong> • Doc: {selectedChild.numero_documento}
                    </span>
                  ) : (
                    <span>Selecciona un niño para continuar</span>
                  )}
                </div>
              </div>

              <form className="row g-2" onSubmit={createVisit}>
                <div className="col-md-5">
                  <select className="form-select" value={visitForm.child_id}
                    onChange={(e) => setVisitForm({ ...visitForm, child_id: e.target.value })} required>
                    <option value="">Seleccione niño...</option>
                    {filteredChildren.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} - {c.numero_documento}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <input type="date" className="form-control" value={visitForm.fecha_atencion}
                    onChange={(e) => setVisitForm({ ...visitForm, fecha_atencion: e.target.value })} required />
                </div>

                <div className="col-md-2">
                  <input className="form-control" placeholder="Peso (kg)" value={visitForm.peso_kg}
                    onChange={(e) => setVisitForm({ ...visitForm, peso_kg: e.target.value })} required />
                </div>

                <div className="col-md-2">
                  <input className="form-control" placeholder="Talla (cm)" value={visitForm.talla_cm}
                    onChange={(e) => setVisitForm({ ...visitForm, talla_cm: e.target.value })} required />
                </div>

                <div className="col-12">
                  <input className="form-control" placeholder="Observaciones"
                    value={visitForm.observaciones}
                    onChange={(e) => setVisitForm({ ...visitForm, observaciones: e.target.value })} />
                </div>

                <div className="col-12 d-flex gap-2 mt-2">
                  <button className="btn btn-success btn-sm" disabled={loading}>
                    {loading ? "Procesando..." : "Crear visita"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearVisit}>
                    Limpiar
                  </button>
                </div>
              </form>
            </StepCard>

            {/* STEP 3 */}
            <StepCard
              step="Paso 3"
              title="Aplicar vacuna"
              subtitle="Selecciona la dosis del esquema y registra la aplicación."
            >
              {applyMsg && <div className="alert alert-info py-2">{applyMsg}</div>}

              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <input
                    className="form-control"
                    placeholder="Buscar dosis por vacuna, número o edad..."
                    value={doseQuery}
                    onChange={(e) => setDoseQuery(e.target.value)}
                  />
                </div>
                <div className="col-md-6 text-md-end text-muted small d-flex align-items-center justify-content-md-end">
                  <span>
                    Consejo: Fecha por defecto hoy ({fmtDate(todayISO())}) si creas visita primero
                  </span>
                </div>
              </div>

              <form className="row g-2" onSubmit={applyVaccine}>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Visit ID"
                    value={applyForm.visit_id}
                    onChange={(e) => setApplyForm({ ...applyForm, visit_id: e.target.value })}
                    required />
                </div>

                <div className="col-md-5">
                  <select className="form-select"
                    value={applyForm.schedule_id}
                    onChange={(e) => setApplyForm({ ...applyForm, schedule_id: e.target.value })}
                    required
                  >
                    <option value="">Seleccione dosis...</option>
                    {filteredDoses.map((s) => (
                      <option key={s.schedule_id} value={s.schedule_id}>
                        {s.vaccine_nombre} — Dosis {s.dosis_numero} — {s.edad_objetivo_meses} meses
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <input type="date" className="form-control"
                    value={applyForm.fecha_aplicacion}
                    onChange={(e) => setApplyForm({ ...applyForm, fecha_aplicacion: e.target.value })}
                    required />
                </div>

                <div className="col-md-1">
                  <input className="form-control" placeholder="Lote"
                    value={applyForm.lote}
                    onChange={(e) => setApplyForm({ ...applyForm, lote: e.target.value })} />
                </div>

                <div className="col-md-2">
                  <input type="date" className="form-control"
                    value={applyForm.proxima_fecha}
                    onChange={(e) => setApplyForm({ ...applyForm, proxima_fecha: e.target.value })} />
                </div>

                <div className="col-12 d-flex gap-2 mt-2">
                  <button className="btn btn-primary btn-sm" disabled={loading}>
                    {loading ? "Procesando..." : "Aplicar vacuna"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearApply}>
                    Limpiar
                  </button>
                </div>
              </form>
            </StepCard>
          </div>

          {/* Col derecha: ayuda / resumen */}
          <div className="col-lg-4">
            <InfoCard title="Checklist rápido">
              <ul className="small mb-0">
                <li>Verificar identificación del niño y representante.</li>
                <li>Registrar signos antropométricos (peso/talla).</li>
                <li>Seleccionar dosis correcta según edad (meses).</li>
                <li>Registrar lote y próxima fecha si aplica.</li>
                <li>Confirmar registro exitoso al finalizar.</li>
              </ul>
            </InfoCard>

            <InfoCard title="Resumen del sistema">
              <div className="small text-muted">
                <div className="d-flex justify-content-between">
                  <span>Niños cargados</span>
                  <span className="fw-semibold">{children.length}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Dosis disponibles</span>
                  <span className="fw-semibold">{scheduleFull.length}</span>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Atajos útiles">
              <div className="small">
                <div className="mb-2">
                  <span className="fw-semibold">1)</span> Registra y vuelve a refrescar si no aparece el niño.
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">2)</span> Crea la visita primero para autollenar el <span className="badge text-bg-light border">Visit ID</span>.
                </div>
                <div>
                  <span className="fw-semibold">3)</span> Usa búsqueda en dosis para encontrar rápido la vacuna.
                </div>
              </div>
            </InfoCard>

            <div className="text-muted small">
              Última actualización: <strong>{fmtDate(todayISO())}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
