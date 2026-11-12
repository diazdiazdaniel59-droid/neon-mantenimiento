'use strict';

// =============================================================================
// NEON :: api-gateway - Verificacion de tokens JWT emitidos por ms-usuarios
// =============================================================================

const jwt = require('jsonwebtoken');
const { config } = require('../config');

function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer });
}

module.exports = { verifyToken };
