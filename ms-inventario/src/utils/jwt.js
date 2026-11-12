'use strict';

// =============================================================================
// NEON :: ms-inventario - Verificacion de tokens JWT
// =============================================================================

const jwt = require('jsonwebtoken');
const { config } = require('../config');

function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer });
}

module.exports = { verifyToken };
