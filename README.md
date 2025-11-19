🧩 Sistema de Vacunación – FRONTEND (React)

Este frontend está desarrollado con React y consume la API REST del backend.
Incluye autenticación, gestión de sesión con Context API y CRUD de personas.

🚀 Tecnologías utilizadas

React (Create React App)

Axios

React Router DOM

Context API

CSS personalizado

📁 Estructura del proyecto
frontend/
│
├── src/
│   ├── api/             # Axios configurado
│   ├── components/      # Form Persona
│   ├── context/         # AuthContext
│   ├── pages/           # Login + Dashboard
│   ├── App.js
│   ├── index.js
│   └── index.css
│
├── .env
├── package.json

⚙️ Instalación
1️⃣ Instalar dependencias
cd frontend
npm install

2️⃣ Archivo .env

Crear en frontend/.env:

REACT_APP_API_URL=http://127.0.0.1:8000


React solo lee .env al iniciar → reinicia con npm start.

▶️ Ejecutar aplicación
npm start


Abrir en navegador:

👉 http://localhost:3000

🔐 Autenticación

El login envía:

POST /auth/login


Campos:

username (numero_documento)

password

Si es exitoso:

Guarda token en localStorage

Redirige al Dashboard

Todas las peticiones internas usan:

Authorization: Bearer <token>

👤 CRUD completo de Persona (desde React)

Incluye:

✔ Crear persona
✔ Listar personas
✔ Editar persona
✔ Desactivar persona

Todo conectado al backend con Axios.

🖼️ Interfaz del Usuario

Pantalla de Login con diseño moderno

Dashboard con:

Sidebar de navegación

Lista de personas

Formulario de creación

Formulario de edición

Botón para eliminar/desactivar

🔧 Scripts
npm start     # Ejecutar en desarrollo
npm run build # Crear build de producción

🧾 Estado del frontend

✔ Login funcionando
✔ Token guardado en localStorage
✔ Axios configurado globalmente
✔ Dashboard privado
✔ CRUD de Personas completo
✔ Estilos modernos
✔ Listo para entrega

✍️ Autores

(Coloca nombres del grupo)

📗 FIN DEL README DEL FRONTEND