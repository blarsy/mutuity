FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json

RUN npm ci

COPY frontend frontend

RUN npm --workspace frontend run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json

RUN npm ci --omit=dev

COPY frontend frontend
COPY --from=builder /app/frontend/.next frontend/.next

EXPOSE 3000

CMD ["npm", "--workspace", "frontend", "run", "start"]
