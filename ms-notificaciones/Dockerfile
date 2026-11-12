# =============================================================================
# NEON :: ms-notificaciones - Imagen de produccion (worker + API de historial)
# =============================================================================
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Capa de dependencias (aprovecha cache de Docker)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Codigo fuente
COPY src ./src

EXPOSE 3005
USER node
CMD ["node", "src/server.js"]
