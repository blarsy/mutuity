FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --workspace backend --include-workspace-root=false

COPY backend backend

RUN npm --workspace backend run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --workspace backend --include-workspace-root=false --omit=dev \
    && npm cache clean --force

COPY --from=builder /app/backend/dist backend/dist
COPY backend/.env.example backend/.env.example
COPY backend/crontab backend/crontab

EXPOSE 5050

CMD ["npm", "--workspace", "backend", "run", "start"]
