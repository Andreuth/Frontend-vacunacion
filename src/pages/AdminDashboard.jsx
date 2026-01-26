import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

function fmtDate(iso) {
  if (!iso) return "-";
  // iso puede venir "2026-01-10"
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

function BadgeEstado({ estado }) {
  const isLate = estado === "ATRASADA";
  const cls = isLate ? "text-bg-danger" : "text-bg-success";
  return <span className={`badge ${cls}`}>{estado}</span>;
}

function Section({ title, subtitle, children, right }) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
          <div>
            <h5 className="mb-0">{title}</h5>
            {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
          </div>
          {right}
        </div>
        <hr className="my-3" />
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="col-md-3 col-sm-6">
      <div className="border rounded-3 p-3 h-100 bg-white">
        <div className="text-muted small">{label}</div>
        <div className="fs-4 fw-semibold">{value}</div>
        {hint && <div className="text-muted small mt-1">{hint}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("ADMIN"); // ADMIN | PEDIATRA | REPRESENTANTE

  // Global UI state
  const [loading, setLoading] = useState(false);
  const [globalMsg, setGlobalMsg] = useState({ type: "", text: "" }); // type: success|info|danger

  // ===== ADMIN: USERS =====
  const [users, setUsers] = useState([]);
  const [uForm, setUForm] = useState({
    nombres: "",
    apellidos: "",
    numero_documento: "",
    rol: "REPRESENTANTE",
    password: "",
  });
  const [uMsg, setUMsg] = useState("");
  const [userQuery, setUserQuery] = useState("");

  // ===== ADMIN: VACCINES + SCHEDULE =====
  const [vaccines, setVaccines] = useState([]);
  const [vForm, setVForm] = useState({ nombre: "", descripcion: "" });
  const [vMsg, setVMsg] = useState("");
  const [vaccineQuery, setVaccineQuery] = useState("");

  const [scheduleFull, setScheduleFull] = useState([]);
  const [sForm, setSForm] = useState({
    vaccine_id: "",
    dosis_numero: 1,
    edad_objetivo_meses: 0,
    intervalo_min_dias: "",
  });
  const [sMsg, setSMsg] = useState("");
  const [scheduleQuery, setScheduleQuery] = useState("");

  // ===== PEDIATRA: registro + visita + aplicar =====
  const [children, setChildren] = useState([]);
  const [reg, setReg] = useState({
    representante: { nombres: "", apellidos: "", numero_documento: "", password: "" },
    nino: { nombres: "", apellidos: "", numero_documento: "", fecha_nacimiento: "", sexo: "M" },
    parentesco: "madre",
    es_principal: true,
  });
  const [regMsg, setRegMsg] = useState("");

  const [visitForm, setVisitForm] = useState({
    child_id: "",
    fecha_atencion: "",
    peso_kg: "",
    talla_cm: "",
    observaciones: "",
  });
  const [visitMsg, setVisitMsg] = useState("");

  const [applyForm, setApplyForm] = useState({
    visit_id: "",
    schedule_id: "",
    fecha_aplicacion: "",
    lote: "",
    proxima_fecha: "",
  });
  const [applyMsg, setApplyMsg] = useState("");

  // ===== REPRESENTANTE: historial + próximas =====
  const [selectedChildId, setSelectedChildId] = useState("");
  const [history, setHistory] = useState([]);
  const [nextItems, setNextItems] = useState([]);
  const [repMsg, setRepMsg] = useState("");

  const notify = (type, text) => {
    setGlobalMsg({ type, text });
    if (text) {
      window.clearTimeout(notify._t);
      notify._t = window.setTimeout(() => setGlobalMsg({ type: "", text: "" }), 4500);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setGlobalMsg({ type: "", text: "" });
    try {
      const [u, v, sch, c] = await Promise.all([
        api.get("/users"),
        api.get("/vaccines"),
        api.get("/vaccines/schedule/full"),
        api.get("/children"),
      ]);
      setUsers(u.data || []);
      setVaccines(v.data || []);
      setScheduleFull(sch.data || []);
      setChildren(c.data || []);
    } catch (e) {
      console.log(e);
      notify("danger", e?.response?.data?.detail || "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ====== Filters (more functionality) ======
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const s = `${u.id} ${u.numero_documento} ${u.nombres} ${u.apellidos} ${u.rol}`.toLowerCase();
      return s.includes(q);
    });
  }, [users, userQuery]);

  const filteredVaccines = useMemo(() => {
    const q = vaccineQuery.trim().toLowerCase();
    if (!q) return vaccines;
    return vaccines.filter((v) => {
      const s = `${v.id} ${v.nombre} ${v.descripcion || ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [vaccines, vaccineQuery]);

  const filteredSchedule = useMemo(() => {
    const q = scheduleQuery.trim().toLowerCase();
    if (!q) return scheduleFull;
    return scheduleFull.filter((s) => {
      const str = `${s.vaccine_nombre} ${s.dosis_numero} ${s.edad_objetivo_meses} ${s.intervalo_min_dias ?? ""} ${s.schedule_id}`.toLowerCase();
      return str.includes(q);
    });
  }, [scheduleFull, scheduleQuery]);

  // ===== ADMIN actions =====
  const createUser = async (e) => {
    e.preventDefault();
    setUMsg("");
    try {
      const res = await api.post("/users/", uForm);
      setUMsg("✅ Usuario creado");
      notify("success", "Usuario creado correctamente.");
      setUForm({ nombres: "", apellidos: "", numero_documento: "", rol: "REPRESENTANTE", password: "" });
      setUsers((prev) => [res.data, ...prev]);
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando usuario";
      setUMsg(msg);
      notify("danger", msg);
    }
  };

  const createVaccine = async (e) => {
    e.preventDefault();
    setVMsg("");
    try {
      const res = await api.post("/vaccines/", vForm);
      setVMsg("✅ Vacuna creada");
      notify("success", "Vacuna creada correctamente.");
      setVForm({ nombre: "", descripcion: "" });
      setVaccines((prev) => [res.data, ...prev]);
      await loadAll(); // para refrescar scheduleFull si depende
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando vacuna";
      setVMsg(msg);
      notify("danger", msg);
    }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    setSMsg("");
    try {
      const payload = {
        vaccine_id: Number(sForm.vaccine_id),
        dosis_numero: Number(sForm.dosis_numero),
        edad_objetivo_meses: Number(sForm.edad_objetivo_meses),
        intervalo_min_dias: sForm.intervalo_min_dias === "" ? null : Number(sForm.intervalo_min_dias),
      };
      await api.post("/vaccines/schedule/", payload);
      setSMsg("✅ Dosis agregada al esquema");
      notify("success", "Dosis agregada al esquema.");
      setSForm((p) => ({ ...p, dosis_numero: 1, edad_objetivo_meses: 0, intervalo_min_dias: "" }));
      await loadAll();
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando esquema";
      setSMsg(msg);
      notify("danger", msg);
    }
  };

  // ===== PEDIATRA actions =====
  const registerChild = async (e) => {
    e.preventDefault();
    setRegMsg("");
    try {
      const res = await api.post("/children/register/", reg);
      setRegMsg(`✅ Registrado: representante_id=${res.data.representante_id}, nino_id=${res.data.nino_id}`);
      notify("success", "Registro rápido completado.");
      await loadAll();
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error en registro rápido";
      setRegMsg(msg);
      notify("danger", msg);
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
      setApplyForm((p) => ({ ...p, visit_id: String(res.data.id) }));
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando visita";
      setVisitMsg(msg);
      notify("danger", msg);
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
      const msg = e2?.response?.data?.detail || "Error aplicando vacuna";
      setApplyMsg(msg);
      notify("danger", msg);
    }
  };

  // ===== REPRESENTANTE actions =====
  const loadHistoryAndNext = async () => {
    if (!selectedChildId) return;
    setRepMsg("");
    setLoading(true);
    try {
      const [h, n] = await Promise.all([
        api.get(`/visits/history/${selectedChildId}/full`),
        api.get(`/children/${selectedChildId}/next-vaccines`),
      ]);
      setHistory(h.data || []);
      setNextItems(n.data?.items || []);
      notify("info", "Información cargada.");
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error consultando historial/próximas";
      setRepMsg(msg);
      notify("danger", msg);
    } finally {
      setLoading(false);
    }
  };

  // ===== KPI counts (professional touch) =====
  const stats = useMemo(() => {
    return {
      users: users.length,
      vaccines: vaccines.length,
      schedule: scheduleFull.length,
      children: children.length,
    };
  }, [users, vaccines, scheduleFull, children]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h4 className="mb-0">Panel Administrativo</h4>
            <div className="text-muted small">Gestión de usuarios, vacunas, esquema, visitas e historial.</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={loadAll} disabled={loading}>
              {loading ? "Cargando..." : "Refrescar"}
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="row g-3 mb-3">
          <StatCard label="Usuarios" value={stats.users} hint="Total registrados" />
          <StatCard label="Niños" value={stats.children} hint="Pacientes pediátricos" />
          <StatCard label="Vacunas" value={stats.vaccines} hint="Catálogo" />
          <StatCard label="Dosis en esquema" value={stats.schedule} hint="Schedule completo" />
        </div>

        {globalMsg.text && (
          <div className={`alert alert-${globalMsg.type} py-2`} role="alert">
            {globalMsg.text}
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-pills mb-3 gap-2">
          <li className="nav-item">
            <button className={`nav-link ${tab === "ADMIN" ? "active" : ""}`} onClick={() => setTab("ADMIN")}>
              ADMIN
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "PEDIATRA" ? "active" : ""}`} onClick={() => setTab("PEDIATRA")}>
              PEDIATRA
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "REPRESENTANTE" ? "active" : ""}`} onClick={() => setTab("REPRESENTANTE")}>
              REPRESENTANTE
            </button>
          </li>
        </ul>

        {/* ====================== ADMIN TAB ====================== */}
        {tab === "ADMIN" && (
          <>
            <Section
              title="Usuarios"
              subtitle="Crear usuarios y consultar la lista (búsqueda incluida)."
              right={
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 280 }}
                  placeholder="Buscar usuario..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                />
              }
            >
              {uMsg && <div className="alert alert-info py-2">{uMsg}</div>}

              <form className="row g-2" onSubmit={createUser}>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Nombres" value={uForm.nombres}
                    onChange={(e) => setUForm({ ...uForm, nombres: e.target.value })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Apellidos" value={uForm.apellidos}
                    onChange={(e) => setUForm({ ...uForm, apellidos: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Documento" value={uForm.numero_documento}
                    onChange={(e) => setUForm({ ...uForm, numero_documento: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <select className="form-select" value={uForm.rol} onChange={(e) => setUForm({ ...uForm, rol: e.target.value })}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="PEDIATRA">PEDIATRA</option>
                    <option value="REPRESENTANTE">REPRESENTANTE</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <input type="password" className="form-control" placeholder="Password" value={uForm.password}
                    onChange={(e) => setUForm({ ...uForm, password: e.target.value })} required />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary btn-sm" disabled={loading}>Crear usuario</button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setUForm({ nombres: "", apellidos: "", numero_documento: "", rol: "REPRESENTANTE", password: "" })}
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              <div className="table-responsive mt-3">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr><th>ID</th><th>Documento</th><th>Nombres</th><th>Apellidos</th><th>Rol</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="text-muted">{u.id}</td>
                        <td className="fw-semibold">{u.numero_documento}</td>
                        <td>{u.nombres}</td>
                        <td>{u.apellidos}</td>
                        <td><span className="badge text-bg-light border">{u.rol}</span></td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="5" className="text-muted">Sin resultados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="Vacunas"
              subtitle="Catálogo de vacunas (con búsqueda)."
              right={
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 280 }}
                  placeholder="Buscar vacuna..."
                  value={vaccineQuery}
                  onChange={(e) => setVaccineQuery(e.target.value)}
                />
              }
            >
              {vMsg && <div className="alert alert-info py-2">{vMsg}</div>}

              <form className="row g-2" onSubmit={createVaccine}>
                <div className="col-md-4">
                  <input className="form-control" placeholder="Nombre" value={vForm.nombre}
                    onChange={(e) => setVForm({ ...vForm, nombre: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <input className="form-control" placeholder="Descripción" value={vForm.descripcion}
                    onChange={(e) => setVForm({ ...vForm, descripcion: e.target.value })} />
                </div>
                <div className="col-md-2 d-flex gap-2">
                  <button className="btn btn-success btn-sm w-100" disabled={loading}>Crear</button>
                </div>
              </form>

              <div className="table-responsive mt-3">
                <table className="table table-sm table-striped align-middle">
                  <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th></tr></thead>
                  <tbody>
                    {filteredVaccines.map((v) => (
                      <tr key={v.id}>
                        <td className="text-muted">{v.id}</td>
                        <td className="fw-semibold">{v.nombre}</td>
                        <td className="text-muted">{v.descripcion || "-"}</td>
                      </tr>
                    ))}
                    {filteredVaccines.length === 0 && (
                      <tr><td colSpan="3" className="text-muted">Sin resultados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="Esquema por dosis"
              subtitle="Agregar dosis al esquema y revisar el schedule completo (con búsqueda)."
              right={
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 280 }}
                  placeholder="Buscar en esquema..."
                  value={scheduleQuery}
                  onChange={(e) => setScheduleQuery(e.target.value)}
                />
              }
            >
              {sMsg && <div className="alert alert-info py-2">{sMsg}</div>}

              <form className="row g-2" onSubmit={createSchedule}>
                <div className="col-md-4">
                  <select className="form-select" value={sForm.vaccine_id}
                    onChange={(e) => setSForm({ ...sForm, vaccine_id: e.target.value })} required>
                    <option value="">Seleccione vacuna...</option>
                    {vaccines.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                  </select>
                </div>
                <div className="col-md-2">
                  <input className="form-control" type="number" min="1" placeholder="Dosis #"
                    value={sForm.dosis_numero}
                    onChange={(e) => setSForm({ ...sForm, dosis_numero: e.target.value })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" type="number" min="0" placeholder="Edad (meses)"
                    value={sForm.edad_objetivo_meses}
                    onChange={(e) => setSForm({ ...sForm, edad_objetivo_meses: e.target.value })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" type="number" min="0" placeholder="Intervalo (días) opcional"
                    value={sForm.intervalo_min_dias}
                    onChange={(e) => setSForm({ ...sForm, intervalo_min_dias: e.target.value })} />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary btn-sm" disabled={loading}>Agregar al esquema</button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSForm({ vaccine_id: "", dosis_numero: 1, edad_objetivo_meses: 0, intervalo_min_dias: "" })}>
                    Limpiar
                  </button>
                </div>
              </form>

              <div className="table-responsive mt-3">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr><th>Vacuna</th><th>Dosis</th><th>Edad (m)</th><th>Intervalo</th><th>ScheduleID</th></tr>
                  </thead>
                  <tbody>
                    {filteredSchedule.map((s) => (
                      <tr key={s.schedule_id}>
                        <td className="fw-semibold">{s.vaccine_nombre}</td>
                        <td>{s.dosis_numero}</td>
                        <td>{s.edad_objetivo_meses}</td>
                        <td className="text-muted">{s.intervalo_min_dias ?? "-"}</td>
                        <td className="text-muted">{s.schedule_id}</td>
                      </tr>
                    ))}
                    {filteredSchedule.length === 0 && (
                      <tr><td colSpan="5" className="text-muted">Sin resultados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {/* ====================== PEDIATRA TAB ====================== */}
        {tab === "PEDIATRA" && (
          <>
            <Section title="Registro rápido" subtitle="Crear Representante + Niño desde el panel administrativo.">
              {regMsg && <div className="alert alert-info py-2">{regMsg}</div>}

              <form className="row g-2" onSubmit={registerChild}>
                <div className="col-12"><strong>Representante</strong></div>
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

                <div className="col-12 mt-2"><strong>Niño</strong></div>
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

                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary btn-sm" disabled={loading}>Registrar</button>
                </div>
              </form>
            </Section>

            <Section title="Crear visita" subtitle="Registrar atención con peso, talla y observaciones.">
              {visitMsg && <div className="alert alert-info py-2">{visitMsg}</div>}

              <form className="row g-2" onSubmit={createVisit}>
                <div className="col-md-4">
                  <select className="form-select" value={visitForm.child_id} onChange={(e) => setVisitForm({ ...visitForm, child_id: e.target.value })} required>
                    <option value="">Seleccione niño...</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} - {c.numero_documento}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
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
                <div className="col-md-2">
                  <button className="btn btn-success btn-sm w-100" disabled={loading}>Crear visita</button>
                </div>
                <div className="col-12">
                  <input className="form-control" placeholder="Observaciones"
                    value={visitForm.observaciones}
                    onChange={(e) => setVisitForm({ ...visitForm, observaciones: e.target.value })} />
                </div>
              </form>
            </Section>

            <Section title="Aplicar vacuna" subtitle="Selecciona la dosis del esquema y registra la aplicación.">
              {applyMsg && <div className="alert alert-info py-2">{applyMsg}</div>}

              <form className="row g-2" onSubmit={applyVaccine}>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Visit ID" value={applyForm.visit_id}
                    onChange={(e) => setApplyForm({ ...applyForm, visit_id: e.target.value })} required />
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={applyForm.schedule_id}
                    onChange={(e) => setApplyForm({ ...applyForm, schedule_id: e.target.value })} required>
                    <option value="">Seleccione dosis...</option>
                    {scheduleFull.map((s) => (
                      <option key={s.schedule_id} value={s.schedule_id}>
                        {s.vaccine_nombre} — Dosis {s.dosis_numero} — {s.edad_objetivo_meses} meses
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input type="date" className="form-control" value={applyForm.fecha_aplicacion}
                    onChange={(e) => setApplyForm({ ...applyForm, fecha_aplicacion: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Lote" value={applyForm.lote}
                    onChange={(e) => setApplyForm({ ...applyForm, lote: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <input type="date" className="form-control" value={applyForm.proxima_fecha}
                    onChange={(e) => setApplyForm({ ...applyForm, proxima_fecha: e.target.value })} />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary btn-sm" disabled={loading}>Aplicar</button>
                </div>
              </form>
            </Section>
          </>
        )}

        {/* ====================== REPRESENTANTE TAB ====================== */}
        {tab === "REPRESENTANTE" && (
          <>
            <Section
              title="Consulta (modo representante)"
              subtitle="Selecciona un niño para ver próximas vacunas e historial completo."
              right={
                <div className="d-flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={loadHistoryAndNext} disabled={!selectedChildId || loading}>
                    {loading ? "Cargando..." : "Cargar"}
                  </button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()} disabled={!selectedChildId}>
                    Imprimir
                  </button>
                </div>
              }
            >
              <div className="row g-2 align-items-end">
                <div className="col-md-6">
                  <label className="form-label">Seleccione niño</label>
                  <select className="form-select" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
                    <option value="">Seleccione...</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} - {c.numero_documento}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {repMsg && <div className="alert alert-info py-2 mt-3">{repMsg}</div>}
            </Section>

            <Section title="Próximas vacunas" subtitle="Pendientes y recomendadas">
              <div className="table-responsive">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Vacuna</th><th>Dosis</th><th>Edad (m)</th><th>Fecha recomendada</th><th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextItems.map((x) => (
                      <tr key={x.schedule_id}>
                        <td className="fw-semibold">{x.vaccine_nombre}</td>
                        <td>{x.dosis_numero}</td>
                        <td>{x.edad_objetivo_meses}</td>
                        <td>{fmtDate(x.fecha_recomendada)}</td>
                        <td><BadgeEstado estado={x.estado} /></td>
                      </tr>
                    ))}
                    {nextItems.length === 0 && selectedChildId && (
                      <tr><td colSpan="5" className="text-muted">No hay pendientes.</td></tr>
                    )}
                    {!selectedChildId && (
                      <tr><td colSpan="5" className="text-muted">Selecciona un niño para ver pendientes.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Historial" subtitle="Visitas y aplicaciones registradas">
              {history.map((item, idx) => (
                <div className="border rounded-3 p-3 mb-3" key={idx}>
                  <div className="d-flex flex-wrap justify-content-between gap-2">
                    <div className="fw-semibold">
                      Visita: {fmtDate(item.visit.fecha_atencion)}
                      <span className="text-muted fw-normal"> • Peso: {item.visit.peso_kg} kg • Talla: {item.visit.talla_cm} cm</span>
                    </div>
                  </div>

                  {item.visit.observaciones && <div className="text-muted mt-1">{item.visit.observaciones}</div>}

                  <div className="table-responsive mt-3">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr><th>Vacuna</th><th>Dosis</th><th>Fecha</th><th>Lote</th><th>Próxima</th></tr>
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
                        {item.applications.length === 0 && (
                          <tr><td colSpan="5" className="text-muted">Sin vacunas en esta visita.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {history.length === 0 && selectedChildId && (
                <div className="text-muted">Sin historial aún.</div>
              )}
              {!selectedChildId && (
                <div className="text-muted">Selecciona un niño para ver el historial.</div>
              )}
            </Section>
          </>
        )}
      </div>
    </>
  );
}
