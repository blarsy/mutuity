FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_GRAPHQL_URL
ARG NEXT_PUBLIC_GRAPHQL_WS_URL
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_DEFAULT_LOCALE
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_TOKEN_BALANCE_POLL_INTERVAL_MS
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ARG NEXT_PUBLIC_SENTRY_RELEASE
ARG NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE

ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL
ENV NEXT_PUBLIC_GRAPHQL_WS_URL=$NEXT_PUBLIC_GRAPHQL_WS_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD=$NEXT_PUBLIC_CLOUDINARY_CLOUD
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_TOKEN_BALANCE_POLL_INTERVAL_MS=$NEXT_PUBLIC_TOKEN_BALANCE_POLL_INTERVAL_MS
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT
ENV NEXT_PUBLIC_SENTRY_RELEASE=$NEXT_PUBLIC_SENTRY_RELEASE
ENV NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=$NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json

RUN npm ci

COPY frontend frontend

RUN npm --workspace frontend run build

FROM scratch AS artifacts

COPY --from=builder /app/.monitoring-artifacts/frontend /frontend

FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json

RUN npm ci --omit=dev

# Explicit runtime inputs keep host/build monitoring artifacts out of the image,
# even if a local artifact directory has not yet been added to .dockerignore.
COPY --from=builder /app/frontend/public frontend/public
COPY --from=builder /app/frontend/next.config.mjs /app/frontend/legacyAppRedirects.cjs frontend/
COPY --from=builder /app/frontend/.next frontend/.next

EXPOSE 3000

CMD ["npm", "--workspace", "frontend", "run", "start"]
