import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function ChildNextVaccines() {
  const { childId } = useParams();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const res = await api.get(`/children/${childId}/next-vaccines`);
        setItems(res.data.items || []);
      } catch (e) {
        setError(e?.response?.data?.detail || "Error cargando próximas vacunas");
      }
    })();
  }, [childId]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Próximas vacunas</h4>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
              Imprimir
            </button>
            <Link className="btn btn-outline-dark btn-sm" to="/representative">
              Volver
            </Link>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>Vacuna</th>
                    <th>Dosis</th>
                    <th>Edad objetivo (meses)</th>
                    <th>Fecha recomendada</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((x) => (
                    <tr key={x.schedule_id}>
                      <td>{x.vaccine_nombre}</td>
                      <td>{x.dosis_numero}</td>
                      <td>{x.edad_objetivo_meses}</td>
                      <td>{x.fecha_recomendada}</td>
                      <td>
                        <span className={`badge ${x.estado === "ATRASADA" ? "text-bg-danger" : "text-bg-success"}`}>
                          {x.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && !error && (
                    <tr>
                      <td colSpan="5" className="text-muted">
                        No hay vacunas pendientes 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
