'use strict';

// =============================================================================
// NEON :: ms-activos - Modelo de activo (Mongoose)
// =============================================================================

const mongoose = require('mongoose');
const { TIPOS, CRITICIDADES, ESTADOS } = require('../utils/validators');

const activoSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 60,
    },
    nombre: { type: String, required: true, trim: true, maxlength: 160 },
    tipo: { type: String, enum: TIPOS, default: 'equipo', index: true },
    marca: { type: String, trim: true, maxlength: 80 },
    modelo: { type: String, trim: true, maxlength: 80 },
    numero_serie: { type: String, trim: true, maxlength: 80 },
    ubicacion: { type: String, trim: true, maxlength: 160 },
    criticidad: { type: String, enum: CRITICIDADES, default: 'media', index: true },
    estado: { type: String, enum: ESTADOS, default: 'operativo', index: true },
    fecha_adquisicion: { type: Date },
    notas: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, versionKey: false }
);

activoSchema.index({ nombre: 'text', codigo: 'text' });

const Activo = mongoose.model('Activo', activoSchema);

function toPublic(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = obj;
  return { id: String(_id), ...rest };
}

module.exports = { Activo, toPublic };
