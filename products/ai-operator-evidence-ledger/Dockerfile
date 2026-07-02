# Single web service for Cloud Run.
# No build step: the service runs straight from source on Node's runtime.
FROM node:20-slim

WORKDIR /app

# Only package.json is needed; there are no runtime dependencies to install.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src

# Cloud Run injects PORT; the server reads it and binds 0.0.0.0.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/server.js"]
