-- =============================================================================
-- NEON :: init-databases.sql
-- FASE 1 - Inicializacion automatica de PostgreSQL (patron Database-per-Service)
--
-- Este archivo vive en ./init-scripts y se monta en /docker-entrypoint-initdb.d.
-- Se ejecuta UNICAMENTE en el primer arranque del contenedor (volumen vacio).
-- Crea 3 bases de datos independientes, cada una con su propio rol/usuario:
--   neon_usuarios_db    -> neon_usuarios_user   (ms-usuarios)
--   neon_ordenes_db     -> neon_ordenes_user    (ms-ordenes)
--   neon_inventario_db  -> neon_inventario_user (ms-inventario)
--
-- Ningun servicio comparte esquema, conexion ni credenciales con otro.
-- =============================================================================

\set ON_ERROR_STOP on

-- Passwords tomadas de las variables de entorno del contenedor postgres.
-- Si la variable no existe, se usa el fallback de DESARROLLO LOCAL.
\set pass_usuarios   `printenv NEON_USUARIOS_DB_PASSWORD || echo 'neon_usuarios_dev_pass'`
\set pass_ordenes    `printenv NEON_ORDENES_DB_PASSWORD || echo 'neon_ordenes_dev_pass'`
\set pass_inventario `printenv NEON_INVENTARIO_DB_PASSWORD || echo 'neon_inventario_dev_pass'`

-- ---------------------------------------------------------------------------
-- 1) ROLES: un usuario dedicado e inmutable por servicio
-- ---------------------------------------------------------------------------
CREATE ROLE neon_usuarios_user   LOGIN PASSWORD :'pass_usuarios';
CREATE ROLE neon_ordenes_user    LOGIN PASSWORD :'pass_ordenes';
CREATE ROLE neon_inventario_user LOGIN PASSWORD :'pass_inventario';

-- ---------------------------------------------------------------------------
-- 2) BASES DE DATOS: una base independiente por servicio (owner = su rol)
-- ---------------------------------------------------------------------------
CREATE DATABASE neon_usuarios_db   OWNER neon_usuarios_user;
CREATE DATABASE neon_ordenes_db    OWNER neon_ordenes_user;
CREATE DATABASE neon_inventario_db OWNER neon_inventario_user;

-- ---------------------------------------------------------------------------
-- 3) AISLAMIENTO: cada base solo es visible/conectable por su propio rol.
--    Se elimina el acceso generico de PUBLIC a schema y a la base.
-- ---------------------------------------------------------------------------

-- neon_usuarios_db
REVOKE ALL ON DATABASE neon_usuarios_db FROM PUBLIC;
GRANT CONNECT ON DATABASE neon_usuarios_db TO neon_usuarios_user;
\c neon_usuarios_db
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO neon_usuarios_user;

-- neon_ordenes_db
REVOKE ALL ON DATABASE neon_ordenes_db FROM PUBLIC;
GRANT CONNECT ON DATABASE neon_ordenes_db TO neon_ordenes_user;
\c neon_ordenes_db
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO neon_ordenes_user;

-- neon_inventario_db
REVOKE ALL ON DATABASE neon_inventario_db FROM PUBLIC;
GRANT CONNECT ON DATABASE neon_inventario_db TO neon_inventario_user;
\c neon_inventario_db
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO neon_inventario_user;

\echo 'NEON: bases de datos neon_usuarios_db, neon_ordenes_db y neon_inventario_db creadas correctamente.'
