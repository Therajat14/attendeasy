# syntax=docker/dockerfile:1

# One image for the whole project: the React build compiled into the image, and
# the Express API that serves both it and the JSON.
#
# The layout in the final stage matters. app.js looks for the frontend at
# ../../client/dist relative to itself, so the server has to stay at
# /app/server and the built client has to stay at /app/client/dist.


# ---------------------------------------------------------------------------
# Stage 1 - build the frontend
# ---------------------------------------------------------------------------
FROM node:22-alpine AS client

WORKDIR /build/client

# Copy the manifests on their own so this layer is reused whenever only the
# source code changes, instead of re-downloading packages on every build.
COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./

# Vite bakes this value into the JavaScript at build time, so it has to be
# supplied here rather than at runtime. The default is the same origin that
# serves this image, which is what the single-container setup needs.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build


# ---------------------------------------------------------------------------
# Stage 2 - production dependencies for the API
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /build/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev


# ---------------------------------------------------------------------------
# Stage 3 - runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

# curl is only here for the container healthcheck below.
RUN apk add --no-cache curl

ENV NODE_ENV=production \
    PORT=5000 \
    WEB_CONCURRENCY=auto

WORKDIR /app/server

COPY --from=deps    /build/server/node_modules ./node_modules
COPY server/package.json ./package.json
COPY server/src ./src
COPY server/docker-entrypoint.sh ./docker-entrypoint.sh

COPY --from=client  /build/client/dist /app/client/dist

# The image already contains no secrets, so these two exist only to hold the
# values the container is started with. Any real secret belongs in the host's
# environment or secret store, not in an image layer.
ENV MONGO_URI=mongodb://127.0.0.1:27017/attendeasy \
    JWT_SECRET=change-me-in-the-container-environment \
    FRONTEND_URL=http://localhost:8080

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/" > /dev/null || exit 1

# exec form, so the server becomes PID 1's child and receives SIGTERM directly.
# PID 1 then runs the entrypoint, which seeds on the first boot and starts the
# API with exec so Node itself ends up as PID 1 and still gets its shutdown
# signals.
ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
