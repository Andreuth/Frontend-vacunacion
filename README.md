📘  Frontend SISCONI (React)

Frontend del sistema SISCONI para el control de vacunación infantil.
Incluye paneles diferenciados para Administrador, Pediatra y Representante.

🛠 Tecnologías

React

Vite

Bootstrap

Axios

React Router DOM

🔐 Variables de entorno

Crear archivo .env en la carpeta frontend/:

VITE_API_URL=http://localhost:8000

En producción (Vercel):

VITE_API_URL=https://back-sisconi.com

🚧 1. Desarrollo con Docker (Tema 4.2)

Desde la raíz del proyecto:

docker compose up -d --build
docker compose ps
docker compose logs -f frontend

Frontend disponible en:
http://localhost:5173

💻 2. Desarrollo local sin Docker

cd frontend
npm install
npm run dev

Abrir en el navegador:
http://localhost:5173

🚀 3. Producción en la nube (Vercel)

El frontend está desplegado en Vercel como parte del despliegue en producción.

Configuración en Vercel

En Project Settings → Environment Variables:

VITE_API_URL = https://back-sisconi.com

Luego realizar redeploy.

🔗 Comunicación Frontend – Backend

Frontend: Vercel (HTTPS)

Backend: Ubuntu Server (HTTPS mediante Cloudflare)

Comunicación vía Axios

CORS configurado en FastAPI

👥 Autores

Grupo F SISCONI – Aplicaciones Web II