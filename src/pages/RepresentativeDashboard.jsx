import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function RepresentativeDashboard() {
  const [children, setChildren] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setError("");
    try {
      const res = await api.get("/children/my");
      setChildren(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Error cargando niños");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const goHistory = (childId) => navigate(`/representative/history/${childId}`);
  const goNext = (childId) => navigate(`/representative/next/${childId}`);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h4 className="mb-3">Mis hijos</h4>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3">
          {children.map((c) => (
            <div className="col-md-6" key={c.id}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    {c.nombres} {c.apellidos}
                  </h5>
                  <p className="card-text mb-2">
                    <strong>Documento:</strong> {c.numero_documento} <br />
                    <strong>Sexo:</strong> {c.sexo} <br />
                    <strong>Nacimiento:</strong> {c.fecha_nacimiento}
                  </p>

                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => goHistory(c.id)}>
                      Historial
                    </button>
                    <button className="btn btn-outline-success btn-sm" onClick={() => goNext(c.id)}>
                      Próximas vacunas
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {children.length === 0 && !error && (
            <div className="text-muted">No tienes niños asociados.</div>
          )}
        </div>
      </div>
    </>
  );
}
