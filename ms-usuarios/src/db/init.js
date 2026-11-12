'use strict';

// =============================================================================
// NEON :: ms-usuarios - Inicializacion del esquema (idempotente)
// Crea la tabla `usuarios`, sus indices y el trigger de updated_at.
// Opcionalmente siembra un administrador inicial (SEED_ADMIN_*).
// =============================================================================

const bcrypt = require('bcryptjs');
const { pool } = require('./pool');
const { config } = require('../config');
const { logger } = require('../utils/logger');

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol           VARCHAR(20)  NOT NULL DEFAULT 'tecnico'
                  CHECK (rol IN ('admin', 'supervisor', 'tecnico', 'cliente')),
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
`;

const CREATE_INDEX_SQL = `
  CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email ON usuarios (email);
  CREATE INDEX IF NOT EXISTS ix_usuarios_rol ON usuarios (rol);
`;

const CREATE_TRIGGER_SQL = `
  CREATE OR REPLACE FUNCTION neon_set_updated_at()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
  CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION neon_set_updated_at();
`;

async function seedAdmin() {
  const { email, password, nombre } = config.seedAdmin;
  if (!email || !password) return;

  const normalizedEmail = email.toLowerCase().trim();
  const { rowCount } = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [normalizedEmail]);
  if (rowCount > 0) return;

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [nombre, normalizedEmail, passwordHash]
  );
  logger.info('Usuario administrador inicial asegurado', { email: normalizedEmail });
}

async function seedTecnicos() {
  const tecnicos = [
    { email: 'juan.tecnico@neon.com', password: 'tecnico123', nombre: 'Juan Técnico' },
    { email: 'daniel.tecnico@neon.com', password: 'tecnico123', nombre: 'Daniel Técnico' },
  ];

  for (const t of tecnicos) {
    const normalizedEmail = t.email.toLowerCase().trim();
    const { rowCount } = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [normalizedEmail]);
    if (rowCount > 0) continue;

    const passwordHash = await bcrypt.hash(t.password, config.bcryptRounds);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, 'tecnico')
       ON CONFLICT (email) DO NOTHING`,
      [t.nombre, normalizedEmail, passwordHash]
    );
    logger.info('Usuario técnico inicial asegurado', { email: normalizedEmail });
  }
}

async function ensureSchema() {
  await pool.query(CREATE_TABLE_SQL);
  await pool.query(CREATE_INDEX_SQL);
  await pool.query(CREATE_TRIGGER_SQL);
  await seedAdmin();
  await seedTecnicos();
  logger.info('Esquema de usuarios verificado');
}

module.exports = { ensureSchema };
