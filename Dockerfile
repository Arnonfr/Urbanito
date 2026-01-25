# Dockerfile - Multi-stage build for smaller image
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
# Install all dependencies (including devDeps) for build
RUN npm ci
COPY . .
# Build the application
RUN npm run build
# Prune dev dependencies for production
RUN npm prune --production

FROM node:20-slim
WORKDIR /app

# Copy only production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
# Copy built assets
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY server.js ./

ENV PORT=8080
EXPOSE 8080

USER node

CMD ["node", "server.js"]
