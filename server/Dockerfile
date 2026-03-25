FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent --no-audit --no-fund

# Copy source
COPY . .

# Use non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

ENV NODE_ENV=production
ENV PORT=8080

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- --timeout=2000 http://127.0.0.1:${PORT:-8080}/api/health || exit 1

CMD ["node", "./src/index.js"]
