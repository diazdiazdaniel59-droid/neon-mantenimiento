# NEON - Sistema de Gestion de Mantenimiento

Plataforma empresarial de mantenimiento construida como monorepo de microservicios cloud-native (Grupo 8: Juan Luis De La Espriella & Daniel Diaz).

## Arquitectura

| Servicio | Tecnologia | Almacenamiento | Puerto |
| :--- | :--- | :--- | :--- |
| api-gateway | Node.js + Express + http-proxy-middleware | - | `3000:3000` |
| ms-usuarios | Node.js + Express + pg + bcryptjs + JWT | PostgreSQL `neon_usuarios_db` | interno `3001` |
| ms-activos | Node.js + Express + Mongoose | MongoDB `neon_activos_db` | interno `3002` |
| ms-ordenes | Node.js + Express + pg + amqplib | PostgreSQL `neon_ordenes_db` | interno `3003` |
| ms-inventario | Node.js + Express + pg | PostgreSQL `neon_inventario_db` | interno `3004` |
| ms-notificaciones | Node.js Worker + amqplib + nodemailer | Cola RabbitMQ | - |
| frontend | React 18 + Vite 8 + Nginx (SPA) | - | `8080:80` |
| rabbitmq | RabbitMQ 3 Management | AMQP | `5672` / `15672` |
| postgres | PostgreSQL 15 | Volumen `neon_pgdata` | `5432` |
| mongo | MongoDB 6 | Volumen `neon_mongodata` | `27017` |

Reglas: **Database-per-Service**, red bridge `neon-net`, cero valores quemados (todo por `.env`), punto unico de entrada en el Gateway (puerto 3000).

## FASE 1 - Arranque de la infraestructura

### Requisitos

- Docker Desktop (o Docker Engine + Docker Compose v2) en ejecucion.

### Pasos

```powershell
# 1) Crear el archivo de entorno local a partir de la plantilla
Copy-Item .env.example .env

# 2) Levantar la infraestructura (PostgreSQL, MongoDB, RabbitMQ)
docker compose up -d

# 3) Verificar contenedores activos (todos deben estar "healthy")
docker compose ps
```

### Verificaciones

```powershell
# 3 bases de datos creadas automaticamente por init-databases.sql
docker exec neon-postgres psql -U neon_admin -d postgres -c "\l"
docker exec neon-postgres psql -U neon_admin -d postgres -c "\du"

# Broker de mensajeria
docker exec neon-rabbitmq rabbitmq-diagnostics -q ping

# MongoDB
docker exec neon-mongo mongosh -u neon_admin -p mongo_dev_pass --quiet --eval "db.adminCommand('ping')"
```

- Consola RabbitMQ: <http://localhost:15672> (usuario `neon_app` / clave `rabbit_dev_pass`).

### Operacion

```powershell
docker compose logs -f postgres     # logs de un servicio
docker compose down                 # detener (conservar datos)
docker compose down -v              # detener y BORRAR volumenes (reset total)
```

> Los microservicios (perfil `app`) se levantan con
> `docker compose --profile app up -d --build` una vez que su codigo exista
> en las carpetas `api-gateway/`, `ms-*/` (fases siguientes).
>
> Desarrollo por fases: mientras no existan todos los backends, se puede
> levantar solo lo ya implementado, p. ej.
> `docker compose --profile app up -d --build ms-usuarios api-gateway`.
>
> Calidad en `ms-usuarios/`: `npm run lint` (ESLint) y `npm test` (node:test).

## API Gateway (punto unico de entrada)

El Gateway escucha en `http://localhost:3000`, verifica el JWT en el borde y
enruta a cada microservicio conservando la ruta original:

| Prefijo | Destino | Auth |
| :--- | :--- | :--- |
| `/auth/login`, `/auth/register` | ms-usuarios | publico |
| `/auth/*`, `/usuarios/*` | ms-usuarios | JWT |
| `/activos/*` | ms-activos | JWT |
| `/ordenes/*` | ms-ordenes | JWT |
| `/inventario/*` | ms-inventario | JWT |
| `/health` | api-gateway (local) | publico |

