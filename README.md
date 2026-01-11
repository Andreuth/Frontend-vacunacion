SISCONI – Frontend

Frontend del sistema SISCONI desarrollado con React y Bootstrap.

TECNOLOGÍAS
- React (Vite)
- Axios
- React Router DOM
- Bootstrap 5

INSTALACIÓN
1. Instalar dependencias
   npm install

2. Ejecutar
   npm run dev

Servidor:
http://localhost:5173

CONEXIÓN BACKEND
En src/api/axios.js:
baseURL: http://127.0.0.1:8000

FLUJO DE USUARIOS
ADMIN -> /admin
PEDIATRA -> /pediatric
REPRESENTANTE -> /representative

FUNCIONALIDADES
ADMIN:
- Gestión de usuarios
- Gestión de vacunas
- Supervisión general

PEDIATRA:
- Registro rápido de niños
- Creación de visitas
- Aplicación de vacunas

REPRESENTANTE:
- Consulta de hijos
- Historial
- Próximas vacunas

IMPRESIÓN
Las vistas incluyen botón imprimir usando window.print().

PROYECTO
Sistema académico para la digitalización del control de vacunación infantil.
