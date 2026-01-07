import Navbar from "./Navbar";

function PageLayout({ title, subtitle, right, children }) {
  return (
    <div>
      <Navbar />

      {/* Fondo general */}
      <div className="bg-light min-vh-100">
        <div className="container py-4">
          {/* Encabezado */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <div>
              <h2 className="fw-bold mb-1">{title}</h2>
              {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
            </div>

            {/* Lado derecho (badge rol, botones, etc.) */}
            {right && <div className="d-flex align-items-center gap-2">{right}</div>}
          </div>

          {/* Contenido en card grande */}
          <div className="card shadow-sm border-0">
            <div className="card-body">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageLayout;
