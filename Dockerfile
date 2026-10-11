# =============================================================================
# Dockerfile — Sistema de Reservas de Salas de Biblioteca
# Imagen multi-stage: build ligero y producción mínima
# =============================================================================

# ── Etapa 1: dependencias de producción ──────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Copiar solo los manifiestos para aprovechar cache de Docker
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# ── Etapa 2: imagen final de producción ──────────────────────────────────────
FROM node:18-alpine AS production

# Metadata
LABEL maintainer="Equipo 5 - Ingeniería de Software"
LABEL description="API REST Sistema de Reservas de Salas de Biblioteca"
LABEL version="1.0.0"

WORKDIR /app

# Crear usuario sin privilegios para ejecutar la app (seguridad)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar el código fuente, la base de datos y el frontend
COPY src/ ./src/
COPY database/ ./database/
COPY public/ ./public/

# Crear directorio para la base de datos con permisos correctos
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Cambiar al usuario sin privilegios
USER appuser

# Variables de entorno por defecto (sobreescribibles en runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/biblioteca.db

# Exponer el puerto de la API
EXPOSE 3000

# Health check: verifica que la API responda cada 30 segundos
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Comando de inicio
CMD ["node", "src/app.js"]
