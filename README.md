# 💻 TechFix Pro - Sistema Fullstack (Frontend + Backend Separados)

Sistema de cotizaciones con arquitectura **Frontend** y **Backend** completamente separados.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         DOCKER                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   FRONTEND   │     │   BACKEND    │     │   DATABASE   │     │
│  │    Nginx     │────▶│  PHP/Apache  │────▶│   MariaDB    │     │
│  │  Port 8080   │     │  Port 8000   │     │  Port 3306   │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│         │                                          │             │
│         │              ┌──────────────┐            │             │
│         │              │  phpMyAdmin  │────────────┘             │
│         │              │  Port 8081   │                          │
│         │              └──────────────┘                          │
│         │                                                        │
│         ▼                                                        │
│    /api/* ──────────▶ Proxy a Backend                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Estructura de Carpetas

```
freelance-fullstack/
├── docker-compose.yml          # Orquestación de contenedores
├── nginx.conf                  # Configuración del proxy
│
├── frontend/                   # ══════ FRONTEND ══════
│   ├── index.html              # Página de inicio
│   ├── css/
│   │   └── styles.css          # Estilos globales
│   ├── js/
│   │   ├── utils.js            # Utilidades compartidas
│   │   ├── inicio.js           # Lógica de inicio
│   │   ├── clientes.js         # CRUD clientes
│   │   ├── servicios.js        # CRUD servicios
│   │   ├── cotizaciones.js     # CRUD cotizaciones
│   │   └── reportes.js         # Reportes y filtros
│   └── pages/
│       ├── clientes.html       # Gestión de clientes
│       ├── servicios.html      # Gestión de servicios
│       ├── cotizaciones.html   # Gestión de cotizaciones
│       └── reportes.html       # Reportes
│
└── backend/                    # ══════ BACKEND ══════
    ├── php/
    │   ├── config.php          # Configuración BD
    │   ├── clientes.php        # API clientes
    │   ├── servicios.php       # API servicios
    │   ├── cotizaciones.php    # API cotizaciones
    │   └── exportar.php        # Exportar CSV
    └── sql/
        └── init.sql            # Script de BD
```

## 🚀 Instalación

### 1. Extraer el proyecto
```bash
unzip freelance-fullstack.zip
cd freelance-fullstack
```

### 2. Levantar con Docker
```bash
docker-compose up -d
```

### 3. Esperar ~30 segundos y acceder

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:8080 | Aplicación web |
| **Backend API** | http://localhost:8000 | API directa |
| **phpMyAdmin** | http://localhost:8081 | Administrar BD |

## 🔌 Endpoints de la API

### Clientes (`/api/clientes.php`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/clientes.php` | Listar todos |
| GET | `/api/clientes.php?action=getOne&id=1` | Obtener uno |
| POST | `/api/clientes.php` | Crear |
| PUT | `/api/clientes.php` | Actualizar |
| DELETE | `/api/clientes.php?id=1` | Eliminar |

### Servicios (`/api/servicios.php`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/servicios.php` | Listar todos |
| GET | `/api/servicios.php?action=getOne&id=1` | Obtener uno |
| POST | `/api/servicios.php` | Crear |
| PUT | `/api/servicios.php` | Actualizar |
| DELETE | `/api/servicios.php?id=1` | Eliminar |

### Cotizaciones (`/api/cotizaciones.php`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/cotizaciones.php` | Listar todas |
| GET | `/api/cotizaciones.php?action=getOne&id=1` | Obtener con items |
| GET | `/api/cotizaciones.php?action=reporte` | Reporte con filtros |
| POST | `/api/cotizaciones.php` | Crear |
| PUT | `/api/cotizaciones.php` | Actualizar |
| DELETE | `/api/cotizaciones.php?id=1` | Eliminar |

### Exportar (`/api/exportar.php`)

| Parámetro | Descripción |
|-----------|-------------|
| `?tipo=cotizaciones` | Exportar cotizaciones |
| `?tipo=clientes` | Exportar clientes |
| `?tipo=servicios` | Exportar servicios |
| `?tipo=detalle&id=1` | Detalle de cotización |

## 🔧 Configuración del Proxy (Nginx)

El frontend accede al backend a través del proxy configurado en `nginx.conf`:

```nginx
location /api/ {
    proxy_pass http://backend:80/;
}
```

Esto permite que el frontend llame a `/api/clientes.php` y Nginx lo redirija a `http://backend:80/clientes.php`.

## 📊 Flujo de Datos

```
┌────────────┐    HTTP     ┌─────────────┐   Proxy    ┌──────────────┐
│  Browser   │ ──────────▶ │   Nginx     │ ─────────▶ │  PHP/Apache  │
│            │             │  (Frontend)  │            │  (Backend)   │
└────────────┘             └─────────────┘            └──────────────┘
                                                              │
                                                              ▼
                                                      ┌──────────────┐
                                                      │   MariaDB    │
                                                      │  (Database)  │
                                                      └──────────────┘
```

## 🐳 Comandos Docker

```bash
# Iniciar
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs del frontend
docker-compose logs -f frontend

# Ver logs del backend
docker-compose logs -f backend

# Detener
docker-compose stop

# Eliminar todo (incluye datos)
docker-compose down -v

# Reiniciar
docker-compose restart

# Reconstruir
docker-compose up -d --build
```

## 🔐 Credenciales

| Servicio | Usuario | Contraseña |
|----------|---------|------------|
| MariaDB | freelance_user | freelance123 |
| MariaDB (root) | root | root123 |
| phpMyAdmin | freelance_user | freelance123 |

## 🧪 Probar la API directamente

```bash
# Listar clientes
curl http://localhost:8000/clientes.php

# Crear cliente
curl -X POST http://localhost:8000/clientes.php \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@test.com","telefono":"6000-0000"}'

# Listar servicios
curl http://localhost:8000/servicios.php

# Reporte de cotizaciones
curl "http://localhost:8000/cotizaciones.php?action=reporte"
```

## ✅ Características

### Frontend
- ✅ HTML5 semántico
- ✅ CSS3 con variables y tema oscuro
- ✅ JavaScript vanilla (sin frameworks)
- ✅ Diseño responsivo
- ✅ Modales para formularios
- ✅ Notificaciones toast
- ✅ Validaciones en cliente

### Backend
- ✅ API RESTful en PHP
- ✅ PDO con prepared statements
- ✅ Patrón Singleton para BD
- ✅ Validaciones en servidor
- ✅ CORS habilitado
- ✅ Exportación CSV

### Base de Datos
- ✅ MariaDB 10.11
- ✅ Foreign keys
- ✅ Índices optimizados
- ✅ Datos de prueba incluidos

---

**TechFix Pro** © 2025 | Programación WEB III
