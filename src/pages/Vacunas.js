import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

function Vacunas() {
  const { auth } = useContext(AuthContext);
  const canEdit = auth.rol === "admin" || auth.rol === "medico";

  const [vacunas, setVacunas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form crear
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [edadRecomendada, setEdadRecomendada] = useState("");
  const [dosis, setDosis] = useState("");

  // Modal editar
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editEdad, setEditEdad] = useState("");
  const [editDosis, setEditDosis] = useState("");

  // UI
  const [msg, setMsg] = useState({ type: "", text: "" });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const cargarVacunas = async () => {
    setLoading(true);
    try {
      const res = await API.get("/vacunas/");
      setVacunas(res.data);
    } catch {
      showMsg("danger", "No se pudo cargar la lista de vacunas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVacunas();
  }, []);

  const limpiarForm = () => {
    setNombre("");
    setDescripcion("");
    setEdadRecomendada("");
    setDosis("");
  };

  const crearVacuna = async (e) => {
    e.preventDefault();
    try {
      await API.post("/vacunas/", {
        nombre,
        descripcion,
        edad_recomendada: edadRecomendada || null,
        dosis_requeridas: dosis ? parseInt(dosis) : null,
      });
      showMsg("success", "Vacuna creada correctamente.");
      limpiarForm();
      cargarVacunas();
    } catch {
      showMsg("danger", "No se pudo crear la vacuna.");
    }
  };

  const eliminarVacuna = async (id) => {
    if (!window.confirm("¿Eliminar esta vacuna?")) return;
    try {
      await API.delete(`/vacunas/${id}`);
      showMsg("success", "Vacuna eliminada.");
      cargarVacunas();
    } catch {
      showMsg("danger", "No se pudo eliminar.");
    }
  };

  // Abrir modal con datos
  const abrirEditar = (v) => {
    setEditId(v.id_vacuna);
    setEditNombre(v.nombre || "");
    setEditDescripcion(v.descripcion || "");
    setEditEdad(v.edad_recomendada || "");
    setEditDosis(v.dosis_requeridas ?? "");
    setShowModal(true);
  };

  const cerrarEditar = () => {
    setShowModal(false);
    setEditId(null);
  };

  // Actualizar (PUT o PATCH)
  const actualizarVacuna = async (e) => {
    e.preventDefault();

    try {
      // ✅ Si tu backend usa PUT:
      await API.put(`/vacunas/${editId}`, {
        nombre: editNombre,
        descripcion: editDescripcion,
        edad_recomendada: editEdad || null,
        dosis_requeridas: editDosis === "" ? null : parseInt(editDosis),
      });

      showMsg("success", "Vacuna actualizada.");
      cerrarEditar();
      cargarVacunas();
    } catch (err) {
      // Si tu backend no tiene PUT, te avisará aquí
      showMsg("danger", "No se pudo actualizar (verifica endpoint PUT/PATCH en backend).");
      console.log(err);
    }
  };

  const right = (
    <span className="badge text-bg-primary px-3 py-2">
      Rol: <span className="fw-semibold">{auth.rol}</span>
    </span>
  );

  return (
    <PageLayout title="Vacunas" subtitle="Gestión de tipos de vacunas" right={right}>
      {msg.text && (
        <div className={`alert alert-${msg.type} py-2`} role="alert">
          {msg.text}
        </div>
      )}

      {/* Crear */}
      {canEdit && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Nueva vacuna</h5>
            <form onSubmit={crearVacuna} className="row g-3">
              <div className="col-md-6">
                <input
                  className="form-control"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <input
                  className="form-control"
                  placeholder="Edad recomendada"
                  value={edadRecomendada}
                  onChange={(e) => setEdadRecomendada(e.target.value)}
                />
              </div>
              <div className="col-12">
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Dosis"
                  value={dosis}
                  onChange={(e) => setDosis(e.target.value)}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-primary">Guardar</button>
                <button
                  type="button"
                  className="btn btn-outline-secondary ms-2"
                  onClick={limpiarForm}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-muted">Cargando...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Edad</th>
                <th>Dosis</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vacunas.map((v) => (
                <tr key={v.id_vacuna}>
                  <td>{v.id_vacuna}</td>
                  <td className="fw-semibold">{v.nombre}</td>
                  <td>{v.edad_recomendada || "—"}</td>
                  <td>{v.dosis_requeridas || "—"}</td>
                  <td>
                    {canEdit ? (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => abrirEditar(v)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminarVacuna(v.id_vacuna)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted fst-italic">Solo lectura</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Editar vacuna #{editId}</h5>
                <button type="button" className="btn-close" onClick={cerrarEditar}></button>
              </div>

              <form onSubmit={actualizarVacuna}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre</label>
                      <input
                        className="form-control"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Edad recomendada</label>
                      <input
                        className="form-control"
                        value={editEdad}
                        onChange={(e) => setEditEdad(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Dosis</label>
                      <input
                        className="form-control"
                        value={editDosis}
                        onChange={(e) => setEditDosis(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={cerrarEditar}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default Vacunas;
