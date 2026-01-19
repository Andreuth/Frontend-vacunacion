import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function AdminDashboard() {
  const [tab, setTab] = useState("ADMIN"); // ADMIN | PEDIATRA | REPRESENTANTE

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

  // ===== ADMIN: VACCINES + SCHEDULE =====
  const [vaccines, setVaccines] = useState([]);
  const [vForm, setVForm] = useState({ nombre: "", descripcion: "" });
  const [vMsg, setVMsg] = useState("");

  const [scheduleFull, setScheduleFull] = useState([]);
  const [sForm, setSForm] = useState({ vaccine_id: "", dosis_numero: 1, edad_objetivo_meses: 0, intervalo_min_dias: "" });
  const [sMsg, setSMsg] = useState("");

  // ===== PEDIATRA (dentro del admin): registro rápido + visita + aplicar =====
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

  // ===== REPRESENTANTE (vista admin): consultar historial y próximas =====
  const [selectedChildId, setSelectedChildId] = useState("");
  const [history, setHistory] = useState([]);
  const [nextItems, setNextItems] = useState([]);
  const [repMsg, setRepMsg] = useState("");

  const loadAll = async () => {
    try {
      const [u, v, sch, c] = await Promise.all([
        api.get("/users/"),
        api.get("/vaccines/"),
        api.get("/vaccines/schedule/full"),
        api.get("/children/"),
      ]);
      setUsers(u.data);
      setVaccines(v.data);
      setScheduleFull(sch.data);
      setChildren(c.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ===== ADMIN actions =====
  const createUser = async (e) => {
    e.preventDefault();
    setUMsg("");
    try {
      const res = await api.post("/users/", uForm);
      setUMsg("✅ Usuario creado");
      setUForm({ nombres: "", apellidos: "", numero_documento: "", rol: "REPRESENTANTE", password: "" });
      setUsers([res.data, ...users]);
    } catch (e) {
      setUMsg(e?.response?.data?.detail || "Error creando usuario");
    }
  };

  const createVaccine = async (e) => {
    e.preventDefault();
    setVMsg("");
    try {
      const res = await api.post("/vaccines/", vForm);
      setVMsg("✅ Vacuna creada");
      setVForm({ nombre: "", descripcion: "" });
      setVaccines([res.data, ...vaccines]);
      await loadAll();
    } catch (e) {
      setVMsg(e?.response?.data?.detail || "Error creando vacuna");
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
      await loadAll();
    } catch (e) {
      setSMsg(e?.response?.data?.detail || "Error creando esquema");
    }
  };

  // ===== PEDIATRA-in-admin actions =====
  const registerChild = async (e) => {
    e.preventDefault();
    setRegMsg("");
    try {
      const res = await api.post("/children/register/", reg);
      setRegMsg(`✅ Registrado: representante_id=${res.data.representante_id}, nino_id=${res.data.nino_id}`);
      await loadAll();
    } catch (e) {
      setRegMsg(e?.response?.data?.detail || "Error en registro rápido");
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
      setApplyForm({ ...applyForm, visit_id: String(res.data.id) });
    } catch (e) {
      setVisitMsg(e?.response?.data?.detail || "Error creando visita");
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
    } catch (e) {
      setApplyMsg(e?.response?.data?.detail || "Error aplicando vacuna");
    }
  };

  // ===== REPRESENTANTE-in-admin actions =====
  const loadHistoryAndNext = async () => {
    if (!selectedChildId) return;
    setRepMsg("");
    try {
      const [h, n] = await Promise.all([
        api.get(`/visits/history/${selectedChildId}/full`),
        api.get(`/children/${selectedChildId}/next-vaccines`),
      ]);
      setHistory(h.data);
      setNextItems(n.data.items || []);
    } catch (e) {
      setRepMsg(e?.response?.data?.detail || "Error consultando historial/próximas");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h4 className="mb-3">Panel ADMIN (con vistas)</h4>

        {/* Tabs */}
        <div className="btn-group mb-3">
          <button className={`btn btn-sm ${tab === "ADMIN" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("ADMIN")}>
            Vista ADMIN
          </button>
          <button className={`btn btn-sm ${tab === "PEDIATRA" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("PEDIATRA")}>
            Vista PEDIATRA
          </button>
          <button className={`btn btn-sm ${tab === "REPRESENTANTE" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("REPRESENTANTE")}>
            Vista REPRESENTANTE
          </button>
        </div>

        {/* ====================== ADMIN TAB ====================== */}
        {tab === "ADMIN" && (
          <>
            {/* USERS */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5>Usuarios</h5>
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
                  <div className="col-12">
                    <button className="btn btn-primary btn-sm">Crear usuario</button>
                  </div>
                </form>

                <hr />
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead><tr><th>ID</th><th>Documento</th><th>Nombres</th><th>Apellidos</th><th>Rol</th></tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.numero_documento}</td>
                          <td>{u.nombres}</td>
                          <td>{u.apellidos}</td>
                          <td>{u.rol}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

            {/* Vaccines */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5>Vacunas</h5>
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
                  <div className="col-md-2">
                    <button className="btn btn-success btn-sm w-100">Crear</button>
                  </div>
                </form>

                <hr />
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th></tr></thead>
                    <tbody>
                      {vaccines.map((v) => (
                        <tr key={v.id}>
                          <td>{v.id}</td>
                          <td>{v.nombre}</td>
                          <td>{v.descripcion || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

            {/* Schedule */}
            <div className="card shadow-sm">
              <div className="card-body">
                <h5>Esquema por dosis</h5>
                {sMsg && <div className="alert alert-info py-2">{sMsg}</div>}

                <form className="row g-2" onSubmit={createSchedule}>
                  <div className="col-md-4">
                    <select className="form-select" value={sForm.vaccine_id} onChange={(e) => setSForm({ ...sForm, vaccine_id: e.target.value })} required>
                      <option value="">Seleccione vacuna...</option>
                      {vaccines.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <input className="form-control" type="number" min="1" placeholder="Dosis #" value={sForm.dosis_numero}
                      onChange={(e) => setSForm({ ...sForm, dosis_numero: e.target.value })} required />
                  </div>
                  <div className="col-md-3">
                    <input className="form-control" type="number" min="0" placeholder="Edad (meses)" value={sForm.edad_objetivo_meses}
                      onChange={(e) => setSForm({ ...sForm, edad_objetivo_meses: e.target.value })} required />
                  </div>
                  <div className="col-md-3">
                    <input className="form-control" type="number" min="0" placeholder="Intervalo (días) opcional" value={sForm.intervalo_min_dias}
                      onChange={(e) => setSForm({ ...sForm, intervalo_min_dias: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary btn-sm">Agregar al esquema</button>
                  </div>
                </form>

                <hr />
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead><tr><th>Vacuna</th><th>Dosis</th><th>Edad(m)</th><th>Intervalo</th><th>ScheduleID</th></tr></thead>
                    <tbody>
                      {scheduleFull.map((s) => (
                        <tr key={s.schedule_id}>
                          <td>{s.vaccine_nombre}</td>
                          <td>{s.dosis_numero}</td>
                          <td>{s.edad_objetivo_meses}</td>
                          <td>{s.intervalo_min_dias ?? "-"}</td>
                          <td>{s.schedule_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </>
        )}

        {/* ====================== PEDIATRA TAB ====================== */}
        {tab === "PEDIATRA" && (
          <>
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5>Registro rápido (Representante + Niño)</h5>
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

                  <div className="col-12">
                    <button className="btn btn-primary btn-sm">Registrar</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5>Crear visita (peso/talla)</h5>
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
                    <button className="btn btn-success btn-sm w-100">Crear visita</button>
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Observaciones"
                      value={visitForm.observaciones}
                      onChange={(e) => setVisitForm({ ...visitForm, observaciones: e.target.value })} />
                  </div>
                </form>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <h5>Aplicar vacuna</h5>
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
                    <button className="btn btn-primary btn-sm">Aplicar</button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ====================== REPRESENTANTE TAB ====================== */}
        {tab === "REPRESENTANTE" && (
          <>
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <h5>Consulta (modo representante)</h5>
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
                  <div className="col-md-3">
                    <button className="btn btn-primary btn-sm w-100" onClick={loadHistoryAndNext} disabled={!selectedChildId}>
                      Cargar historial y próximas
                    </button>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => window.print()} disabled={!selectedChildId}>
                      Imprimir
                    </button>
                  </div>
                </div>

                {repMsg && <div className="alert alert-info py-2 mt-3">{repMsg}</div>}
              </div>
            </div>

            {/* Próximas */}
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <h6>Próximas vacunas</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Vacuna</th><th>Dosis</th><th>Edad(m)</th><th>Fecha recomendada</th><th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nextItems.map((x) => (
                        <tr key={x.schedule_id}>
                          <td>{x.vaccine_nombre}</td>
                          <td>{x.dosis_numero}</td>
                          <td>{x.edad_objetivo_meses}</td>
                          <td>{x.fecha_recomendada}</td>
                          <td>
                            <span className={`badge ${x.estado === "ATRASADA" ? "text-bg-danger" : "text-bg-success"}`}>
                              {x.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {nextItems.length === 0 && selectedChildId && (
                        <tr><td colSpan="5" className="text-muted">No hay pendientes.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Historial */}
            <div className="card shadow-sm">
              <div className="card-body">
                <h6>Historial</h6>
                {history.map((item, idx) => (
                  <div className="border rounded p-2 mb-2" key={idx}>
                    <div className="fw-semibold">
                      Visita: {item.visit.fecha_atencion} | Peso: {item.visit.peso_kg} kg | Talla: {item.visit.talla_cm} cm
                    </div>
                    {item.visit.observaciones && <div className="text-muted">{item.visit.observaciones}</div>}
                    <div className="table-responsive mt-2">
                      <table className="table table-sm">
                        <thead>
                          <tr><th>Vacuna</th><th>Dosis</th><th>Fecha</th><th>Lote</th><th>Próxima</th></tr>
                        </thead>
                        <tbody>
                          {item.applications.map((a) => (
                            <tr key={a.application_id}>
                              <td>{a.vaccine_nombre}</td>
                              <td>{a.dosis_numero}</td>
                              <td>{a.fecha_aplicacion}</td>
                              <td>{a.lote || "-"}</td>
                              <td>{a.proxima_fecha || "-"}</td>
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
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
