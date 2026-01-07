import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

function Personas() {
  const { auth } = useContext(AuthContext);

  const isAdmin = auth.rol === "admin";
  const isMedico = auth.rol === "medico";

  const canEdit = isAdmin || isMedico;

  const [busqueda, setBusqueda] = useState("");

  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    numero_documento: "",
    rol: "",
    password: "",
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

  const limpiar = () => {
    setForm({
      nombres: "",
      apellidos: "",
      numero_documento: "",
      rol: "",
      password: "",
    });
    setEditando(null);
  };

  // ✅ Filtro de visibilidad para MEDICO: solo padre e hijo
  const filtrarVisibles = (data) => {
    if (isMedico) {
      return data.filter((p) => p.rol === "padre" || p.rol === "hijo");
    }
    return data;
  };

  const cargarPersonas = async () => {
    setLoading(true);
    try {
      const res = await API.get("/personas/");
      const dataFiltrada = filtrarVisibles(res.data);
      setPersonas(dataFiltrada);
    } catch {
      showMsg("danger", "No se pudo cargar personas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPersonas();
  }, []);

  const abrirNuevo = () => {
    limpiar();
    setShowModal(true);
  };

  const abrirEditar = (p) => {
    // ✅ seguridad extra en front (aunque backend debe controlar)
    if (isMedico && !(p.rol === "padre" || p.rol === "hijo")) {
      showMsg("warning", "No tienes permisos para editar este usuario.");
      return;
    }

    setEditando(p);
    setForm({
      nombres: p.nombres,
      apellidos: p.apellidos,
      numero_documento: p.numero_documento,
      rol: p.rol,
      password: "",
    });
    setShowModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();

    try {
      if (!form.rol) {
        showMsg("warning", "Selecciona un rol.");
        return;
      }

      // ✅ Médico solo puede guardar padre/hijo
      if (isMedico && !(form.rol === "padre" || form.rol === "hijo")) {
        showMsg("warning", "Médico solo puede crear/editar padre o hijo.");
        return;
      }

      const payload = {
        nombres: form.nombres,
        apellidos: form.apellidos,
        numero_documento: form.numero_documento,
        rol: form.rol,
      };

      // password solo si NO es hijo
      if (form.rol !== "hijo" && form.password) {
        payload.password = form.password;
      }

      if (editando) {
        await API.put(`/personas/${editando.id_persona}`, payload);
        showMsg("success", "Persona actualizada.");
      } else {
        await API.post("/personas/", payload);
        showMsg("success", "Persona creada.");
      }

      setShowModal(false);
      limpiar();
      cargarPersonas();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      showMsg("danger", detail || "Error al guardar persona.");
    }
  };

  const eliminar = async (id, rolPersona) => {
    if (!window.confirm("¿Desactivar esta persona?")) return;

    // ✅ Médico no puede eliminar admin/medico
    if (isMedico && !(rolPersona === "padre" || rolPersona === "hijo")) {
      showMsg("warning", "No tienes permisos para eliminar este usuario.");
      return;
    }

    try {
      await API.delete(`/personas/${id}`);
      showMsg("success", "Persona desactivada.");
      cargarPersonas();
    } catch {
      showMsg("danger", "No se pudo desactivar.");
    }
  };

  // roles visibles según usuario
  const rolesDisponibles = () => {
    if (isAdmin) return ["admin", "medico", "padre", "hijo"];
    if (isMedico) return ["padre", "hijo"];
    return [];
  };

  // 🔍 Filtro de búsqueda (nombre/apellido/documento)
  const personasFiltradas = personas.filter((p) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;

    return (
      (p.nombres || "").toLowerCase().includes(texto) ||
      (p.apellidos || "").toLowerCase().includes(texto) ||
      (p.numero_documento || "").toLowerCase().includes(texto)
    );
  });

  const right = (
    <span className="badge text-bg-primary px-3 py-2">
      Rol: <span className="fw-semibold">{auth.rol}</span>
    </span>
  );

  return (
    <PageLayout title="Personas" subtitle="Gestión de usuarios" right={right}>
      {msg.text && (
        <div className={`alert alert-${msg.type} py-2`} role="alert">
          {msg.text}
        </div>
      )}

      {/* Buscador + botón */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Buscar por nombre o documento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {canEdit && (
          <button className="btn btn-primary ms-2" onClick={abrirNuevo}>
            + Nueva persona
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-muted">Cargando...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombres</th>
                <th>Documento</th>
                <th>Rol</th>
                <th>Activo</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personasFiltradas.map((p) => (
                <tr key={p.id_persona}>
                  <td>{p.id_persona}</td>
                  <td>
                    {p.nombres} {p.apellidos}
                  </td>
                  <td>{p.numero_documento}</td>
                  <td>
                    <span className="badge text-bg-secondary">{p.rol}</span>
                  </td>
                  <td>
                    {p.activo ? (
                      <span className="badge text-bg-success">Sí</span>
                    ) : (
                      <span className="badge text-bg-danger">No</span>
                    )}
                  </td>
                  <td className="d-flex gap-2">
                    {canEdit ? (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => abrirEditar(p)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminar(p.id_persona, p.rol)}
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <span className="text-muted fst-italic">Solo lectura</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isMedico && (
            <small className="text-muted d-block">
              *Como médico solo puedes ver/editar usuarios con rol <b>padre</b> y{" "}
              <b>hijo</b>.
            </small>
          )}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={guardar}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editando ? "Editar persona" : "Nueva persona"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                <div className="modal-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nombres *</label>
                    <input
                      className="form-control"
                      name="nombres"
                      value={form.nombres}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Apellidos *</label>
                    <input
                      className="form-control"
                      name="apellidos"
                      value={form.apellidos}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Documento *</label>
                    <input
                      className="form-control"
                      name="numero_documento"
                      value={form.numero_documento}
                      onChange={onChange}
                      required
                      disabled={!!editando}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Rol *</label>
                    <select
                      className="form-select"
                      name="rol"
                      value={form.rol}
                      onChange={onChange}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {rolesDisponibles().map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PASSWORD solo si NO es hijo */}
                  {form.rol !== "hijo" && (
                    <div className="col-md-6">
                      <label className="form-label">
                        {editando ? "Nueva contraseña" : "Contraseña *"}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={form.password}
                        onChange={onChange}
                        required={!editando}
                      />
                    </div>
                  )}

                  {form.rol === "hijo" && (
                    <div className="col-12">
                      <div className="alert alert-info py-2">
                        Los usuarios con rol <b>hijo</b> no tienen contraseña ni
                        acceso al sistema.
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default Personas;
