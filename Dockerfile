# Stage 1: Build the static site
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# woff2_decompress fuer scripts/og.mjs: die OG-Karten werden mit den echten
# Markenfonts gerendert, und die liegen nach dem Build nur als woff2 vor —
# fontconfig, das librsvg in sharp benutzt, liest kein woff2.
RUN apk add --no-cache woff2

WORKDIR /app

# Copy manifests first so the dependency layer is cached independently of source changes.
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# News/devlog media, in its own layer before the source copy: ~550 MB of
# originals are fetched once and re-encoded to WebP, and the layer is reused on
# every later build. MEDIA_DIGEST is a digest of the media host's file listing —
# it changes only when a file is added there, which is what busts the layer.
# Only the WebP output ends up in dist/; the originals stay in .media-cache.
COPY scripts/media.mjs ./scripts/
ARG MEDIA_DIGEST=local
RUN echo "media digest: $MEDIA_DIGEST" && node scripts/media.mjs

COPY . .
ENV NODE_ENV=production

# Ladungsfaehige Anschrift fuer /impressum und /datenschutz. Kommt aus GH-Secrets,
# damit sie nicht im oeffentlichen Repo und nicht in der Commit-History steht.
# Einzeilig, Felder mit " | " getrennt: build-args parst pro Zeile ein KEY=VALUE,
# ein mehrzeiliges Secret zerfiele dort in kaputte Args.
# Nur diese Stage sieht die Werte — Stage 2 kopiert allein das fertige dist/ und
# erbt weder ARG noch ENV, die Image-History bleibt sauber.
ARG IMPRESSUM_ADDRESS=""
ARG IMPRESSUM_PHONE=""
ENV IMPRESSUM_ADDRESS=$IMPRESSUM_ADDRESS
ENV IMPRESSUM_PHONE=$IMPRESSUM_PHONE

RUN pnpm run build

# ------------------------------------------------------------

# Stage 2: Serve the static output with nginx. No Node process in production.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/health.html || exit 1
