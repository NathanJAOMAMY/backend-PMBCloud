# =============================================
# DOCKERFILE SÉCURISÉ - BACKEND PMBCLOUD
# Multi-stage + Non-root user
# =============================================

# Stage 1: Dépendances
FROM node:18-alpine AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci --only=production --silent --no-audit --no-fund

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app

# Installer curl pour health check
RUN apk add --no-cache curl

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodegroup && \
    adduser -S nodeuser -G nodegroup -u 1001

# Copier les dépendances et l'application
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodegroup . .

# Créer le dossier des logs avec bonnes permissions
RUN mkdir -p src/uploads && \
    chown -R nodeuser:nodegroup src/uploads && \
    chmod -R 750 src/uploads

# Sécurité: Supprimer les fichiers sensibles potentiels
RUN  rm -rf .git && \
    find . -name "*.md" -delete 2>/dev/null || true && \
    npm cache clean --force

# Utiliser l'utilisateur non-root
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Port d'écoute
EXPOSE 3001

# Commande de démarrage
CMD ["npm", "start"]