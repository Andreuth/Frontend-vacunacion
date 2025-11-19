// src/pages/Dashboard.js
import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import PersonaForm from "../components/PersonaForm";

function Dashboard() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPersona, setEditingPersona] = useState(null);
  const [message, setMessage] = useState("");
  const { logout } = useContext(AuthContext);

  const cargarPersonas = () => {
    setLoading(true);
    API.get("/personas/")
      .then((res) => {
        setPersonas(res.data);
      })
      .catch((err) => {
        console.error("Error obteniendo personas", err);
        setMessage("Error cargando personas");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarPersonas();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  // Crear nueva persona
  const handleCreate = async (values) => {
    setMessage("");
    try {
      await API.post("/personas/", {
        nombres: values.nombres,
        apellidos: values.apellidos,
        numero_documento: values.numero_documento,
        rol: values.rol || "usuario",
        password: values.password,
      });
      setMessage("Persona registrada correctamente");
      cargarPersonas();
    } catch (err) {
      console.error("Error creando persona", err);
      setMessage("Error creando persona (¿documento duplicado?)");
    }
  };

  // Guardar edición
  const handleUpdate = async (values) => {
    if (!editingPersona) return;
    setMessage("");
    try {
      await API.put(`/personas/${editingPersona.id_persona}`, {
        nombres: values.nombres,
        apellidos: values.apellidos,
        rol: values.rol,
      });
      setMessage("Persona actualizada correctamente");
      setEditingPersona(null);
      cargarPersonas();
    } catch (err) {
      console.error("Error actualizando persona", err);
      setMessage("Error actualizando persona");
    }
  };

  // Eliminar (desactivar)
  const handleDelete = async (id_persona) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas desactivar esta persona?"
    );
    if (!confirmar) return;

    setMessage("");
    try {
      await API.delete(`/personas/${id_persona}`);
      setMessage("Persona desactivada correctamente");
      cargarPersonas();
    } catch (err) {
      console.error("Error desactivando persona", err);
      setMessage("Error desactivando persona");
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-title">Vacunación</div>
          <div className="sidebar-item active">Personas</div>
          <div className="sidebar-item">Centros de salud</div>
          <div className="sidebar-item">Vacunas</div>
          <div className="sidebar-item">Historial</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div>
            <h1 className="main-title">Panel de Personas</h1>
            <p className="main-subtitle">
              Gestión de usuarios/personas del sistema de vacunación
            </p>
          </div>

          <button className="btn-secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </header>

        {message && (
          <div
            className="card"
            style={{ marginBottom: 14, borderLeft: "4px solid #22c55e" }}
          >
            <p style={{ fontSize: "0.9rem" }}>{message}</p>
          </div>
        )}

        {/* Tarjeta para crear o editar */}
        <section className="card">
          <h2 className="card-title">
            {editingPersona ? "Editar persona" : "Registrar nueva persona"}
          </h2>

          <PersonaForm
            initialValues={editingPersona}
            onSubmit={editingPersona ? handleUpdate : handleCreate}
            onCancel={() => setEditingPersona(null)}
            isEditing={!!editingPersona}
          />
        </section>

        {/* Lista de personas */}
        <section className="card">
          <h2 className="card-title">Personas registradas</h2>

          {loading ? (
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              Cargando...
            </p>
          ) : personas.length === 0 ? (
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              No hay personas registradas.
            </p>
          ) : (
            <ul className="person-list">
              {personas.map((p) => (
                <li key={p.id_persona} className="person-item">
                  <div>
                    <div className="person-name">
                      {p.nombres} {p.apellidos}
                    </div>
                    <div className="person-doc">
                      Documento: {p.numero_documento} · Rol: {p.rol}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => setEditingPersona(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-secondary"
                      style={{
                        fontSize: "0.75rem",
                        background: "#fee2e2",
                        color: "#b91c1c",
                      }}
                      onClick={() => handleDelete(p.id_persona)}
                    >
                      Desactivar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
