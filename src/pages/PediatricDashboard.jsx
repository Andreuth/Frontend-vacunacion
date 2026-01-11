import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function PediatricDashboard() {
  // Registro rápido
  const [reg, setReg] = useState({
    representante: { nombres: "", apellidos: "", numero_documento: "", password: "" },
    nino: { nombres: "", apellidos: "", numero_documento: "", fecha_nacimiento: "", sexo: "M" },
    parentesco: "madre",
    es_principal: true,
  });
  const [regMsg, setRegMsg] = useState("");

  // Para visita y aplicación
  const [children, setChildren] = useState([]);
  const [scheduleFull, setScheduleFull] = useState([]);   // 🔥 antes vaccinesSchedule
  const [visitMsg, setVisitMsg] = useState("");
  const [applyMsg, setApplyMsg] = useState("");

  const [visitForm, setVisitForm] = useState({
    child_id: "",
    fecha_atencion: "",
    peso_kg: "",
    talla_cm: "",
    observaciones: "",
  });

  const [applyForm, setApplyForm] = useState({
    visit_id: "",
    schedule_id: "",
    fecha_aplicacion: "",
    lote: "",
    proxima_fecha: "",
  });

  // ==========================
  // Cargar niños + esquema FULL
  // ==========================
  const load = async () => {
    try {
      const [c, s] = await Promise.all([
        api.get("/children"),
        api.get("/vaccines/schedule/full"),   // 🔥 endpoint nuevo
      ]);
      setChildren(c.data);
      setScheduleFull(s.data);               // 🔥 antes setVaccinesSchedule
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ==========================
  // Registro rápido
  // ==========================
  const registerChild = async (e) => {
    e.preventDefault();
    setRegMsg("");
    try {
      const res = await api.post("/children/register", reg);
      setRegMsg(`✅ Registrado: representante_id=${res.data.representante_id}, nino_id=${res.data.nino_id}`);
      await load();
    } catch (e) {
      setRegMsg(e?.response?.data?.detail || "Error en registro rápido");
    }
  };

  // ==========================
  // Crear visita
  // ==========================
  const createVisit = async (e) => {
    e.preventDefault();
    setVisitMsg("");
    try {
      const payload = {
        ...visitForm,
        child_id: Number(visitForm.child_id),
        peso_kg: Number(visitForm.peso_kg),
        talla_cm: Number(visitForm.talla_cm),
      };
      const res = await api.post("/visits", payload);
      setVisitMsg(`✅ Visita creada. ID=${res.data.id}`);
      setApplyForm({ ...applyForm, visit_id: String(res.data.id) });
    } catch (e) {
      setVisitMsg(e?.response?.data?.detail || "Error creando visita");
    }
  };

  // ==========================
  // Aplicar vacuna
  // ==========================
  const applyVaccine = async (e) => {
    e.preventDefault();
    setApplyMsg("");
    try {
      const payload = {
        schedule_id: Number(applyForm.schedule_id),
        fecha_aplicacion: applyForm.fecha_aplicacion,
        lote: applyForm.lote || null,
        proxima_fecha: applyForm.proxima_fecha || null,
      };
      const res = await api.post(`/visits/${applyForm.visit_id}/apply`, payload);
      setApplyMsg(`✅ Vacuna aplicada. ID=${res.data.id}`);
    } catch (e) {
      setApplyMsg(e?.response?.data?.detail || "Error aplicando vacuna");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h4 className="mb-3">Panel PEDIATRA</h4>

        {/* ==========================
            Registro rápido
        ========================== */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5>Registro rápido (Representante + Niño)</h5>
            {regMsg && <div className="alert alert-info py-2">{regMsg}</div>}

            <form className="row g-2" onSubmit={registerChild}>
              <div className="col-12"><strong>Representante</strong></div>

              <div className="col-md-3">
                <input className="form-control" placeholder="Nombres"
                  value={reg.representante.nombres}
                  onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, nombres: e.target.value } })}
                  required />
              </div>
              <div className="col-md-3">
                <input className="form-control" placeholder="Apellidos"
                  value={reg.representante.apellidos}
                  onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, apellidos: e.target.value } })}
                  required />
              </div>
              <div className="col-md-3">
                <input className="form-control" placeholder="Documento"
                  value={reg.representante.numero_documento}
                  onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, numero_documento: e.target.value } })}
                  required />
              </div>
              <div className="col-md-3">
                <input type="password" className="form-control" placeholder="Password"
                  value={reg.representante.password}
                  onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, password: e.target.value } })}
                  required />
              </div>

              <div className="col-12 mt-2"><strong>Niño</strong></div>

              <div className="col-md-3">
                <input className="form-control" placeholder="Nombres"
                  value={reg.nino.nombres}
                  onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, nombres: e.target.value } })}
                  required />
              </div>
              <div className="col-md-3">
                <input className="form-control" placeholder="Apellidos"
                  value={reg.nino.apellidos}
                  onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, apellidos: e.target.value } })}
                  required />
              </div>
              <div className="col-md-3">
                <input className="form-control" placeholder="Documento"
                  value={reg.nino.numero_documento}
                  onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, numero_documento: e.target.value } })}
                  required />
              </div>
              <div className="col-md-2">
                <input type="date" className="form-control"
                  value={reg.nino.fecha_nacimiento}
                  onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, fecha_nacimiento: e.target.value } })}
                  required />
              </div>
              <div className="col-md-1">
                <select className="form-select"
                  value={reg.nino.sexo}
                  onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, sexo: e.target.value } })}
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div className="col-md-3">
                <input className="form-control" placeholder="Parentesco (madre/padre/tutor)"
                  value={reg.parentesco}
                  onChange={(e) => setReg({ ...reg, parentesco: e.target.value })}
                  required />
              </div>

              <div className="col-12">
                <button className="btn btn-primary btn-sm">Registrar</button>
              </div>
            </form>
          </div>
        </div>

        {/* ==========================
            Crear visita
        ========================== */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5>Crear visita (peso/talla)</h5>
            {visitMsg && <div className="alert alert-info py-2">{visitMsg}</div>}

            <form className="row g-2" onSubmit={createVisit}>
              <div className="col-md-4">
                <select className="form-select" value={visitForm.child_id}
                  onChange={(e) => setVisitForm({ ...visitForm, child_id: e.target.value })} required>
                  <option value="">Seleccione niño...</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellidos} - {c.numero_documento}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <input type="date" className="form-control" value={visitForm.fecha_atencion}
                  onChange={(e) => setVisitForm({ ...visitForm, fecha_atencion: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <input className="form-control" placeholder="Peso (kg)" value={visitForm.peso_kg}
                  onChange={(e) => setVisitForm({ ...visitForm, peso_kg: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <input className="form-control" placeholder="Talla (cm)" value={visitForm.talla_cm}
                  onChange={(e) => setVisitForm({ ...visitForm, talla_cm: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <button className="btn btn-success btn-sm w-100">Crear visita</button>
              </div>
              <div className="col-12">
                <input className="form-control" placeholder="Observaciones"
                  value={visitForm.observaciones}
                  onChange={(e) => setVisitForm({ ...visitForm, observaciones: e.target.value })} />
              </div>
            </form>
          </div>
        </div>

        {/* ==========================
            Aplicar vacuna
        ========================== */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h5>Aplicar vacuna (a una visita)</h5>
            {applyMsg && <div className="alert alert-info py-2">{applyMsg}</div>}

            <form className="row g-2" onSubmit={applyVaccine}>
              <div className="col-md-2">
                <input className="form-control" placeholder="Visit ID" value={applyForm.visit_id}
                  onChange={(e) => setApplyForm({ ...applyForm, visit_id: e.target.value })} required />
              </div>

              <div className="col-md-4">
                <select className="form-select" value={applyForm.schedule_id}
                  onChange={(e) => setApplyForm({ ...applyForm, schedule_id: e.target.value })} required>
                  <option value="">Seleccione dosis...</option>

                  {/* 🔥 Ahora se muestra nombre de vacuna + dosis */}
                  {scheduleFull.map((s) => (
                    <option key={s.schedule_id} value={s.schedule_id}>
                      {s.vaccine_nombre} — Dosis {s.dosis_numero} — {s.edad_objetivo_meses} meses
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <input type="date" className="form-control" value={applyForm.fecha_aplicacion}
                  onChange={(e) => setApplyForm({ ...applyForm, fecha_aplicacion: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <input className="form-control" placeholder="Lote (opcional)" value={applyForm.lote}
                  onChange={(e) => setApplyForm({ ...applyForm, lote: e.target.value })} />
              </div>
              <div className="col-md-2">
                <input type="date" className="form-control" placeholder="Próxima fecha (opcional)"
                  value={applyForm.proxima_fecha}
                  onChange={(e) => setApplyForm({ ...applyForm, proxima_fecha: e.target.value })} />
              </div>

              <div className="col-12">
                <button className="btn btn-primary btn-sm">Aplicar vacuna</button>
              </div>
            </form>

            <div className="text-muted mt-2" style={{ fontSize: 13 }}>
              Tip: al crear visita te aparece el Visit ID en el mensaje.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
