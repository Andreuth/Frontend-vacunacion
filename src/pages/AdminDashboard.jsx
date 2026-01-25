import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

export default function AdminDashboard() {
  const [tab, setTab] = useState("USERS"); // USERS | VACCINES | SCHEDULE | CHILDREN

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [users, setUsers] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [children, setChildren] = useState([]);

  // Forms
  const [uForm, setUForm] = useState({ nombres: "", apellidos: "", numero_documento: "", rol: "REPRESENTANTE", password: "" });
  const [vForm, setVForm] = useState({ nombre: "", descripcion: "" });
  const [sForm, setSForm] = useState({ vaccine_id: "", dosis_numero: 1, edad_objetivo_meses: 0, intervalo_min_dias: null });

  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const [u, v, sch, ch] = await Promise.all([
        api.get("/users/"),
        api.get("/vaccines/"),
        api.get("/vaccines/schedule/full"),
        api.get("/children/"),
      ]);
      setUsers(u.data || []);
      setVaccines(v.data || []);
      setSchedule(sch.data || []);
      setChildren(ch.data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const stats = useMemo(
    () => ({
      usuarios: users.length,
      vacunas: vaccines.length,
      esquema: schedule.length,
      ninos: children.length,
    }),
    [users, vaccines, schedule, children]
  );

  const createUser = async () => {
    setErr("");
    try {
      await api.post("/users/", uForm);
      setUForm({ nombres: "", apellidos: "", numero_documento: "", rol: "REPRESENTANTE", password: "" });
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo crear usuario");
    }
  };

  const createVaccine = async () => {
    setErr("");
    try {
      await api.post("/vaccines/", vForm);
      setVForm({ nombre: "", descripcion: "" });
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo crear vacuna");
    }
  };

  const deactivateVaccine = async (id) => {
    if (!confirm("¿Desactivar esta vacuna?")) return;
    setErr("");
    try {
      await api.delete(`/vaccines/${id}`);
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo desactivar");
    }
  };

  const createSchedule = async () => {
    setErr("");
    try {
      const payload = { ...sForm, dosis_numero: Number(sForm.dosis_numero), edad_objetivo_meses: Number(sForm.edad_objetivo_meses) };
      if (payload.intervalo_min_dias === "" || payload.intervalo_min_dias === null) delete payload.intervalo_min_dias;
      else payload.intervalo_min_dias = Number(payload.intervalo_min_dias);

      await api.post("/vaccines/schedule", payload);
      setSForm({ vaccine_id: "", dosis_numero: 1, edad_objetivo_meses: 0, intervalo_min_dias: null });
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo agregar al esquema");
    }
  };

  const deleteSchedule = async (schedule_id) => {
    if (!confirm("¿Eliminar (desactivar) este esquema?")) return;
    setErr("");
    try {
      await api.delete(`/vaccines/schedule/${schedule_id}`);
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo eliminar el esquema");
    }
  };

  return (
    <AppLayout title="Panel ADMIN">
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white shadow-sm" style={{ borderRadius: 16 }}>
            <div className="text-muted small">Usuarios</div>
            <div className="fs-4 fw-bold">{stats.usuarios}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white shadow-sm" style={{ borderRadius: 16 }}>
            <div className="text-muted small">Niños</div>
            <div className="fs-4 fw-bold">{stats.ninos}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white shadow-sm" style={{ borderRadius: 16 }}>
            <div className="text-muted small">Vacunas activas</div>
            <div className="fs-4 fw-bold">{stats.vacunas}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white shadow-sm" style={{ borderRadius: 16 }}>
            <div className="text-muted small">Esquema (dosis)</div>
            <div className="fs-4 fw-bold">{stats.esquema}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm p-3 mb-3" style={{ borderRadius: 16 }}>
        <div className="btn-group">
          <button className={`btn btn-sm ${tab === "USERS" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("USERS")}>
            Usuarios
          </button>
          <button className={`btn btn-sm ${tab === "CHILDREN" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("CHILDREN")}>
            Niños
          </button>
          <button className={`btn btn-sm ${tab === "VACCINES" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("VACCINES")}>
            Vacunas
          </button>
          <button className={`btn btn-sm ${tab === "SCHEDULE" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setTab("SCHEDULE")}>
            Esquema por dosis
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted">Cargando...</div>
      ) : (
        <>
          {tab === "USERS" && (
            <div className="bg-white shadow-sm p-3" style={{ borderRadius: 16 }}>
              <h6 className="mb-3">Crear usuario</h6>
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-3">
                  <input className="form-control" placeholder="Nombres" value={uForm.nombres} onChange={(e) => setUForm({ ...uForm, nombres: e.target.value })} />
                </div>
                <div className="col-12 col-md-3">
                  <input className="form-control" placeholder="Apellidos" value={uForm.apellidos} onChange={(e) => setUForm({ ...uForm, apellidos: e.target.value })} />
                </div>
                <div className="col-12 col-md-2">
                  <input className="form-control" placeholder="Documento" value={uForm.numero_documento} onChange={(e) => setUForm({ ...uForm, numero_documento: e.target.value })} />
                </div>
                <div className="col-12 col-md-2">
                  <select className="form-select" value={uForm.rol} onChange={(e) => setUForm({ ...uForm, rol: e.target.value })}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="PEDIATRA">PEDIATRA</option>
                    <option value="REPRESENTANTE">REPRESENTANTE</option>
                  </select>
                </div>
                <div className="col-12 col-md-2">
                  <input className="form-control" placeholder="Password" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary" onClick={createUser}>
                    Crear
                  </button>
                </div>
              </div>

              <DataTable
                rows={users}
                columns={[
                  { key: "id", header: "ID" },
                  { key: "numero_documento", header: "Documento" },
                  { key: "nombres", header: "Nombres" },
                  { key: "apellidos", header: "Apellidos" },
                  { key: "rol", header: "Rol" },
                ]}
              />
            </div>
          )}

          {tab === "CHILDREN" && (
            <div className="bg-white shadow-sm p-3" style={{ borderRadius: 16 }}>
              <h6 className="mb-3">Niños registrados</h6>
              <DataTable
                rows={children}
                columns={[
                  { key: "id", header: "ID" },
                  { key: "numero_documento", header: "Documento" },
                  { key: "nombres", header: "Nombres" },
                  { key: "apellidos", header: "Apellidos" },
                  { key: "fecha_nacimiento", header: "F. nacimiento" },
                ]}
                searchPlaceholder="Buscar por nombre, documento..."
              />
              <div className="text-muted small mt-2">
                Idea pro: aquí se puede filtrar “vacunas atrasadas” si el back expone fecha de próxima dosis por niño.
              </div>
            </div>
          )}

          {tab === "VACCINES" && (
            <div className="bg-white shadow-sm p-3" style={{ borderRadius: 16 }}>
              <h6 className="mb-3">Catálogo de vacunas</h6>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-4">
                  <input className="form-control" placeholder="Nombre" value={vForm.nombre} onChange={(e) => setVForm({ ...vForm, nombre: e.target.value })} />
                </div>
                <div className="col-12 col-md-6">
                  <input className="form-control" placeholder="Descripción" value={vForm.descripcion} onChange={(e) => setVForm({ ...vForm, descripcion: e.target.value })} />
                </div>
                <div className="col-12 col-md-2">
                  <button className="btn btn-success w-100" onClick={createVaccine}>
                    Crear
                  </button>
                </div>
              </div>

              <DataTable
                rows={vaccines}
                columns={[
                  { key: "id", header: "ID" },
                  { key: "nombre", header: "Nombre" },
                  { key: "descripcion", header: "Descripción" },
                  { key: "activo", header: "Estado", render: (r) => <StatusBadge active={r.activo} /> },
                  {
                    key: "actions",
                    header: "Acciones",
                    render: (r) => (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deactivateVaccine(r.id)}>
                        Desactivar
                      </button>
                    ),
                  },
                ]}
                searchPlaceholder="Buscar vacuna..."
              />
              <div className="text-muted small mt-2">
                Nota: para “reactivar” una vacuna, conviene agregar un endpoint en el back (PATCH /vaccines/:id/active).
              </div>
            </div>
          )}

          {tab === "SCHEDULE" && (
            <div className="bg-white shadow-sm p-3" style={{ borderRadius: 16 }}>
              <h6 className="mb-3">Esquema por dosis</h6>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-3">
                  <select className="form-select" value={sForm.vaccine_id} onChange={(e) => setSForm({ ...sForm, vaccine_id: e.target.value })}>
                    <option value="">Seleccione vacuna...</option>
                    {vaccines.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-md-2">
                  <input type="number" className="form-control" value={sForm.dosis_numero} onChange={(e) => setSForm({ ...sForm, dosis_numero: e.target.value })} />
                  <div className="text-muted small">Dosis</div>
                </div>
                <div className="col-6 col-md-2">
                  <input type="number" className="form-control" value={sForm.edad_objetivo_meses} onChange={(e) => setSForm({ ...sForm, edad_objetivo_meses: e.target.value })} />
                  <div className="text-muted small">Edad (meses)</div>
                </div>
                <div className="col-12 col-md-3">
                  <input
                    type="number"
                    className="form-control"
                    value={sForm.intervalo_min_dias ?? ""}
                    onChange={(e) => setSForm({ ...sForm, intervalo_min_dias: e.target.value })}
                    placeholder="Intervalo (días) opcional"
                  />
                </div>
                <div className="col-12 col-md-2">
                  <button className="btn btn-primary w-100" onClick={createSchedule} disabled={!sForm.vaccine_id}>
                    Agregar
                  </button>
                </div>
              </div>

              <DataTable
                rows={schedule}
                keyField="schedule_id"
                columns={[
                  { key: "vaccine_nombre", header: "Vacuna" },
                  { key: "dosis_numero", header: "Dosis" },
                  { key: "edad_objetivo_meses", header: "Edad (m)" },
                  { key: "intervalo_min_dias", header: "Intervalo (d)" },
                  {
                    key: "actions",
                    header: "Acciones",
                    render: (r) => (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteSchedule(r.schedule_id)}>
                        Eliminar
                      </button>
                    ),
                  },
                ]}
                searchPlaceholder="Buscar en esquema..."
              />
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
