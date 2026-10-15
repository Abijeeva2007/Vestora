# ==============================================================================
# AccessAble AI — Production Container Image
# BYTEATHON 2026: Problem Statement BYTE03 "The Invisible Barrier"
# ==============================================================================
# Multi-stage container using official Playwright Ubuntu image to ensure
# all Linux shared libraries (libnss3, libatk, libcups, etc.) are available for
# real headless Chromium axe-core scans and user journeys.
# ==============================================================================

FROM mcr.microsoft.com/playwright:v1.50.0-jammy AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV STORAGE_DIR=/data
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Ensure persistent storage directory exists
RUN mkdir -p /data && chmod 777 /data

# Copy package descriptors from frontend
COPY frontend/package.json frontend/package-lock.json ./

# Install full production and browser dependencies
RUN npm ci --include=dev && \
    npx playwright install --with-deps chromium

# Copy application source code
COPY frontend/ ./

# Build Next.js production bundle using Webpack compiler
RUN npm run build

# Expose production port
EXPOSE 3000

# Healthcheck probe using the dedicated endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:" + (process.env.PORT || 3000) + "/api/health").then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))'

# Start production server bound to 0.0.0.0
CMD ["npm", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
