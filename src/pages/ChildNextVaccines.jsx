import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";

export default function ChildNextVaccines() {
  const { childId } = useParams();
  const [rows, setRows] = useState([]);
  const [child, setChild] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const badge = (estado) => {
    const e = String(estado || "").toUpperCase();
    const cls =
      e === "ATRASADA" ? "badge bg-danger" :
      e === "PENDIENTE" ? "badge bg-warning text-dark" :
      e === "APLICADA" ? "badge bg-success" :
      "badge bg-secondary";
    return <span className={cls}>{e || "—"}</span>;
  };


  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      // Intentamos obtener el niño desde /children/ para mostrar encabezado
      const [next, allChildren] = await Promise.all([
        api.get(`/children/${childId}/next-vaccines`),
        api.get("/children/"),
      ]);
      setRows(next.data?.items || next.data || []);
      const found = (allChildren.data || []).find((c) => String(c.id) === String(childId));
      setChild(found || null);
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo cargar próximas vacunas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [childId]);

  return (
    <AppLayout title="Próximas vacunas">
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="bg-white shadow-sm p-3 mb-3" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="fw-bold">{child ? `${child.nombres} ${child.apellidos}` : `Niño #${childId}`}</div>
            <div className="text-muted small">Próximas dosis recomendadas según el esquema.</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>
              Recargar
            </button>
            <Link className="btn btn-outline-primary btn-sm" to={`/children/${childId}/history`}>
              Ver cartilla
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm p-3" style={{ borderRadius: 16 }}>
        {loading ? (
          <div className="text-muted">Cargando...</div>
        ) : (
          <DataTablele
            rows={rows}
            searchPlaceholder="Buscar..."
            columns={[
              { key: "vaccine_nombre", header: "Vacuna" },
              { key: "dosis_numero", header: "Dosis" },
              { key: "edad_objetivo_meses", header: "Edad objetivo (m)" },
              { key: "intervalo_min_dias", header: "Intervalo (d)" },
              { key: "status", header: "Estado" },
            ]}
          />
        )}
        <div className="text-muted small mt-2">
          Si el backend devuelve otros nombres de campos, dime el JSON de una fila y ajustamos el frontend rápido.
        </div>
      </div>
    </AppLayout>
  );
}
