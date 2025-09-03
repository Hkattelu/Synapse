# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies (only production)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server and remotion entry
COPY server ./server
COPY src ./src

# Expose and run
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/index.mjs"]

