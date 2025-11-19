import { useState, useEffect } from "react";

const emptyValues = {
  nombres: "",
  apellidos: "",
  numero_documento: "",
  rol: "usuario",
  password: "",
};

function PersonaForm({ initialValues, onSubmit, onCancel, isEditing }) {
  const [values, setValues] = useState(emptyValues);

  useEffect(() => {
    if (initialValues) {
      setValues({
        nombres: initialValues.nombres || "",
        apellidos: initialValues.apellidos || "",
        numero_documento: initialValues.numero_documento || "",
        rol: initialValues.rol || "usuario",
        password: "",
      });
    } else {
      setValues(emptyValues);
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <div className="form-wrapper">     {/* 👈 Nuevo: contenedor compacto */}
      <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
        <div className="form-group">
          <label className="form-label">Nombres</label>
          <input
            className="form-input"
            name="nombres"
            value={values.nombres}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Apellidos</label>
          <input
            className="form-input"
            name="apellidos"
            value={values.apellidos}
            onChange={handleChange}
            required
          />
        </div>

        {!isEditing && (
          <>
            <div className="form-group">
              <label className="form-label">Número de documento</label>
              <input
                className="form-input"
                name="numero_documento"
                value={values.numero_documento}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                name="password"
                value={values.password}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        {isEditing && (
          <div className="form-group">
            <label className="form-label">Número de documento</label>
            <input
              className="form-input"
              value={values.numero_documento}
              disabled
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn-primary" type="submit">
            {isEditing ? "Guardar cambios" : "Registrar"}
          </button>

          {isEditing && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default PersonaForm;
