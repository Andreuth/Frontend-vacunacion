import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

/* ===================== Helpers ===================== */
function fmtDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

function BadgeEstado({ estado }) {
  const isLate = estado === "ATRASADA";
  const cls = isLate ? "text-bg-danger" : "text-bg-success";
  return <span className={`badge ${cls}`}>{estado}</span>;
}

function Section({ title, subtitle, children, right }) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
          <div>
            <h5 className="mb-0">{title}</h5>
            {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
          </div>
          {right}
        </div>
        <hr className="my-3" />
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="col-md-3 col-sm-6">
      <div className="border rounded-3 p-3 h-100 bg-white">
        <div className="text-muted small">{label}</div>
        <div className="fs-4 fw-semibold">{value}</div>
        {hint && <div className="text-muted small mt-1">{hint}</div>}
      </div>
    </div>
  );
}

// sort
function sortBy(items, key, dir = "asc") {
  const s = [...items].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];

    // números
    if (typeof av === "number" && typeof bv === "number") return av - bv;

    // fallback string
    return String(av ?? "").localeCompare(String(bv ?? ""), "es", { sensitivity: "base" });
  });
  return dir === "desc" ? s.reverse() : s;
}

// paginación
function paginate(items, page, pageSize) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * pageSize;
  return { page: p, pages, total, slice: items.slice(start, start + pageSize) };
}

function Pager({ meta, setPage }) {
  if (!meta) return null;
  const { page, pages, total } = meta;

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2">
      <div className="text-muted small">
        Total: <strong>{total}</strong> • Página <strong>{page}</strong> / {pages}
      </div>

      <div className="btn-group">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setPage(1)} disabled={page === 1}>
          «
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
          ‹
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setPage(page + 1)} disabled={page === pages}>
          ›
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setPage(pages)} disabled={page === pages}>
          »
        </button>
      </div>
    </div>
  );
}

// CSV export
function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// copy helper
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(String(text));
    return true;
  } catch {
    return false;
  }
}

