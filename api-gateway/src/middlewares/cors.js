'use strict';

// =============================================================================
// NEON :: api-gateway - CORS en el borde (unico punto de entrada).
// Permite que el frontend (fase posterior) consuma el Gateway.
// =============================================================================

const { config } = require('../config');

function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}

module.exports = { cors };
