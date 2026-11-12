'use strict';

// =============================================================================
// NEON :: ms-inventario - Inicializacion del esquema (idempotente)
// Crea las tablas `items` y `movimientos_inventario`, indices y trigger.
// =============================================================================

const { pool } = require('./pool');
const { logger } = require('../utils/logger');

const CREATE_ITEMS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku           VARCHAR(50) NOT NULL UNIQUE,
    nombre        VARCHAR(160) NOT NULL,
    descripcion   TEXT,
    tipo          VARCHAR(20) NOT NULL
                  CHECK (tipo IN ('repuesto', 'herramienta', 'insumo', 'servicio')),
    unidad        VARCHAR(20) NOT NULL
                  CHECK (unidad IN ('pieza', 'litro', 'metro', 'kg', 'caja', 'rollo', 'juego')),
    precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_actual  INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo  INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    ubicacion     VARCHAR(120),
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

// Migraciones idempotentes para bases de datos ya existentes.
const ALTER_TABLE_SQL = `
  ALTER TABLE items ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(120);
`;

const CREATE_MOVIMIENTOS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id        UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) NOT NULL
                    CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste')),
    cantidad       INTEGER NOT NULL CHECK (cantidad > 0),
    motivo         VARCHAR(200),
    usuario_id     UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS ix_items_sku ON items (sku);
  CREATE INDEX IF NOT EXISTS ix_items_tipo ON items (tipo);
  CREATE INDEX IF NOT EXISTS ix_items_activo ON items (activo);
  CREATE INDEX IF NOT EXISTS ix_items_stock_bajo ON items (stock_actual) WHERE stock_actual <= stock_minimo;
  CREATE INDEX IF NOT EXISTS ix_movimientos_item_id ON movimientos_inventario (item_id);
  CREATE INDEX IF NOT EXISTS ix_movimientos_created_at ON movimientos_inventario (created_at DESC);
`;

const CREATE_TRIGGER_SQL = `
  CREATE OR REPLACE FUNCTION neon_set_updated_at()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_items_updated_at ON items;
  CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION neon_set_updated_at();
`;

async function ensureSchema() {
  await pool.query(CREATE_ITEMS_TABLE_SQL);
  await pool.query(ALTER_TABLE_SQL);
  await pool.query(CREATE_MOVIMIENTOS_TABLE_SQL);
  await pool.query(CREATE_INDEX_SQL);
  await pool.query(CREATE_TRIGGER_SQL);
  logger.info('Esquema de inventario verificado');
}

module.exports = { ensureSchema };
