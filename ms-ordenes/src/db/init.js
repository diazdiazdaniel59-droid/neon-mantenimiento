'use strict';

// =============================================================================
// NEON :: ms-ordenes - Inicializacion del esquema (idempotente)
// Crea la tabla `ordenes`, sus indices y el trigger de updated_at.
// =============================================================================

const { pool } = require('./pool');
const { logger } = require('../utils/logger');

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ordenes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id    UUID      NOT NULL,
    activo_id     VARCHAR(120) NOT NULL DEFAULT '',
    activo_nombre VARCHAR(160),
    titulo        VARCHAR(160) NOT NULL DEFAULT '',
    tipo          VARCHAR(20) NOT NULL
                  CHECK (tipo IN ('preventivo', 'correctivo', 'predictivo', 'mejora')),
    prioridad     VARCHAR(10) NOT NULL DEFAULT 'media'
                  CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    estado        VARCHAR(20) NOT NULL DEFAULT 'abierta'
                  CHECK (estado IN ('abierta', 'en_proceso', 'en_espera', 'cerrada', 'cancelada')),
    descripcion   TEXT      NOT NULL,
    tecnico_id    UUID,
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_cierre  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    evidencia_base64 TEXT NULL,
    evidencia_nombre VARCHAR(255) NULL
  );
`;

const CREATE_ORDENES_REPUESTOS_SQL = `
  CREATE TABLE IF NOT EXISTS ordenes_repuestos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id       UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    repuesto_id    UUID NOT NULL,  -- Referencia a ms-inventario (FK lógica, no enforzada cross-service)
    cantidad       INTEGER NOT NULL CHECK (cantidad > 0),
    nota           VARCHAR(500),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

const ALTER_TABLE_SQL = `
  ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS activo_id VARCHAR(120) NOT NULL DEFAULT '';
  ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS activo_nombre VARCHAR(160);
  ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS titulo VARCHAR(160) NOT NULL DEFAULT '';
  UPDATE ordenes SET titulo = LEFT(descripcion, 160) WHERE titulo = '';
  ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS evidencia_base64 TEXT;
  ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS evidencia_nombre VARCHAR(255);
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS ix_ordenes_cliente_id ON ordenes (cliente_id);
  CREATE INDEX IF NOT EXISTS ix_ordenes_tecnico_id ON ordenes (tecnico_id);
  CREATE INDEX IF NOT EXISTS ix_ordenes_estado ON ordenes (estado);
  CREATE INDEX IF NOT EXISTS ix_ordenes_created_at ON ordenes (created_at DESC);
  CREATE INDEX IF NOT EXISTS ix_ordenes_repuestos_orden_id ON ordenes_repuestos (orden_id);
  CREATE INDEX IF NOT EXISTS ix_ordenes_repuestos_repuesto_id ON ordenes_repuestos (repuesto_id);
`;

const CREATE_TRIGGER_SQL = `
  CREATE OR REPLACE FUNCTION neon_set_updated_at()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_ordenes_updated_at ON ordenes;
  CREATE TRIGGER trg_ordenes_updated_at
  BEFORE UPDATE ON ordenes
  FOR EACH ROW EXECUTE FUNCTION neon_set_updated_at();
`;

async function ensureSchema() {
  await pool.query(CREATE_TABLE_SQL);
  await pool.query(CREATE_ORDENES_REPUESTOS_SQL);
  await pool.query(ALTER_TABLE_SQL);
  await pool.query(CREATE_INDEX_SQL);
  await pool.query(CREATE_TRIGGER_SQL);
  logger.info('Esquema de ordenes verificado');
}

module.exports = { ensureSchema };
