'use strict';

// =============================================================================
// NEON :: ms-ordenes - Controlador de ordenes de mantenimiento
//   POST   /ordenes        (cliente, tecnico, admin, supervisor)
//   GET    /ordenes        (admin, supervisor)
//   GET    /ordenes/mis-ordenes (cliente, tecnico, admin, supervisor)
//   GET    /ordenes/:id    (cliente: propia; tecnico: asignada; admin/supervisor: cualquiera)
//   PATCH  /ordenes/:id    (admin/supervisor: cualquier campo; tecnico: asignada; cliente: cancelar propia)
//   DELETE /ordenes/:id    (admin: cualquier; cliente: propia si esta abierta)
// =============================================================================

const ordenesService = require('../services/ordenes.service');
const { HttpError } = require('../utils/httpError');
const { requiredString, optionalString, oneOf, uuid, integer } = require('../utils/validators');

const TIPOS = ['preventivo', 'correctivo', 'predictivo', 'mejora'];
const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];

async function create(req, res) {
  const cliente_id = uuid(req.user.id, 'cliente_id');
  const activo_id = requiredString(req.body.activo_id, 'activo_id', { min: 1, max: 120 });
  const activo_nombre = optionalString(req.body.activo_nombre, 'activo_nombre', { max: 160 });
  const titulo = requiredString(req.body.titulo, 'titulo', { min: 3, max: 160 });
  const tipo = oneOf(req.body.tipo, TIPOS, 'tipo');
  const prioridad = oneOf(req.body.prioridad, PRIORIDADES, 'prioridad', { required: false }) || 'media';
  const descripcion = requiredString(req.body.descripcion, 'descripcion', { min: 10, max: 2000 });
  const tecnico_id = req.body.tecnico_id ? uuid(req.body.tecnico_id, 'tecnico_id') : undefined;

  const orden = await ordenesService.createOrden({
    cliente_id, activo_id, activo_nombre, titulo, tipo, prioridad, descripcion, tecnico_id,
  });
  res.status(201).json({ orden });
}

async function list(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), req.app.locals.maxPageSize || 100);

  const search = req.query.search ? String(req.query.search).trim() : undefined;
  const estado = req.query.estado ? oneOf(req.query.estado, ['abierta', 'en_proceso', 'en_espera', 'cerrada', 'cancelada'], 'estado', { required: false }) : undefined;
  const prioridad = req.query.prioridad ? oneOf(req.query.prioridad, ['baja', 'media', 'alta', 'urgente'], 'prioridad', { required: false }) : undefined;
  const tipo = req.query.tipo ? oneOf(req.query.tipo, TIPOS, 'tipo', { required: false }) : undefined;
  const cliente_id = req.query.cliente_id ? uuid(req.query.cliente_id, 'cliente_id') : undefined;
  const tecnico_id = req.query.tecnico_id ? uuid(req.query.tecnico_id, 'tecnico_id') : undefined;

  const result = await ordenesService.listOrdenes({ page, limit, search, estado, prioridad, tipo, cliente_id, tecnico_id });
  res.json(result);
}

async function misOrdenes(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), req.app.locals.maxPageSize || 100);

  const search = req.query.search ? String(req.query.search).trim() : undefined;
  const estado = req.query.estado ? oneOf(req.query.estado, ['abierta', 'en_proceso', 'en_espera', 'cerrada', 'cancelada'], 'estado', { required: false }) : undefined;

  // Un tecnico ve las ordenes asignadas a él; un cliente ve las suyas propias.
  // Admin y supervisor ven todas las ordenes.
  let extraFilters = {};
  if (req.user.rol === 'tecnico') extraFilters = { tecnico_id: req.user.id };
  else if (req.user.rol === 'cliente') extraFilters = { cliente_id: req.user.id };

  const result = await ordenesService.listOrdenes({
    page, limit, search, estado,
    ...extraFilters,
  });
  res.json(result);
}

async function getOne(req, res) {
  const id = uuid(req.params.id, 'id');
  const orden = await ordenesService.getOrdenConRepuestos(id);
  if (!orden) throw HttpError.notFound('Orden no encontrada');

  if (!ordenesService.puedeVerOrden(orden, req.user)) {
    throw HttpError.forbidden('No tiene permiso para ver esta orden');
  }

  res.json({ orden, consumos: orden.consumos });
}

