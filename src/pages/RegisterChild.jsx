import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AppLayout from "../components/AppLayout";

export default function RegisterChild() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    numero_documento: "",
    fecha_nacimiento: "",
    sexo: "M",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      await api.post("/children/register", form);
      setMsg("Niño registrado correctamente.");
      setTimeout(() => nav("/representative"), 600);
    } catch (e) {
      setErr(e?.response?.data?.detail || "No se pudo registrar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Registrar niño">
      {err && <div className="alert alert-danger">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="bg-white shadow-sm p-3" style={{ borderRadius: 16, maxWidth: 720 }}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Nombres</label>
            <input className="form-control" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Apellidos</label>
            <input className="form-control" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Número de documento</label>
            <input className="form-control" value={form.numero_documento} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })} />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label">Sexo</label>
            <select className="form-select" value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label">Nacimiento</label>
            <input type="date" className="form-control" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
          </div>

          <div className="col-12 d-flex gap-2 mt-2">
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? "Guardando..." : "Registrar"}
            </button>
            <button className="btn btn-outline-secondary" onClick={() => nav(-1)}>
              Volver
            </button>
          </div>
        </div>

        <div className="text-muted small mt-3">
          Si el backend usa otros nombres de campos (por ejemplo <code>cedula</code> o <code>fechaNacimiento</code>), dime el error exacto y lo ajusto.
        </div>
      </div>
    </AppLayout>
  );
}