La identidad verificada se reenvia a los servicios internos en las cabeceras
`x-user-id`, `x-user-email` y `x-user-rol` (las entrantes se descartan).

## Eventos (RabbitMQ)

`ms-ordenes` publica eventos de dominio al exchange topic **`neon_events`**
(durable) tras confirmar la operacion en su base de datos:

| Routing key | Cuando | Consumidor |
| :--- | :--- | :--- |
| `orden.creada` | se crea una orden | ms-notificaciones |
| `orden.cerrada` | se cierra una orden (`POST /ordenes/:id/cerrar`) | ms-notificaciones |

La publicacion es *best-effort*: si el broker no esta disponible, la orden se
guarda igualmente y el fallo se registra en el log (conexion perezosa y
reconexion automatica).

`ms-notificaciones` es un worker (sin API HTTP) que declara la cola durable
`neon_notificaciones_queue`, la liga al exchange con el patron `orden.#` y, por
cada evento, compone una alerta. Con `SMTP_HOST` vacio usa el **transporte de
consola** (la alerta queda en el log); si se configura SMTP, la envia por correo
a `NOTIF_TO_EMAIL` (o `SMTP_FROM`). Reconexion automatica ante caidas del broker.

### Endpoints de activos, ordenes e inventario (a traves del Gateway)

- `ms-activos`: `GET/POST /activos`, `GET/PATCH/DELETE /activos/:id`
  (escritura: admin/supervisor; borrado: admin).
- `ms-ordenes`: `GET/POST /ordenes`, `GET/PATCH/DELETE /ordenes/:id`,
  `POST /ordenes/:id/iniciar`, `POST /ordenes/:id/cerrar`
  (creacion: admin/supervisor; trabajo y cierre: admin/supervisor/tecnico).
- `ms-inventario`: `GET/POST /inventario/repuestos`,
  `GET/PATCH/DELETE /inventario/repuestos/:id`,
  `GET/POST /inventario/repuestos/:id/movimientos`, `GET /inventario/movimientos`
  (escritura repuestos: admin/supervisor; movimientos de stock: admin/supervisor/tecnico).
  El **stock no se edita por PATCH**: solo cambia registrando movimientos
  (`entrada` suma, `salida` resta y rechaza con 409 si no alcanza, `ajuste` fija
  el valor contado). Cada movimiento es atomico (bloqueo de fila `FOR UPDATE`).

## Frontend (SPA React)

SPA que consume **unicamente** el API Gateway. Se compila con Vite y se sirve
con Nginx (fallback de rutas de React Router) en <http://localhost:8080>.

```powershell
# Levantar la SPA (y sus dependencias) ya construida:
docker compose --profile app up -d --build frontend
```

- La URL del API se fija en build-time con el build arg `VITE_API_URL`
  (por defecto `http://localhost:3000`, accesible desde el navegador).
- Pantallas: `login/registro`, panel de indicadores, ordenes (alta/detalle,
  `iniciar`/`cerrar`), activos, inventario de repuestos (con movimientos de
  stock) y usuarios (solo admin/supervisor).
- **Acta de Cierre en PDF**: en el detalle de una orden cerrada se genera, en el
  navegador con jsPDF (cargado bajo demanda), un acta con folio, datos del
  activo/tecnico, descripcion, solucion y firmas.
- Calidad en `frontend/`: `npm run lint` (ESLint 9 + eslint-plugin-react),
  `npm test` (node:test) y `npm run build` (Vite).

## Fases

- [x] **FASE 1** - Infraestructura raiz y contenedores base
- [x] FASE 2a - ms-usuarios (login JWT + gestion de usuarios)
- [x] FASE 2b - API Gateway (proxy + verificacion JWT en el borde)
- [x] FASE 3 - ms-activos + ms-ordenes + eventos RabbitMQ
- [x] FASE 4 - ms-inventario + ms-notificaciones
- [x] FASE 5 - Frontend React + Acta de Cierre en PDF
