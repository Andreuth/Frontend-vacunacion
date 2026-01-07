import { useEffect, useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

function Dashboard() {
  const { auth } = useContext(AuthContext);

  const [stats, setStats] = useState({
    vacunas: 0,
    centros: 0,
    personas: 0,
    historial: 0,
  });

  const [loading, setLoading] = useState(true);

  const cargarStats = async () => {
    try {
      const [vacunasRes, centrosRes, historialRes] = await Promise.all([
        API.get("/vacunas/"),
        API.get("/centros/"),
        API.get("/historial/"),
      ]);

      let personasCount = 0;
      try {
        const personasRes = await API.get("/personas/");
        personasCount = personasRes.data.length;
      } catch {
        personasCount = 0;
      }

      setStats({
        vacunas: vacunasRes.data.length,
        centros: centrosRes.data.length,
        personas: personasCount,
        historial: historialRes.data.length,
      });
    } catch (err) {
      console.log("Error cargando stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarStats();
  }, []);

  const saludoPorRol = () => {
    if (auth.rol === "admin") return "Administración del sistema";
    if (auth.rol === "medico") return "Gestión clínica y registros";
    if (auth.rol === "padre") return "Consulta y seguimiento";
    return "Bienvenido";
  };

  const right = (
    <span className="badge text-bg-primary px-3 py-2">
      Rol: <span className="fw-semibold">{auth.rol}</span>
    </span>
  );

  return (
    <PageLayout title="Dashboard" subtitle={saludoPorRol()} right={right}>
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">Vacunas</p>
              <h3 className="fw-bold mb-0">{loading ? "..." : stats.vacunas}</h3>
              <Link to="/vacunas" className="btn btn-sm btn-outline-primary mt-3">
                Ver módulo
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">Centros</p>
              <h3 className="fw-bold mb-0">{loading ? "..." : stats.centros}</h3>
              <Link to="/centros" className="btn btn-sm btn-outline-primary mt-3">
                Ver módulo
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">Personas</p>
              <h3 className="fw-bold mb-0">{loading ? "..." : stats.personas}</h3>
              <Link to="/personas" className="btn btn-sm btn-outline-primary mt-3">
                Ver módulo
              </Link>
              {auth.rol === "padre" && (
                <small className="text-muted d-block mt-2">
                  *Tu rol no lista todas las personas.
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">Historial</p>
              <h3 className="fw-bold mb-0">{loading ? "..." : stats.historial}</h3>
              <Link to="/historial" className="btn btn-sm btn-outline-primary mt-3">
                Ver módulo
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold">Acciones rápidas</h5>
              <p className="text-muted">
                Accede a los módulos principales del sistema.
              </p>

              <div className="d-flex flex-wrap gap-2">
                <Link to="/vacunas" className="btn btn-primary">
                  Vacunas
                </Link>
                <Link to="/centros" className="btn btn-outline-primary">
                  Centros
                </Link>
                <Link to="/historial" className="btn btn-outline-primary">
                  Historial
                </Link>

                {(auth.rol === "admin" || auth.rol === "medico") && (
                  <Link to="/personas" className="btn btn-outline-dark">
                    Personas
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-2">Estado del sistema</h6>
              <div className="alert alert-success py-2 mb-0" role="alert">
                ✅ Conectado y funcionando
              </div>
              <small className="text-muted d-block mt-2">
                *Datos desde rutas protegidas.
              </small>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default Dashboard;
