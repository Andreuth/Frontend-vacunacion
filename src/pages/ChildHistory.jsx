import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function ChildHistory() {
  const { childId } = useParams();
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const res = await api.get(`/visits/history/${childId}/full`);
        setData(res.data);
      } catch (e) {
        setError(e?.response?.data?.detail || "Error cargando historial");
      }
    })();
  }, [childId]);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Historial</h4>
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

        {data.map((item, idx) => (
          <div className="card shadow-sm mb-3" key={idx}>
            <div className="card-body">
              <h6 className="mb-2">
                Visita: {item.visit.fecha_atencion} | Peso: {item.visit.peso_kg} kg | Talla: {item.visit.talla_cm} cm
              </h6>
              {item.visit.observaciones && <p className="text-muted">{item.visit.observaciones}</p>}

              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Vacuna</th>
                      <th>Dosis</th>
                      <th>Fecha</th>
                      <th>Lote</th>
                      <th>Próxima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.applications.map((a) => (
                      <tr key={a.application_id}>
                        <td>{a.vaccine_nombre}</td>
                        <td>{a.dosis_numero}</td>
                        <td>{a.fecha_aplicacion}</td>
                        <td>{a.lote || "-"}</td>
                        <td>{a.proxima_fecha || "-"}</td>
                      </tr>
                    ))}
                    {item.applications.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-muted">
                          Sin vacunas registradas en esta visita.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && !error && <div className="text-muted">Sin historial aún.</div>}
      </div>
    </>
  );
}