async function update(req, res) {
  const id = uuid(req.params.id, 'id');
  const orden = await ordenesService.getOrdenById(id);
  if (!orden) throw HttpError.notFound('Orden no encontrada');

  const isTecnico = req.user.rol === 'tecnico';
  const isCliente = req.user.rol === 'cliente';

  // Cliente solo puede cancelar su propia orden (usa la logica de cancelacion,
  // que valida estado, registra fecha_cierre y publica el evento).
  if (isCliente) {
    if (orden.cliente_id !== req.user.id) {
      throw HttpError.forbidden('No tiene permiso para modificar esta orden');
    }
    if (req.body.estado !== 'cancelada') {
      throw HttpError.badRequest('Un cliente solo puede cancelar su propia orden');
    }
    const actualizada = await ordenesService.cancelarOrden(id, req.user);
    return res.json({ orden: actualizada });
  }

  // Tecnico solo puede actualizar ordenes asignadas a él
  if (isTecnico) {
    if (orden.tecnico_id !== req.user.id) {
      throw HttpError.forbidden('No tiene permiso para modificar esta orden');
    }
    const updates = {};
    if (req.body.estado !== undefined) updates.estado = oneOf(req.body.estado, ['en_proceso', 'en_espera', 'cerrada'], 'estado', { required: false });
    if (req.body.descripcion !== undefined) updates.descripcion = requiredString(req.body.descripcion, 'descripcion', { min: 10, max: 2000 });
    if (req.body.evidencia_base64 !== undefined) updates.evidencia_base64 = req.body.evidencia_base64;
    if (req.body.evidencia_nombre !== undefined) updates.evidencia_nombre = req.body.evidencia_nombre;
    if (Object.keys(updates).length === 0) {
      throw HttpError.badRequest('No se enviaron campos para actualizar');
    }
    const actualizada = await ordenesService.updateOrden(id, updates, req.user);
    return res.json({ orden: actualizada });
  }

  // Admin y supervisor pueden actualizar cualquier orden
  const updates = {};
  if (req.body.tipo !== undefined) updates.tipo = oneOf(req.body.tipo, TIPOS, 'tipo');
  if (req.body.prioridad !== undefined) updates.prioridad = oneOf(req.body.prioridad, PRIORIDADES, 'prioridad');
  if (req.body.estado !== undefined) updates.estado = oneOf(req.body.estado, ['abierta', 'en_proceso', 'en_espera', 'cerrada', 'cancelada'], 'estado');
  if (req.body.descripcion !== undefined) updates.descripcion = requiredString(req.body.descripcion, 'descripcion', { min: 10, max: 2000 });
  if (req.body.tecnico_id !== undefined) updates.tecnico_id = uuid(req.body.tecnico_id, 'tecnico_id');
  if (req.body.evidencia_base64 !== undefined) updates.evidencia_base64 = req.body.evidencia_base64;
  if (req.body.evidencia_nombre !== undefined) updates.evidencia_nombre = req.body.evidencia_nombre;

  if (Object.keys(updates).length === 0) {
    throw HttpError.badRequest('No se enviaron campos para actualizar');
  }

  const actualizada = await ordenesService.updateOrden(id, updates, req.user);
  res.json({ orden: actualizada });
}

async function cancelar(req, res) {
  const id = uuid(req.params.id, 'id');
  const cancelada = await ordenesService.cancelarOrden(id, req.user);
  res.json({ orden: cancelada });
}

async function agregarRepuesto(req, res) {
  const id = uuid(req.params.id, 'id');
  const orden = await ordenesService.getOrdenById(id);
  if (!orden) throw HttpError.notFound('Orden no encontrada');

  // Verificar permisos: técnico asignado, admin o supervisor
  const isAdmin = req.user.rol === 'admin';
  const isSupervisor = req.user.rol === 'supervisor';
  const isTecnico = req.user.rol === 'tecnico' && orden.tecnico_id === req.user.id;

  if (!isAdmin && !isSupervisor && !isTecnico) {
    throw HttpError.forbidden('No tiene permiso para registrar consumo en esta orden');
  }

  const repuesto_id = uuid(req.body.repuesto_id, 'repuesto_id');
  const cantidad = integer(req.body.cantidad, 'cantidad', { min: 1 });
  const nota = optionalString(req.body.nota, 'nota', { max: 500 });

  const consumo = await ordenesService.agregarRepuestoConsumido(id, { repuesto_id, cantidad, nota });
  res.status(201).json({ consumo });
}

async function listarRepuestos(req, res) {
  const id = uuid(req.params.id, 'id');
  const orden = await ordenesService.getOrdenById(id);
  if (!orden) throw HttpError.notFound('Orden no encontrada');

  if (!ordenesService.puedeVerOrden(orden, req.user)) {
    throw HttpError.forbidden('No tiene permiso para ver esta orden');
  }

  const consumos = await ordenesService.listarRepuestosConsumidos(id);
  res.json({ consumos });
}

module.exports = { create, list, misOrdenes, getOne, update, cancelar, agregarRepuesto, listarRepuestos };
