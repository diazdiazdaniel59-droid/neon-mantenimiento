'use strict';

// Envuelve controladores async para propagar rechazos al middleware de errores.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
