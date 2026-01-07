import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";
import { Link } from "react-router-dom";

function Historial() {
  const { auth } = useContext(AuthContext);
  const canEdit = auth.rol === "admin" || auth.rol === "medico";

  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  // Para selects
  const [personas, setPersonas] = useState([]);
  const [centros, setCentros] = useState([]);
  const [cargos, setCargos] = useState([]);

  // Form cabecera historial_vacunacion
  const [form, setForm] = useState({
    id_persona: "",
    id_centro: "",
    id_cargo: "",
    fecha_aplicacion: "",
    observaciones: "",
  });

  const [msg, setMsg] = useState({ type: "", text: "" });
  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [hRes, cRes, cargoRes] = await Promise.all([
        API.get("/historial/"),
        API.get("/centros/"),
        API.get("/cargos/"), // 👈 ajusta si tu ruta es /cargos-medicos/
      ]);

      setHistorial(hRes.data);
      setCentros(cRes.data);
      setCargos(cargoRes.data);

      // Personas puede estar restringido según rol
      try {
        const pRes = await API.get("/personas/");
        setPersonas(pRes.data);
      } catch {
        setPersonas([]);
      }
    } catch {
      showMsg("warning", "No tienes permisos o falta alguna ruta para cargar datos.");
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const limpiar = () => {
    setForm({
      id_persona: "",
      id_centro: "",
      id_cargo: "",
      fecha_aplicacion: "",
      observaciones: "",
    });
  };

  const crearHistorial = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id_persona: parseInt(form.id_persona),
        id_centro: parseInt(form.id_centro),
        id_cargo: parseInt(form.id_cargo),
        fecha_aplicacion: form.fecha_aplicacion,
        observaciones: form.observaciones || null,
      };

      await API.post("/historial/", payload);
      showMsg("success", "Historial creado.");
      limpiar();
      cargarTodo();
    } catch (err) {
      showMsg("danger", "No se pudo crear historial (revisa datos/permisos).");
      console.log(err);
    }
  };

  const desactivarHistorial = async (id) => {
    if (!window.confirm("¿Desactivar este historial?")) return;
    try {
      await API.delete(`/historial/${id}`);
      showMsg("success", "Historial desactivado.");
      cargarTodo();
    } catch {
      showMsg("danger", "No se pudo desactivar.");
    }
  };

  const right = (
    <span className="badge text-bg-primary px-3 py-2">
      Rol: <span className="fw-semibold">{auth.rol}</span>
    </span>
  );

  return (
    <PageLayout title="Historial" subtitle="historial_vacunacion (cabecera)" right={right}>
      {msg.text && (
        <div className={`alert alert-${msg.type} py-2`} role="alert">
          {msg.text}
        </div>
      )}

      {canEdit && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Nuevo historial</h5>

            <form onSubmit={crearHistorial} className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Persona *</label>
                <select
                  className="form-select"
                  name="id_persona"
                  value={form.id_persona}
                  onChange={onChange}
                  required
                >
                  <option value="">Seleccione...</option>
                  {personas.map((p) => (
                    <option key={p.id_persona} value={p.id_persona}>
                      {p.nombres} {p.apellidos} ({p.numero_documento})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Centro *</label>
                <select
                  className="form-select"
                  name="id_centro"
                  value={form.id_centro}
                  onChange={onChange}
                  required
                >
                  <option value="">Seleccione...</option>
                  {centros.map((c) => (
                    <option key={c.id_centro} value={c.id_centro}>
                      {c.nombre} - {c.ciudad || "—"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Cargo médico *</label>
                <select
                  className="form-select"
                  name="id_cargo"
                  value={form.id_cargo}
                  onChange={onChange}
                  required
                >
                  <option value="">Seleccione...</option>
                  {cargos.map((x) => (
                    <option key={x.id_cargo} value={x.id_cargo}>
                      {x.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Fecha aplicación *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="fecha_aplicacion"
                  value={form.fecha_aplicacion}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  rows="2"
                  name="observaciones"
                  value={form.observaciones}
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
                <th>Persona</th>
                <th>Centro</th>
                <th>Cargo</th>
                <th>Fecha</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => (
                <tr key={h.id_historial}>
                  <td>{h.id_historial}</td>
                  <td>
                    <span className="badge text-bg-primary">#{h.id_persona}</span>
                  </td>
                  <td>
                    <span className="badge text-bg-light border">#{h.id_centro}</span>
                  </td>
                  <td>
                    <span className="badge text-bg-dark">#{h.id_cargo}</span>
                  </td>
                  <td className="text-muted">{h.fecha_aplicacion}</td>
                  <td className="d-flex gap-2">
                    <Link
                      className="btn btn-sm btn-outline-primary"
                      to={`/historial/${h.id_historial}/detalle`}
                    >
                      Detalle
                    </Link>

                    {canEdit ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => desactivarHistorial(h.id_historial)}
                      >
                        Desactivar
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
            *Para ver vacunas aplicadas (lote, dosis, próxima) entra a “Detalle”.
          </small>
        </div>
      )}
    </PageLayout>
  );
}

export default Historial;

