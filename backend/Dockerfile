FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

COPY backend backend

RUN npm --workspace backend run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist backend/dist
COPY backend/.env.example backend/.env.example

EXPOSE 5000

CMD ["npm", "--workspace", "backend", "run", "start"]
