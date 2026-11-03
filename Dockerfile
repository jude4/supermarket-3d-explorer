# syntax=docker/dockerfile:1.7
FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=proxy_ca if [ -f /run/secrets/proxy_ca ]; then NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm ci; else npm ci; fi
COPY server/package.json server/package-lock.json ./server/
# Prisma uses the official JavaScript PostgreSQL adapter; native engine postinstall is unnecessary.
RUN --mount=type=secret,id=proxy_ca if [ -f /run/secrets/proxy_ca ]; then NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm --prefix server ci --ignore-scripts; else npm --prefix server ci --ignore-scripts; fi
COPY . .
RUN DATABASE_URL=postgresql://localhost/supermarket npm --prefix server run prisma:generate
RUN npm run build:all
RUN npm --prefix server prune --omit=dev --ignore-scripts --no-audit --no-fund && rm -rf node_modules
EXPOSE 3001
CMD ["sh","-c","npm --prefix server run db:migrate && npm --prefix server run db:seed && npm start"]
