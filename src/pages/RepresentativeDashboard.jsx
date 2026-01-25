import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";

export default function RepresentativeDashboard() {
  const [children, setChildren] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/children/my");
      setChildren(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo cargar tus hijos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Panel REPRESENTANTE">
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="bg-white shadow-sm p-3 mb-3" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="fw-bold">Mis hijos</div>
            <div className="text-muted small">Consulta próximas vacunas e historial, y descarga la cartilla.</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => navigate("/children/register")}>
              + Registrar niño
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>
              Recargar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm p-3" style={{ borderRadius: 16 }}>
        {loading ? (
          <div className="text-muted">Cargando...</div>
        ) : (
          <DataTable
            rows={children}
            searchPlaceholder="Buscar por nombre..."
            columns={[
              { key: "id", header: "ID" },
              { key: "nombres", header: "Nombres" },
              { key: "apellidos", header: "Apellidos" },
              { key: "fecha_nacimiento", header: "Nacimiento" },
              {
                key: "actions",
                header: "Acciones",
                render: (r) => (
                  <div className="d-flex gap-2">
                    <Link className="btn btn-sm btn-outline-primary" to={`/children/${r.id}/next-vaccines`}>
                      Próximas
                    </Link>
                    <Link className="btn btn-sm btn-outline-secondary" to={`/children/${r.id}/history`}>
                      Cartilla/Historial
                    </Link>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </AppLayout>
  );
}