/* ===================== Component ===================== */
export default function AdminDashboard() {
  const [tab, setTab] = useState("ADMIN"); // ADMIN | PEDIATRA | REPRESENTANTE

  // Global UI
  const [loading, setLoading] = useState(false);
  const [globalMsg, setGlobalMsg] = useState({ type: "", text: "" }); // success|info|danger

  // ===== ADMIN: USERS =====
  const [users, setUsers] = useState([]);
  const [uForm, setUForm] = useState({
    nombres: "",
    apellidos: "",
    numero_documento: "",
    rol: "REPRESENTANTE",
    password: "",
  });
  const [uMsg, setUMsg] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL"); // ALL|ADMIN|PEDIATRA|REPRESENTANTE
  const [userSort, setUserSort] = useState({ key: "id", dir: "desc" });
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  // ===== ADMIN: VACCINES + SCHEDULE =====
  const [vaccines, setVaccines] = useState([]);
  const [vForm, setVForm] = useState({ nombre: "", descripcion: "" });
  const [vMsg, setVMsg] = useState("");
  const [vaccineQuery, setVaccineQuery] = useState("");
  const [vaccinePage, setVaccinePage] = useState(1);
  const [vaccinePageSize, setVaccinePageSize] = useState(10);

  const [scheduleFull, setScheduleFull] = useState([]);
  const [sForm, setSForm] = useState({ vaccine_id: "", dosis_numero: 1, edad_objetivo_meses: 0, intervalo_min_dias: "" });
  const [sMsg, setSMsg] = useState("");
  const [scheduleQuery, setScheduleQuery] = useState("");
  const [scheduleVaccineFilter, setScheduleVaccineFilter] = useState("ALL"); // vacuna por nombre
  const [scheduleSort, setScheduleSort] = useState({ key: "vaccine_nombre", dir: "asc" });
  const [schedulePage, setSchedulePage] = useState(1);
  const [schedulePageSize, setSchedulePageSize] = useState(10);

  // ===== PEDIATRA =====
  const [children, setChildren] = useState([]);
  const [reg, setReg] = useState({
    representante: { nombres: "", apellidos: "", numero_documento: "", password: "" },
    nino: { nombres: "", apellidos: "", numero_documento: "", fecha_nacimiento: "", sexo: "M" },
    parentesco: "madre",
    es_principal: true,
  });
  const [regMsg, setRegMsg] = useState("");

  const [visitForm, setVisitForm] = useState({ child_id: "", fecha_atencion: "", peso_kg: "", talla_cm: "", observaciones: "" });
  const [visitMsg, setVisitMsg] = useState("");

  const [applyForm, setApplyForm] = useState({ visit_id: "", schedule_id: "", fecha_aplicacion: "", lote: "", proxima_fecha: "" });
  const [applyMsg, setApplyMsg] = useState("");

  // ===== REPRESENTANTE =====
  const [selectedChildId, setSelectedChildId] = useState("");
  const [history, setHistory] = useState([]);
  const [nextItems, setNextItems] = useState([]);
  const [repMsg, setRepMsg] = useState("");

  // extra funcionalidad en representante
  const [nextOnlyLate, setNextOnlyLate] = useState(false);
  const [nextQuery, setNextQuery] = useState("");
  const [nextPage, setNextPage] = useState(1);
  const [nextPageSize, setNextPageSize] = useState(10);

  const [histQuery, setHistQuery] = useState("");
  const [histPage, setHistPage] = useState(1);
  const [histPageSize, setHistPageSize] = useState(5);

  const notify = (type, text) => {
    setGlobalMsg({ type, text });
    if (text) {
      window.clearTimeout(notify._t);
      notify._t = window.setTimeout(() => setGlobalMsg({ type: "", text: "" }), 4500);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setGlobalMsg({ type: "", text: "" });
    try {
      const [u, v, sch, c] = await Promise.all([
        api.get("/users"),
        api.get("/vaccines"),
        api.get("/vaccines/schedule/full"),
        api.get("/children"),
      ]);
      setUsers(u.data || []);
      setVaccines(v.data || []);
      setScheduleFull(sch.data || []);
      setChildren(c.data || []);
    } catch (e) {
      console.log(e);
      notify("danger", e?.response?.data?.detail || "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ===================== ADMIN: Computed (Filter + Sort + Pagination) ===================== */
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    let list = users;

    if (userRoleFilter !== "ALL") list = list.filter((u) => u.rol === userRoleFilter);

    if (q) {
      list = list.filter((u) => {
        const s = `${u.id} ${u.numero_documento} ${u.nombres} ${u.apellidos} ${u.rol}`.toLowerCase();
        return s.includes(q);
      });
    }

    // sort
    list = sortBy(list, userSort.key, userSort.dir);
    return list;
  }, [users, userQuery, userRoleFilter, userSort]);

  const usersPageMeta = useMemo(() => paginate(filteredUsers, userPage, userPageSize), [filteredUsers, userPage, userPageSize]);

  useEffect(() => {
    // reset page cuando cambia filtro
    setUserPage(1);
  }, [userQuery, userRoleFilter, userPageSize]);

  const filteredVaccines = useMemo(() => {
    const q = vaccineQuery.trim().toLowerCase();
    if (!q) return vaccines;
    return vaccines.filter((v) => `${v.id} ${v.nombre} ${v.descripcion || ""}`.toLowerCase().includes(q));
  }, [vaccines, vaccineQuery]);

  const vaccinesPageMeta = useMemo(() => paginate(filteredVaccines, vaccinePage, vaccinePageSize), [filteredVaccines, vaccinePage, vaccinePageSize]);

  useEffect(() => {
    setVaccinePage(1);
  }, [vaccineQuery, vaccinePageSize]);

  const filteredSchedule = useMemo(() => {
    const q = scheduleQuery.trim().toLowerCase();
    let list = scheduleFull;

    if (scheduleVaccineFilter !== "ALL") list = list.filter((s) => s.vaccine_nombre === scheduleVaccineFilter);

    if (q) {
      list = list.filter((s) => {
        const str = `${s.vaccine_nombre} ${s.dosis_numero} ${s.edad_objetivo_meses} ${s.intervalo_min_dias ?? ""} ${s.schedule_id}`.toLowerCase();
        return str.includes(q);
      });
    }

    list = sortBy(list, scheduleSort.key, scheduleSort.dir);
    return list;
  }, [scheduleFull, scheduleQuery, scheduleVaccineFilter, scheduleSort]);

  const schedulePageMeta = useMemo(() => paginate(filteredSchedule, schedulePage, schedulePageSize), [filteredSchedule, schedulePage, schedulePageSize]);

  useEffect(() => {
    setSchedulePage(1);
  }, [scheduleQuery, scheduleVaccineFilter, schedulePageSize]);

  /* ===================== REPRESENTANTE: Computed ===================== */
  const nextFiltered = useMemo(() => {
    let list = nextItems;
    if (nextOnlyLate) list = list.filter((x) => x.estado === "ATRASADA");

    const q = nextQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((x) => {
        const s = `${x.vaccine_nombre} ${x.dosis_numero} ${x.edad_objetivo_meses} ${x.fecha_recomendada} ${x.estado}`.toLowerCase();
        return s.includes(q);
      });
    }
    return list;
  }, [nextItems, nextOnlyLate, nextQuery]);

  const nextMeta = useMemo(() => paginate(nextFiltered, nextPage, nextPageSize), [nextFiltered, nextPage, nextPageSize]);

  useEffect(() => setNextPage(1), [nextOnlyLate, nextQuery, nextPageSize]);

  // Historial: filtro por texto (vacuna, obs, fecha)
  const historyFiltered = useMemo(() => {
    const q = histQuery.trim().toLowerCase();
    if (!q) return history;

    return history.filter((item) => {
      const visitStr = `${item.visit?.fecha_atencion} ${item.visit?.observaciones || ""} ${item.visit?.peso_kg} ${item.visit?.talla_cm}`.toLowerCase();
      const appsStr = (item.applications || [])
        .map((a) => `${a.vaccine_nombre} ${a.dosis_numero} ${a.fecha_aplicacion} ${a.lote || ""} ${a.proxima_fecha || ""}`.toLowerCase())
        .join(" | ");
      return (visitStr + " " + appsStr).includes(q);
    });
  }, [history, histQuery]);

  const histMeta = useMemo(() => paginate(historyFiltered, histPage, histPageSize), [historyFiltered, histPage, histPageSize]);

  useEffect(() => setHistPage(1), [histQuery, histPageSize]);

  /* ===================== Actions ===================== */
  const createUser = async (e) => {
    e.preventDefault();
    setUMsg("");
    try {
      const res = await api.post("/users/", uForm);
      setUMsg("✅ Usuario creado");
      notify("success", "Usuario creado correctamente.");
      setUForm({ nombres: "", apellidos: "", numero_documento: "", rol: "REPRESENTANTE", password: "" });
      setUsers((prev) => [res.data, ...prev]);
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando usuario";
      setUMsg(msg);
      notify("danger", msg);
    }
  };

  const createVaccine = async (e) => {
    e.preventDefault();
    setVMsg("");
    try {
      const res = await api.post("/vaccines/", vForm);
      setVMsg("✅ Vacuna creada");
      notify("success", "Vacuna creada correctamente.");
      setVForm({ nombre: "", descripcion: "" });
      setVaccines((prev) => [res.data, ...prev]);
      await loadAll();
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando vacuna";
      setVMsg(msg);
      notify("danger", msg);
    }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    setSMsg("");
    try {
      const payload = {
        vaccine_id: Number(sForm.vaccine_id),
        dosis_numero: Number(sForm.dosis_numero),
        edad_objetivo_meses: Number(sForm.edad_objetivo_meses),
        intervalo_min_dias: sForm.intervalo_min_dias === "" ? null : Number(sForm.intervalo_min_dias),
      };
      await api.post("/vaccines/schedule/", payload);
      setSMsg("✅ Dosis agregada al esquema");
      notify("success", "Dosis agregada al esquema.");
      setSForm((p) => ({ ...p, dosis_numero: 1, edad_objetivo_meses: 0, intervalo_min_dias: "" }));
      await loadAll();
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando esquema";
      setSMsg(msg);
      notify("danger", msg);
    }
  };

  const registerChild = async (e) => {
    e.preventDefault();
    setRegMsg("");
    try {
      const res = await api.post("/children/register/", reg);
      setRegMsg(`✅ Registrado: representante_id=${res.data.representante_id}, nino_id=${res.data.nino_id}`);
      notify("success", "Registro rápido completado.");
      await loadAll();
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error en registro rápido";
      setRegMsg(msg);
      notify("danger", msg);
    }
  };

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
      const res = await api.post("/visits/", payload);
      setVisitMsg(`✅ Visita creada. ID=${res.data.id}`);
      notify("success", `Visita creada (ID ${res.data.id}).`);

      // setea por defecto fecha de aplicación "hoy"
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      setApplyForm((p) => ({ ...p, visit_id: String(res.data.id), fecha_aplicacion: p.fecha_aplicacion || iso }));
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error creando visita";
      setVisitMsg(msg);
      notify("danger", msg);
    }
  };

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
      notify("success", "Vacuna aplicada correctamente.");
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error aplicando vacuna";
      setApplyMsg(msg);
      notify("danger", msg);
    }
  };

  const loadHistoryAndNext = async () => {
    if (!selectedChildId) return;
    setRepMsg("");
    setLoading(true);
    try {
      const [h, n] = await Promise.all([
        api.get(`/visits/history/${selectedChildId}/full`),
        api.get(`/children/${selectedChildId}/next-vaccines`),
      ]);
      setHistory(h.data || []);
      setNextItems(n.data?.items || []);
      notify("info", "Información cargada.");
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Error consultando historial/próximas";
      setRepMsg(msg);
      notify("danger", msg);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== KPI ===================== */
  const stats = useMemo(() => {
    const lateCount = nextItems.filter((x) => x.estado === "ATRASADA").length;
    return {
      users: users.length,
      vaccines: vaccines.length,
      schedule: scheduleFull.length,
      children: children.length,
      nextLate: lateCount,
    };
  }, [users, vaccines, scheduleFull, children, nextItems]);

  /* ===================== Exports ===================== */
  const exportUsers = () => {
    const rows = filteredUsers.map((u) => ({
      id: u.id,
      numero_documento: u.numero_documento,
      nombres: u.nombres,
      apellidos: u.apellidos,
      rol: u.rol,
    }));
    downloadCSV("usuarios.csv", rows);
  };

  const exportVaccines = () => {
    const rows = filteredVaccines.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      descripcion: v.descripcion || "",
    }));
    downloadCSV("vacunas.csv", rows);
  };

  const exportSchedule = () => {
    const rows = filteredSchedule.map((s) => ({
      schedule_id: s.schedule_id,
      vacuna: s.vaccine_nombre,
      dosis_numero: s.dosis_numero,
      edad_objetivo_meses: s.edad_objetivo_meses,
      intervalo_min_dias: s.intervalo_min_dias ?? "",
    }));
    downloadCSV("esquema.csv", rows);
  };

  const exportNext = () => {
    const rows = nextFiltered.map((x) => ({
      vacuna: x.vaccine_nombre,
      dosis: x.dosis_numero,
      edad_meses: x.edad_objetivo_meses,
      fecha_recomendada: x.fecha_recomendada,
      estado: x.estado,
      dias_diferencia: x.dias_diferencia ?? "",
    }));
    downloadCSV("proximas_vacunas.csv", rows);
  };

  const exportHistory = () => {
    // aplanado
    const rows = [];
    for (const item of historyFiltered) {
      if (!item?.applications || item.applications.length === 0) {
        rows.push({
          fecha_visita: item.visit?.fecha_atencion,
          peso_kg: item.visit?.peso_kg,
          talla_cm: item.visit?.talla_cm,
          observaciones: item.visit?.observaciones || "",
          vacuna: "",
          dosis: "",
          fecha_aplicacion: "",
          lote: "",
          proxima_fecha: "",
        });
      } else {
        for (const a of item.applications) {
          rows.push({
            fecha_visita: item.visit?.fecha_atencion,
            peso_kg: item.visit?.peso_kg,
            talla_cm: item.visit?.talla_cm,
            observaciones: item.visit?.observaciones || "",
            vacuna: a.vaccine_nombre,
            dosis: a.dosis_numero,
            fecha_aplicacion: a.fecha_aplicacion,
            lote: a.lote || "",
            proxima_fecha: a.proxima_fecha || "",
          });
        }
      }
    }
    downloadCSV("historial.csv", rows);
  };

  /* ===================== Render ===================== */
  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h4 className="mb-0">Panel Administrativo</h4>
            <div className="text-muted small">Gestión de usuarios, vacunas, esquema, visitas e historial.</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={loadAll} disabled={loading}>
              {loading ? "Cargando..." : "Refrescar"}
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="row g-3 mb-3">
          <StatCard label="Usuarios" value={stats.users} hint="Total registrados" />
          <StatCard label="Niños" value={stats.children} hint="Pacientes pediátricos" />
          <StatCard label="Vacunas" value={stats.vaccines} hint="Catálogo" />
          <StatCard label="Dosis en esquema" value={stats.schedule} hint="Schedule completo" />
        </div>

        {globalMsg.text && <div className={`alert alert-${globalMsg.type} py-2`}>{globalMsg.text}</div>}

        {/* Tabs */}
        <ul className="nav nav-pills mb-3 gap-2">
          <li className="nav-item">
            <button className={`nav-link ${tab === "ADMIN" ? "active" : ""}`} onClick={() => setTab("ADMIN")}>
              ADMIN
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "PEDIATRA" ? "active" : ""}`} onClick={() => setTab("PEDIATRA")}>
              PEDIATRA
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === "REPRESENTANTE" ? "active" : ""}`} onClick={() => setTab("REPRESENTANTE")}>
              REPRESENTANTE
            </button>
          </li>
        </ul>

        {/* ====================== ADMIN TAB ====================== */}
        {tab === "ADMIN" && (
          <>
            <Section
              title="Usuarios"
              subtitle="Crear usuarios y consultar la lista (filtro por rol, ordenar, exportar, paginar)."
              right={
                <div className="d-flex gap-2 flex-wrap">
                  <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: 180 }}
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="ALL">Todos los roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="PEDIATRA">PEDIATRA</option>
                    <option value="REPRESENTANTE">REPRESENTANTE</option>
                  </select>

                  <input
                    className="form-control form-control-sm"
                    style={{ maxWidth: 240 }}
                    placeholder="Buscar usuario..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                  />

                  <select
                    className="form-select form-select-sm"
                    style={{ width: 120 }}
                    value={userPageSize}
                    onChange={(e) => setUserPageSize(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>

                  <button className="btn btn-outline-dark btn-sm" type="button" onClick={exportUsers}>
                    Exportar CSV
                  </button>
                </div>
              }
            >
              {uMsg && <div className="alert alert-info py-2">{uMsg}</div>}

              <form className="row g-2" onSubmit={createUser}>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Nombres" value={uForm.nombres} onChange={(e) => setUForm({ ...uForm, nombres: e.target.value })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Apellidos" value={uForm.apellidos} onChange={(e) => setUForm({ ...uForm, apellidos: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Documento" value={uForm.numero_documento} onChange={(e) => setUForm({ ...uForm, numero_documento: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <select className="form-select" value={uForm.rol} onChange={(e) => setUForm({ ...uForm, rol: e.target.value })}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="PEDIATRA">PEDIATRA</option>
                    <option value="REPRESENTANTE">REPRESENTANTE</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <input type="password" className="form-control" placeholder="Password" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} required />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary btn-sm" disabled={loading}>
                    Crear usuario
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setUForm({ nombres: "", apellidos: "", numero_documento: "", rol: "REPRESENTANTE", password: "" })}>
                    Limpiar
                  </button>
                </div>
              </form>

              <div className="table-responsive mt-3">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th style={{ cursor: "pointer" }} onClick={() => setUserSort((p) => ({ key: "id", dir: p.key === "id" && p.dir === "asc" ? "desc" : "asc" }))}>
                        ID {userSort.key === "id" ? (userSort.dir === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => setUserSort((p) => ({ key: "numero_documento", dir: p.key === "numero_documento" && p.dir === "asc" ? "desc" : "asc" }))}>
                        Documento {userSort.key === "numero_documento" ? (userSort.dir === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => setUserSort((p) => ({ key: "nombres", dir: p.key === "nombres" && p.dir === "asc" ? "desc" : "asc" }))}>
                        Nombres {userSort.key === "nombres" ? (userSort.dir === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => setUserSort((p) => ({ key: "apellidos", dir: p.key === "apellidos" && p.dir === "asc" ? "desc" : "asc" }))}>
                        Apellidos {userSort.key === "apellidos" ? (userSort.dir === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => setUserSort((p) => ({ key: "rol", dir: p.key === "rol" && p.dir === "asc" ? "desc" : "asc" }))}>
                        Rol {userSort.key === "rol" ? (userSort.dir === "asc" ? "▲" : "▼") : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersPageMeta.slice.map((u) => (
                      <tr key={u.id}>
                        <td className="text-muted">{u.id}</td>
                        <td className="fw-semibold">{u.numero_documento}</td>
                        <td>{u.nombres}</td>
                        <td>{u.apellidos}</td>
                        <td>
                          <span className="badge text-bg-light border">{u.rol}</span>
                        </td>
                      </tr>
                    ))}
                    {usersPageMeta.total === 0 && <tr><td colSpan="5" className="text-muted">Sin resultados.</td></tr>}
                  </tbody>
                </table>
              </div>

              <Pager meta={usersPageMeta} setPage={setUserPage} />
            </Section>

            <Section
              title="Vacunas"
              subtitle="Catálogo de vacunas (búsqueda, exportar, paginar)."
              right={
                <div className="d-flex gap-2 flex-wrap">
                  <input className="form-control form-control-sm" style={{ maxWidth: 240 }} placeholder="Buscar vacuna..." value={vaccineQuery} onChange={(e) => setVaccineQuery(e.target.value)} />
                  <select className="form-select form-select-sm" style={{ width: 120 }} value={vaccinePageSize} onChange={(e) => setVaccinePageSize(Number(e.target.value))}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <button className="btn btn-outline-dark btn-sm" type="button" onClick={exportVaccines}>
                    Exportar CSV
                  </button>
                </div>
              }
            >
              {vMsg && <div className="alert alert-info py-2">{vMsg}</div>}

              <form className="row g-2" onSubmit={createVaccine}>
                <div className="col-md-4">
                  <input className="form-control" placeholder="Nombre" value={vForm.nombre} onChange={(e) => setVForm({ ...vForm, nombre: e.target.value })} required />
                </div>
                <div className="col-md-6">
                  <input className="form-control" placeholder="Descripción" value={vForm.descripcion} onChange={(e) => setVForm({ ...vForm, descripcion: e.target.value })} />
                </div>
                <div className="col-md-2 d-flex gap-2">
                  <button className="btn btn-success btn-sm w-100" disabled={loading}>
                    Crear
                  </button>
                </div>
              </form>

              <div className="table-responsive mt-3">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccinesPageMeta.slice.map((v) => (
                      <tr key={v.id}>
                        <td className="text-muted">{v.id}</td>
                        <td className="fw-semibold">{v.nombre}</td>
                        <td className="text-muted">{v.descripcion || "-"}</td>
                      </tr>
                    ))}
                    {vaccinesPageMeta.total === 0 && <tr><td colSpan="3" className="text-muted">Sin resultados.</td></tr>}
                  </tbody>
                </table>
              </div>

              <Pager meta={vaccinesPageMeta} setPage={setVaccinePage} />
            </Section>

            <Section
              title="Esquema por dosis"
              subtitle="Agregar dosis al esquema y revisar el schedule (filtrar por vacuna, ordenar, exportar, paginar)."
              right={
                <div className="d-flex gap-2 flex-wrap">
                  <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: 220 }}
                    value={scheduleVaccineFilter}
                    onChange={(e) => setScheduleVaccineFilter(e.target.value)}
                  >
                    <option value="ALL">Todas las vacunas</option>
                    {[...new Set(scheduleFull.map((x) => x.vaccine_nombre))].sort().map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <input className="form-control form-control-sm" style={{ maxWidth: 240 }} placeholder="Buscar en esquema..." value={scheduleQuery} onChange={(e) => setScheduleQuery(e.target.value)} />

                  <select className="form-select form-select-sm" style={{ width: 140 }} value={`${scheduleSort.key}:${scheduleSort.dir}`} onChange={(e) => {
                    const [key, dir] = e.target.value.split(":");
                    setScheduleSort({ key, dir });
                  }}>
                    <option value="vaccine_nombre:asc">Vacuna (A-Z)</option>
                    <option value="vaccine_nombre:desc">Vacuna (Z-A)</option>
                    <option value="edad_objetivo_meses:asc">Edad (↑)</option>
                    <option value="edad_objetivo_meses:desc">Edad (↓)</option>
                    <option value="dosis_numero:asc">Dosis (↑)</option>
                    <option value="dosis_numero:desc">Dosis (↓)</option>
                  </select>

                  <select className="form-select form-select-sm" style={{ width: 120 }} value={schedulePageSize} onChange={(e) => setSchedulePageSize(Number(e.target.value))}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>

                  <button className="btn btn-outline-dark btn-sm" type="button" onClick={exportSchedule}>
                    Exportar CSV
                  </button>
                </div>
              }
            >
              {sMsg && <div className="alert alert-info py-2">{sMsg}</div>}

              <form className="row g-2" onSubmit={createSchedule}>
                <div className="col-md-4">
                  <select className="form-select" value={sForm.vaccine_id} onChange={(e) => setSForm({ ...sForm, vaccine_id: e.target.value })} required>
                    <option value="">Seleccione vacuna...</option>
                    {vaccines.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input className="form-control" type="number" min="1" placeholder="Dosis #" value={sForm.dosis_numero} onChange={(e) => setSForm({ ...sForm, dosis_numero: e.target.value })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" type="number" min="0" placeholder="Edad (meses)" value={sForm.edad_objetivo_meses} onChange={(e) => setSForm({ ...sForm, edad_objetivo_meses: e.target.value })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" type="number" min="0" placeholder="Intervalo (días) opcional" value={sForm.intervalo_min_dias} onChange={(e) => setSForm({ ...sForm, intervalo_min_dias: e.target.value })} />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary btn-sm" disabled={loading}>
                    Agregar al esquema
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSForm({ vaccine_id: "", dosis_numero: 1, edad_objetivo_meses: 0, intervalo_min_dias: "" })}>
                    Limpiar
                  </button>
                </div>
              </form>

              <div className="table-responsive mt-3">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Vacuna</th>
                      <th>Dosis</th>
                      <th>Edad (m)</th>
                      <th>Intervalo</th>
                      <th>ScheduleID</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedulePageMeta.slice.map((s) => (
                      <tr key={s.schedule_id}>
                        <td className="fw-semibold">{s.vaccine_nombre}</td>
                        <td>{s.dosis_numero}</td>
                        <td>{s.edad_objetivo_meses}</td>
                        <td className="text-muted">{s.intervalo_min_dias ?? "-"}</td>
                        <td className="text-muted">{s.schedule_id}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            type="button"
                            onClick={async () => {
                              const ok = await copyText(s.schedule_id);
                              notify(ok ? "success" : "danger", ok ? "ScheduleID copiado ✅" : "No se pudo copiar");
                            }}
                          >
                            Copiar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {schedulePageMeta.total === 0 && <tr><td colSpan="6" className="text-muted">Sin resultados.</td></tr>}
                  </tbody>
                </table>
              </div>

              <Pager meta={schedulePageMeta} setPage={setSchedulePage} />
            </Section>
          </>
        )}

        {/* ====================== PEDIATRA TAB ====================== */}
        {tab === "PEDIATRA" && (
          <>
            <Section title="Registro rápido" subtitle="Crear Representante + Niño desde el panel administrativo.">
              {regMsg && <div className="alert alert-info py-2">{regMsg}</div>}

              <form className="row g-2" onSubmit={registerChild}>
                <div className="col-12"><strong>Representante</strong></div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Nombres" value={reg.representante.nombres} onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, nombres: e.target.value } })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Apellidos" value={reg.representante.apellidos} onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, apellidos: e.target.value } })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Documento" value={reg.representante.numero_documento} onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, numero_documento: e.target.value } })} required />
                </div>
                <div className="col-md-3">
                  <input type="password" className="form-control" placeholder="Password" value={reg.representante.password} onChange={(e) => setReg({ ...reg, representante: { ...reg.representante, password: e.target.value } })} required />
                </div>

                <div className="col-12 mt-2"><strong>Niño</strong></div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Nombres" value={reg.nino.nombres} onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, nombres: e.target.value } })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Apellidos" value={reg.nino.apellidos} onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, apellidos: e.target.value } })} required />
                </div>
                <div className="col-md-3">
                  <input className="form-control" placeholder="Documento" value={reg.nino.numero_documento} onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, numero_documento: e.target.value } })} required />
                </div>
                <div className="col-md-2">
                  <input type="date" className="form-control" value={reg.nino.fecha_nacimiento} onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, fecha_nacimiento: e.target.value } })} required />
                </div>
                <div className="col-md-1">
                  <select className="form-select" value={reg.nino.sexo} onChange={(e) => setReg({ ...reg, nino: { ...reg.nino, sexo: e.target.value } })}>
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <input className="form-control" placeholder="Parentesco (madre/padre/tutor)" value={reg.parentesco} onChange={(e) => setReg({ ...reg, parentesco: e.target.value })} required />
                </div>

                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary btn-sm" disabled={loading}>Registrar</button>
                </div>
              </form>
            </Section>

            <Section title="Crear visita" subtitle="Registrar atención con peso, talla y observaciones."
              right={
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={async () => {
                    const ok = await copyText(visitMsg.match(/ID=(\d+)/)?.[1] || "");
                    if (!visitMsg.includes("ID=")) notify("info", "Crea una visita primero para copiar el ID.");
                    else notify(ok ? "success" : "danger", ok ? "Visit ID copiado ✅" : "No se pudo copiar");
                  }}
                >
                  Copiar Visit ID (si existe)
                </button>
              }
            >
              {visitMsg && <div className="alert alert-info py-2">{visitMsg}</div>}

              <form className="row g-2" onSubmit={createVisit}>
                <div className="col-md-4">
                  <select className="form-select" value={visitForm.child_id} onChange={(e) => setVisitForm({ ...visitForm, child_id: e.target.value })} required>
                    <option value="">Seleccione niño...</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} - {c.numero_documento}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input type="date" className="form-control" value={visitForm.fecha_atencion} onChange={(e) => setVisitForm({ ...visitForm, fecha_atencion: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Peso (kg)" value={visitForm.peso_kg} onChange={(e) => setVisitForm({ ...visitForm, peso_kg: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Talla (cm)" value={visitForm.talla_cm} onChange={(e) => setVisitForm({ ...visitForm, talla_cm: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <button className="btn btn-success btn-sm w-100" disabled={loading}>Crear visita</button>
                </div>
                <div className="col-12">
                  <input className="form-control" placeholder="Observaciones" value={visitForm.observaciones} onChange={(e) => setVisitForm({ ...visitForm, observaciones: e.target.value })} />
                </div>
              </form>
            </Section>

            <Section title="Aplicar vacuna" subtitle="Selecciona la dosis del esquema y registra la aplicación."
              right={
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setApplyForm((p) => ({ ...p, fecha_aplicacion: p.fecha_aplicacion || today }));
                    notify("info", "Fecha de aplicación sugerida: hoy.");
                  }}
                >
                  Poner fecha hoy
                </button>
              }
            >
              {applyMsg && <div className="alert alert-info py-2">{applyMsg}</div>}

              <form className="row g-2" onSubmit={applyVaccine}>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Visit ID" value={applyForm.visit_id} onChange={(e) => setApplyForm({ ...applyForm, visit_id: e.target.value })} required />
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={applyForm.schedule_id} onChange={(e) => setApplyForm({ ...applyForm, schedule_id: e.target.value })} required>
                    <option value="">Seleccione dosis...</option>
                    {scheduleFull.map((s) => (
                      <option key={s.schedule_id} value={s.schedule_id}>
                        {s.vaccine_nombre} — Dosis {s.dosis_numero} — {s.edad_objetivo_meses} meses
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input type="date" className="form-control" value={applyForm.fecha_aplicacion} onChange={(e) => setApplyForm({ ...applyForm, fecha_aplicacion: e.target.value })} required />
                </div>
                <div className="col-md-2">
                  <input className="form-control" placeholder="Lote" value={applyForm.lote} onChange={(e) => setApplyForm({ ...applyForm, lote: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <input type="date" className="form-control" value={applyForm.proxima_fecha} onChange={(e) => setApplyForm({ ...applyForm, proxima_fecha: e.target.value })} />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary btn-sm" disabled={loading}>Aplicar</button>
                </div>
              </form>
            </Section>
          </>
        )}

        {/* ====================== REPRESENTANTE TAB ====================== */}
        {tab === "REPRESENTANTE" && (
          <>
            <Section
              title="Consulta (modo representante)"
              subtitle="Selecciona un niño para ver próximas vacunas e historial completo."
              right={
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-primary btn-sm" onClick={loadHistoryAndNext} disabled={!selectedChildId || loading}>
                    {loading ? "Cargando..." : "Cargar"}
                  </button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()} disabled={!selectedChildId}>
                    Imprimir
                  </button>
                  <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => {
                    if (!selectedChildId) return notify("info", "Selecciona un niño primero.");
                    exportNext();
                    exportHistory();
                    notify("success", "Exportados: próximas e historial (CSV).");
                  }} disabled={!selectedChildId}>
                    Exportar CSV
                  </button>
                </div>
              }
            >
              <div className="row g-2 align-items-end">
                <div className="col-md-6">
                  <label className="form-label">Seleccione niño</label>
                  <select className="form-select" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
                    <option value="">Seleccione...</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} - {c.numero_documento}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <div className="text-muted small">
                    Atrasadas detectadas (última carga): <strong>{stats.nextLate}</strong>
                  </div>
                </div>
              </div>
              {repMsg && <div className="alert alert-info py-2 mt-3">{repMsg}</div>}
            </Section>

            <Section
              title="Próximas vacunas"
              subtitle="Filtra, busca y exporta. Marca 'solo atrasadas' para priorizar."
              right={
                <div className="d-flex gap-2 flex-wrap">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" checked={nextOnlyLate} onChange={(e) => setNextOnlyLate(e.target.checked)} id="onlylate" />
                    <label className="form-check-label" htmlFor="onlylate">Solo atrasadas</label>
                  </div>
                  <input className="form-control form-control-sm" style={{ maxWidth: 240 }} placeholder="Buscar..." value={nextQuery} onChange={(e) => setNextQuery(e.target.value)} />
                  <select className="form-select form-select-sm" style={{ width: 120 }} value={nextPageSize} onChange={(e) => setNextPageSize(Number(e.target.value))}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <button className="btn btn-outline-dark btn-sm" type="button" onClick={exportNext} disabled={!selectedChildId}>
                    Exportar próximas
                  </button>
                </div>
              }
            >
              <div className="table-responsive">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Vacuna</th>
                      <th>Dosis</th>
                      <th>Edad (m)</th>
                      <th>Fecha recomendada</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextMeta.slice.map((x) => (
                      <tr key={x.schedule_id}>
                        <td className="fw-semibold">{x.vaccine_nombre}</td>
                        <td>{x.dosis_numero}</td>
                        <td>{x.edad_objetivo_meses}</td>
                        <td>{fmtDate(x.fecha_recomendada)}</td>
                        <td><BadgeEstado estado={x.estado} /></td>
                      </tr>
                    ))}
                    {selectedChildId && nextMeta.total === 0 && (
                      <tr><td colSpan="5" className="text-muted">No hay pendientes con el filtro actual.</td></tr>
                    )}
                    {!selectedChildId && (
                      <tr><td colSpan="5" className="text-muted">Selecciona un niño para ver pendientes.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedChildId && <Pager meta={nextMeta} setPage={setNextPage} />}
            </Section>

            <Section
              title="Historial"
              subtitle="Busca por vacuna, observaciones o fechas. Exportable a CSV."
              right={
                <div className="d-flex gap-2 flex-wrap">
                  <input className="form-control form-control-sm" style={{ maxWidth: 260 }} placeholder="Buscar en historial..." value={histQuery} onChange={(e) => setHistQuery(e.target.value)} />
                  <select className="form-select form-select-sm" style={{ width: 120 }} value={histPageSize} onChange={(e) => setHistPageSize(Number(e.target.value))}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <button className="btn btn-outline-dark btn-sm" type="button" onClick={exportHistory} disabled={!selectedChildId}>
                    Exportar historial
                  </button>
                </div>
              }
            >
              {selectedChildId && histMeta.slice.map((item, idx) => (
                <div className="border rounded-3 p-3 mb-3" key={idx}>
                  <div className="d-flex flex-wrap justify-content-between gap-2">
                    <div className="fw-semibold">
                      Visita: {fmtDate(item.visit.fecha_atencion)}
                      <span className="text-muted fw-normal"> • Peso: {item.visit.peso_kg} kg • Talla: {item.visit.talla_cm} cm</span>
                    </div>
                  </div>

                  {item.visit.observaciones && <div className="text-muted mt-1">{item.visit.observaciones}</div>}

                  <div className="table-responsive mt-3">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr><th>Vacuna</th><th>Dosis</th><th>Fecha</th><th>Lote</th><th>Próxima</th></tr>
                      </thead>
                      <tbody>
                        {item.applications.map((a) => (
                          <tr key={a.application_id}>
                            <td className="fw-semibold">{a.vaccine_nombre}</td>
                            <td>{a.dosis_numero}</td>
                            <td>{fmtDate(a.fecha_aplicacion)}</td>
                            <td className="text-muted">{a.lote || "-"}</td>
                            <td className="text-muted">{a.proxima_fecha ? fmtDate(a.proxima_fecha) : "-"}</td>
                          </tr>
                        ))}
                        {item.applications.length === 0 && (
                          <tr><td colSpan="5" className="text-muted">Sin vacunas en esta visita.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {selectedChildId && histMeta.total === 0 && <div className="text-muted">Sin historial aún (o no coincide con el filtro).</div>}
              {!selectedChildId && <div className="text-muted">Selecciona un niño para ver el historial.</div>}

              {selectedChildId && <Pager meta={histMeta} setPage={setHistPage} />}
            </Section>
          </>
        )}
      </div>
    </>
  );
}
