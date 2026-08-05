# Stage 1: Build the static site
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy manifests first so the dependency layer is cached independently of source changes.
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# News/devlog media, in its own layer before the source copy: ~550 MB of
# originals are fetched once and re-encoded to WebP, and the layer is reused on
# every later build. MEDIA_KEY is a digest of the media host's file listing —
# it changes only when a file is added there, which is what busts the layer.
# Only the WebP output ends up in dist/; the originals stay in .media-cache.
COPY scripts/media.mjs ./scripts/
ARG MEDIA_KEY=local
RUN echo "media key: $MEDIA_KEY" && node scripts/media.mjs

COPY . .
ENV NODE_ENV=production
RUN pnpm run build

# ------------------------------------------------------------

# Stage 2: Serve the static output with nginx. No Node process in production.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/health.html || exit 1
