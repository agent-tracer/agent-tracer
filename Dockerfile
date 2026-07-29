# syntax=docker/dockerfile:1

# ---- 매니페스트 베이스: package.json 레이어만 앞세워 npm ci를 캐싱한다 ----
FROM node:24-slim AS deps-base

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY libs/kernel/package.json libs/kernel/
COPY libs/platform/package.json libs/platform/
COPY libs/tracer-model/package.json libs/tracer-model/
COPY services/ingest-api/package.json services/ingest-api/
COPY services/tracer-api/package.json services/tracer-api/
COPY services/tracer-web/package.json services/tracer-web/
COPY plugin/package.json plugin/

# 의존성이 모두 사전 빌드된 네이티브 바이너리라 gcc 빌드툴이 필요 없다.

# ---- 의존성 설치 1회: 전체(dev 포함)를 한 번만 깐다 ----
# 대시보드 정적 자산 빌드가 vite 등 devDependencies를 요구하므로 전체를 설치한다.
FROM deps-base AS deps
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev

# ---- 프로덕션 node_modules 산출: dev 툴체인을 제거한다 ----
FROM deps AS pruned-deps
RUN --mount=type=cache,target=/root/.npm npm prune --omit=dev

# ---- 런타임 의존성 ----
# swc-node 로더는 이 소스 실행 모델의 런타임 요구사항이라 prune 뒤에도 각 package.json에 남는다.
FROM deps-base AS runtime-deps
COPY --from=pruned-deps /app/node_modules ./node_modules
COPY tsconfig.base.json tsconfig.paths.json ./
COPY scripts/register-otel.mjs scripts/
COPY libs libs
COPY services/ingest-api services/ingest-api
COPY services/tracer-api services/tracer-api

# ---- 빌드 의존성: 정적 자산 빌드에는 전체 설치가 그대로 필요하다 ----
FROM deps AS build-deps
COPY tsconfig.base.json tsconfig.paths.json ./
COPY libs/kernel libs/kernel
COPY services/tracer-web services/tracer-web

# ---- migrate: 두 원장의 스키마를 이행하고 종료하는 원샷 컨테이너 ----
FROM runtime-deps AS migrate
COPY scripts/migrate.mjs scripts/
CMD ["npm", "run", "migrate"]

# ---- ingest-api: swc-node 로더로 소스에서 직접 실행 ----
FROM runtime-deps AS ingest-api
ENV SWC_NODE_PROJECT=services/ingest-api/tsconfig.json
EXPOSE 3901
CMD ["node", "--import", "file:///app/scripts/register-otel.mjs", "--import", "@swc-node/register/esm-register", "services/ingest-api/src/main.ts"]

# ---- tracer-api: 조회 창구와 조회 모델 생성과 검색 색인이 이 한 이미지를 명령만 달리해 쓴다 ----
FROM runtime-deps AS tracer-api
ENV SWC_NODE_PROJECT=services/tracer-api/tsconfig.json
EXPOSE 3902
CMD ["node", "--import", "file:///app/scripts/register-otel.mjs", "--import", "@swc-node/register/esm-register", "services/tracer-api/src/api.main.ts"]

# ---- 대시보드 정적 자산 빌드 ----
FROM build-deps AS web-builder
RUN npm run build --workspace @agent-tracer/tracer-web

FROM nginx:alpine AS web
COPY services/tracer-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-builder /app/services/tracer-web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ---- gateway: 경로 접두사로 서비스를 나누는 단일 진입점 ----
FROM nginx:1.27-alpine AS gateway
COPY gateway/nginx.conf /etc/nginx/nginx.conf
# 상류 선언이 없는 상태가 기본이며 배포가 이 디렉터리에 파일을 얹는다.
COPY gateway/upstreams.d /etc/nginx/upstreams.d
EXPOSE 3847
CMD ["nginx", "-g", "daemon off;"]

# ---- event-db: pg_partman 을 얹은 Postgres 이며 변경 데이터 캡처를 위해 논리 복제를 켠다 ----
FROM postgres:17 AS event-db
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-17-partman \
 && rm -rf /var/lib/apt/lists/*

# ---- connect-init: 원장 커넥터를 등록하고 RUNNING 이 될 때까지 기다린 뒤 끝나는 원샷 ----
FROM curlimages/curl:8.10.1 AS connect-init
COPY compose/debezium/event-ledger.json /event-ledger.json
COPY compose/debezium/register.sh /register.sh
ENTRYPOINT ["/bin/sh", "/register.sh"]
