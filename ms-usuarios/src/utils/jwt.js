'use strict';

// =============================================================================
// NEON :: ms-usuarios - Firma y verificacion de tokens JWT (stack declarado)
// =============================================================================

const jwt = require('jsonwebtoken');
const { config } = require('../config');

function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    issuer: config.jwt.issuer,
    expiresIn: config.jwt.expiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, { issuer: config.jwt.issuer });
}

module.exports = { signToken, verifyToken };
