import React from "react";

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

function todayEC() {
  const d = new Date();
  return d.toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "2-digit" });
}

/**
 * props:
 *  - child: { nombres, apellidos, numero_documento, sexo, fecha_nacimiento }
 *  - subtitle: string
 *  - rightMetaLines: string[]
 *  - children: contenido (tablas)
 */
export default function PrintCartilla({ child, subtitle, rightMetaLines = [], children }) {
  return (
    <div id="print-area" className="cartilla">
      <div className="cartilla-header avoid-break">
        <div className="cartilla-logo">CS</div>

        <div className="cartilla-title">
          <h1>Cartilla de Vacunación Infantil</h1>
          <div className="sub">
            {subtitle || "Subcentro de Salud — SISCONI"}
          </div>
        </div>

        <div className="cartilla-meta">
          <div><strong>Fecha:</strong> {todayEC()}</div>
          {rightMetaLines.map((x, i) => (
            <div key={i}>{x}</div>
          ))}
        </div>
      </div>

      <div className="cartilla-grid">
        <div className="cartilla-box avoid-break">
          <h3>Datos del niño/a</h3>
          <div className="kv">
            <div className="k">Nombres:</div>
            <div className="v"><strong>{child?.nombres || "-"}</strong></div>

            <div className="k">Apellidos:</div>
            <div className="v"><strong>{child?.apellidos || "-"}</strong></div>

            <div className="k">Documento:</div>
            <div className="v">{child?.numero_documento || "-"}</div>

            <div className="k">Sexo:</div>
            <div className="v">{child?.sexo || "-"}</div>

            <div className="k">Nacimiento:</div>
            <div className="v">{fmtDate(child?.fecha_nacimiento)}</div>
          </div>
        </div>

        <div className="cartilla-box avoid-break">
          <h3>Información del establecimiento</h3>
          <div className="kv">
            <div className="k">Unidad:</div>
            <div className="v">Subcentro / Centro de Salud</div>

            <div className="k">Ciudad:</div>
            <div className="v">Manta, Ecuador</div>

            <div className="k">Sistema:</div>
            <div className="v">SISCONI</div>

            <div className="k">Observación:</div>
            <div className="v">Documento generado automáticamente.</div>
          </div>
        </div>
      </div>

      {children}

      <div className="sign-grid avoid-break">
        <div className="sign">Firma y sello del establecimiento</div>
        <div className="sign">Firma del representante</div>
      </div>

      <div className="small-note">
        Nota: Esta cartilla es un respaldo de la información registrada en el sistema.
      </div>
    </div>
  );
}
