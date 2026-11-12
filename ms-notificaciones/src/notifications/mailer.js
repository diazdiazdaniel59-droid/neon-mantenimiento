'use strict';

// =============================================================================
// NEON :: ms-notificaciones - Transporte de alertas
//   - Transporte de consola: por defecto (SMTP_HOST vacio). Registra la alerta
//     en el log estructurado, ideal para desarrollo.
//   - Transporte SMTP: se activa cuando SMTP_HOST esta configurado.
// =============================================================================

const nodemailer = require('nodemailer');
const { config } = require('../config');
const { logger } = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

async function notify(notification) {
  if (!config.smtp.enabled) {
    logger.info('Notificacion (transporte de consola)', {
      to: config.smtp.to,
      subject: notification.subject,
      text: notification.text,
    });
    return { transport: 'console' };
  }

  await getTransporter().sendMail({
    from: config.smtp.from,
    to: config.smtp.to,
    subject: notification.subject,
    text: notification.text,
  });
  logger.info('Notificacion enviada por SMTP', {
    to: config.smtp.to,
    subject: notification.subject,
  });
  return { transport: 'smtp' };
}

module.exports = { notify };
