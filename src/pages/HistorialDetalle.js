import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import PageLayout from "../components/PageLayout";

function HistorialDetalle() {
  const { auth } = useContext(AuthContext);
  const canEdit = auth.rol === "admin" || auth.rol === "medico";

  const { id_historial } = useParams();

  const [detalle, setDetalle] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    id_vacuna: "",
    lote: "",
    dosis_numero: "",
    fecha_proxima: "",
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

  const cargar = async () => {
    setLoading(true);
    try {
      const [dRes, vRes] = await Promise.all([
        // 👇 ajusta la ruta del backend si es diferente
        API.get(`/detalle-historial/${id_historial}`),
        API.get("/vacunas/"),
      ]);
      setDetalle(dRes.data);
      setVacunas(vRes.data);
    } catch (e) {
      showMsg("danger", "No se pudo cargar detalle.");
      setDetalle([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id_historial]);

  const crearDetalle = async (e) => {
    e.preventDefault();
    try {
      await API.post("/detalle-historial/", {
        id_historial: parseInt(id_historial),
        id_vacuna: parseInt(form.id_vacuna),
        lote: form.lote || null,
        dosis_numero: form.dosis_numero ? parseInt(form.dosis_numero) : null,
        fecha_proxima: form.fecha_proxima || null,
      });
      showMsg("success", "Detalle agregado.");
      setForm({ id_vacuna: "", lote: "", dosis_numero: "", fecha_proxima: "" });
      cargar();
    } catch {
      showMsg("danger", "No se pudo agregar detalle.");
    }
  };

  const eliminarDetalle = async (id_detalle) => {
    if (!window.confirm("¿Eliminar detalle?")) return;
    try {
      await API.delete(`/detalle-historial/item/${id_detalle}`);
      showMsg("success", "Detalle eliminado.");
      cargar();
    } catch {
      showMsg("danger", "No se pudo eliminar.");
    }
  };

  const right = (
    <div className="d-flex gap-2 align-items-center">
      <span className="badge text-bg-primary px-3 py-2">
        Historial: <span className="fw-semibold">#{id_historial}</span>
      </span>
      <Link to="/historial" className="btn btn-sm btn-outline-secondary">
        Volver
      </Link>
    </div>
  );

  return (
    <PageLayout
      title="Detalle de Historial"
      subtitle="detalle_historial_vacuna"
      right={right}
    >
      {msg.text && (
        <div className={`alert alert-${msg.type} py-2`} role="alert">
          {msg.text}
        </div>
      )}

      {canEdit && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Agregar vacuna aplicada</h5>

            <form onSubmit={crearDetalle} className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Vacuna *</label>
                <select
                  className="form-select"
                  name="id_vacuna"
                  value={form.id_vacuna}
                  onChange={onChange}
                  required
                >
                  <option value="">Seleccione...</option>
                  {vacunas.map((v) => (
                    <option key={v.id_vacuna} value={v.id_vacuna}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Lote</label>
                <input
                  className="form-control"
                  name="lote"
                  value={form.lote}
                  onChange={onChange}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Dosis #</label>
                <input
                  className="form-control"
                  name="dosis_numero"
                  value={form.dosis_numero}
                  onChange={onChange}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Fecha próxima</label>
                <input
                  type="date"
                  className="form-control"
                  name="fecha_proxima"
                  value={form.fecha_proxima}
                  onChange={onChange}
                />
              </div>

              <div className="col-12">
                <button className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-muted">Cargando...</div>
      ) : detalle.length === 0 ? (
        <div className="alert alert-warning py-2">Sin detalle registrado.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Vacuna</th>
                <th>Lote</th>
                <th>Dosis</th>
                <th>Próxima</th>
                <th style={{ width: 140 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {detalle.map((d) => (
                <tr key={d.id_detalle}>
                  <td>{d.id_detalle}</td>
                  <td>
                    <span className="badge text-bg-primary">#{d.id_vacuna}</span>
                  </td>
                  <td>{d.lote || "—"}</td>
                  <td>{d.dosis_numero ?? "—"}</td>
                  <td>{d.fecha_proxima || "—"}</td>
                  <td>
                    {canEdit ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => eliminarDetalle(d.id_detalle)}
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
        </div>
      )}
    </PageLayout>
  );
}

export default HistorialDetalle;
