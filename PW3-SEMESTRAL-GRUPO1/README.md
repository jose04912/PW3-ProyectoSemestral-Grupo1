Grupo 1: FreeLance
José Williams, 8-992-962
Yackeline Ibarra, 
Wheniska Hall, 
Yaser Mendoza,
Kenneth Morales, 
# 💻 TechFix Pro - Sistema de Cotizaciones para Freelance

Sistema web interactivo para gestionar cotizaciones de servicios de soporte técnico de computadoras.

![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?style=flat&logo=php)
![MariaDB](https://img.shields.io/badge/MariaDB-10.11-003545?style=flat&logo=mariadb)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)

## 📋 Características

- ✅ **Página de Bienvenida** con identidad visual y portafolio de servicios
- ✅ **Gestión de Clientes** (CRUD completo)
- ✅ **Catálogo de Servicios** (CRUD completo)
- ✅ **Cotizaciones** con múltiples ítems y cálculo automático de impuestos
- ✅ **Reportes** con filtros por cliente y rango de fechas
- ✅ **Exportación a CSV** de cotizaciones, clientes y servicios
- ✅ **Validaciones** de email, teléfono y campos obligatorios
- ✅ **Diseño responsivo** con tema oscuro moderno

## 🚀 Instalación

### Requisitos Previos

- Docker y Docker Compose instalados
- Puerto 8080 disponible (aplicación web)
- Puerto 8081 disponible (phpMyAdmin)
- Puerto 3306 disponible (MariaDB)

### Pasos de Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd freelance-system
   ```

2. **Levantar los contenedores con Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Esperar a que los servicios estén listos** (aproximadamente 30 segundos)
   ```bash
   docker-compose logs -f
   ```
   Presiona `Ctrl+C` cuando veas que la base de datos está lista.

4. **Acceder a la aplicación**
   - 🌐 **Aplicación Web:** http://localhost:8080
   - 🔧 **phpMyAdmin:** http://localhost:8081

### Credenciales de Base de Datos

| Parámetro | Valor |
|-----------|-------|
| Host | db (interno) / localhost:3306 (externo) |
| Base de datos | freelance_db |
| Usuario | freelance_user |
| Contraseña | freelance123 |
| Root Password | root123 |

## 📁 Estructura del Proyecto

```
freelance-system/
├── docker-compose.yml      # Configuración de Docker
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos CSS
├── js/
│   └── app.js              # JavaScript principal
├── php/
│   ├── config.php          # Configuración y conexión BD
│   ├── clientes.php        # API de clientes
│   ├── servicios.php       # API de servicios
│   ├── cotizaciones.php    # API de cotizaciones
│   └── exportar.php        # Exportación CSV
├── sql/
│   └── init.sql            # Script de inicialización BD
└── README.md
```

## 🗄️ Base de Datos

### Tablas

1. **clientes** - Información de clientes
2. **servicios** - Catálogo de servicios
3. **cotizaciones** - Encabezados de cotizaciones
4. **cotizacion_items** - Detalle de servicios por cotización

### Diagrama Entidad-Relación

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  clientes   │       │   cotizaciones   │       │    servicios    │
├─────────────┤       ├──────────────────┤       ├─────────────────┤
│ id_cliente  │◄──────│ id_cliente (FK)  │       │ id_servicio     │
│ nombre      │       │ id_cotizacion    │       │ nombre          │
│ email       │       │ numero_cotizacion│       │ descripcion     │
│ telefono    │       │ fecha_cotizacion │       │ precio_base     │
│ direccion   │       │ subtotal         │       │ activo          │
│ activo      │       │ impuesto         │       └────────┬────────┘
└─────────────┘       │ total            │                │
                      │ estado           │                │
                      └────────┬─────────┘                │
                               │                          │
                               ▼                          │
                      ┌──────────────────┐               │
                      │ cotizacion_items │               │
                      ├──────────────────┤               │
                      │ id_cotizacion(FK)│◄──────────────┘
                      │ id_servicio (FK) │
                      │ cantidad         │
                      │ precio_unitario  │
                      │ subtotal_item    │
                      └──────────────────┘
```

## 🔧 Uso del Sistema

### 1. Página de Inicio
- Visualiza el portafolio de servicios
- Accede rápidamente a crear cotizaciones o registrar clientes
- Muestra estadísticas generales

### 2. Gestión de Clientes
- Agregar nuevos clientes con validación de email y teléfono
- Editar información existente
- Eliminar clientes (solo si no tienen cotizaciones)
- Exportar listado a CSV

### 3. Catálogo de Servicios
- Crear servicios con nombre, descripción y precio base
- Modificar precios y descripciones
- Eliminar servicios no utilizados
- Exportar catálogo a CSV

### 4. Cotizaciones
- Seleccionar cliente existente (obligatorio)
- Agregar múltiples servicios con cantidades personalizables
- Cálculo automático de subtotal, impuesto (8%) y total
- Estados: Pendiente, Aprobada, Rechazada, Completada
- Ver detalle completo de cada cotización

### 5. Reportes
- Filtrar cotizaciones por cliente
- Filtrar por rango de fechas
- Ver totales acumulados
- Exportar resultados filtrados a CSV

## 📊 Datos de Prueba

El sistema incluye datos demo:

**Servicios:**
- Mantenimiento Preventivo PC ($35.00)
- Formateo e Instalación SO ($50.00)
- Remoción de Malware ($45.00)
- Soporte Remoto por hora ($20.00)
- Y más...

**Clientes:**
- ACME, S.A. (acme@ejemplo.com)
- Juan Pérez (jperez@correo.com)
- María González (mgonzalez@email.com)
- Tech Solutions Inc.

**Cotizaciones de ejemplo** con ítems y totales calculados.

## 🛑 Comandos Útiles

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Detener los servicios
docker-compose down

# Reiniciar todo (elimina datos)
docker-compose down -v
docker-compose up -d

# Acceder a la base de datos
docker exec -it freelance_db mysql -u freelance_user -p freelance_db
```

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
1. Verificar que los contenedores estén corriendo: `docker-compose ps`
2. Esperar 30 segundos después de iniciar para que MariaDB termine de configurarse
3. Revisar logs: `docker-compose logs db`

### La página no carga
1. Verificar que el puerto 8080 esté libre
2. Revisar logs del contenedor web: `docker-compose logs web`

### phpMyAdmin no conecta
1. Usar credenciales: freelance_user / freelance123
2. El host debe ser "db" (no localhost)

## 👨‍💻 Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** PHP 8.2
- **Base de Datos:** MariaDB 10.11
- **Contenedores:** Docker & Docker Compose
- **Iconos:** Font Awesome 6
- **Fuentes:** Space Grotesk, JetBrains Mono

## 📝 Licencia

Proyecto desarrollado para fines educativos - Programación WEB III (2229)

---

**TechFix Pro** © 2025 | Sistema de Cotizaciones para Freelance
