import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

function Centros() {
  const { auth } = useContext(AuthContext);
  const canEdit = auth.rol === "admin";

  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Form completo según tabla centro_salud
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    responsable: "",
    nivel: "",
    horario_atencion: "",
    correo: "",
    ciudad: "",
    provincia: "",
  });

  const [msg, setMsg] = useState({ type: "", text: "" });
  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const limpiar = () => {
    setForm({
      nombre: "",
      direccion: "",
      telefono: "",
      responsable: "",
      nivel: "",
      horario_atencion: "",
      correo: "",
      ciudad: "",
      provincia: "",
    });
  };

  const cargarCentros = async () => {
    setLoading(true);
    try {
      const res = await API.get("/centros/");
      setCentros(res.data);
    } catch {
      showMsg("danger", "No se pudo cargar la lista de centros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCentros();
  }, []);

  const crearCentro = async (e) => {
    e.preventDefault();
    try {
      await API.post("/centros/", {
        ...form,
        // opcional: convertir strings vacíos en null
        direccion: form.direccion || null,
        telefono: form.telefono || null,
        responsable: form.responsable || null,
        nivel: form.nivel || null,
        horario_atencion: form.horario_atencion || null,
        correo: form.correo || null,
        ciudad: form.ciudad || null,
        provincia: form.provincia || null,
      });
      showMsg("success", "Centro creado.");
      limpiar();
      cargarCentros();
    } catch {
      showMsg("danger", "No se pudo crear el centro (revisa datos/permisos).");
    }
  };

  const eliminarCentro = async (id) => {
    if (!window.confirm("¿Eliminar este centro?")) return;
    try {
      await API.delete(`/centros/${id}`);
      showMsg("success", "Centro eliminado.");
      cargarCentros();
    } catch {
      showMsg("danger", "No se pudo eliminar.");
    }
  };

  const right = (
    <span className="badge text-bg-primary px-3 py-2">
      Rol: <span className="fw-semibold">{auth.rol}</span>
    </span>
  );

  return (
    <PageLayout title="Centros" subtitle="Gestión de centro_salud" right={right}>
      {msg.text && (
        <div className={`alert alert-${msg.type} py-2`} role="alert">
          {msg.text}
        </div>
      )}

      {canEdit && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Nuevo centro</h5>

            <form onSubmit={crearCentro} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre *</label>
                <input
                  className="form-control"
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Responsable</label>
                <input
                  className="form-control"
                  name="responsable"
                  value={form.responsable}
                  onChange={onChange}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Dirección</label>
                <input
                  className="form-control"
                  name="direccion"
                  value={form.direccion}
                  onChange={onChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Teléfono</label>
                <input
                  className="form-control"
                  name="telefono"
                  value={form.telefono}
                  onChange={onChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Nivel</label>
                <input
                  className="form-control"
                  name="nivel"
                  value={form.nivel}
                  onChange={onChange}
                  placeholder="Ej: 1, 2, Hospital..."
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Horario atención</label>
                <input
                  className="form-control"
                  name="horario_atencion"
                  value={form.horario_atencion}
                  onChange={onChange}
                  placeholder="Ej: 08:00-16:00"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Correo</label>
                <input
                  type="email"
                  className="form-control"
                  name="correo"
                  value={form.correo}
                  onChange={onChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Ciudad</label>
                <input
                  className="form-control"
                  name="ciudad"
                  value={form.ciudad}
                  onChange={onChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Provincia</label>
                <input
                  className="form-control"
                  name="provincia"
                  value={form.provincia}
                  onChange={onChange}
                />
              </div>

              <div className="col-12">
                <button className="btn btn-primary">Guardar</button>
                <button
                  type="button"
                  className="btn btn-outline-secondary ms-2"
                  onClick={limpiar}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-muted">Cargando...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Responsable</th>
                <th>Ciudad</th>
                <th>Provincia</th>
                <th>Teléfono</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {centros.map((c) => (
                <tr key={c.id_centro}>
                  <td>{c.id_centro}</td>
                  <td className="fw-semibold">{c.nombre}</td>
                  <td>{c.responsable || "—"}</td>
                  <td>{c.ciudad || "—"}</td>
                  <td>{c.provincia || "—"}</td>
                  <td>{c.telefono || "—"}</td>
                  <td>
                    {canEdit ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => eliminarCentro(c.id_centro)}
                      >
                        Eliminar
                      </button>
                    ) : (
                      <span className="text-muted fst-italic">Solo lectura</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <small className="text-muted d-block">
            *Campos adicionales (dirección, horario, correo) están en el formulario.
          </small>
        </div>
      )}
    </PageLayout>
  );
}

export default Centros;
