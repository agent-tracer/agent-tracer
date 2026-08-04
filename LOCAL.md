# 로컬 sqlite 프로파일

이 문서는 `local-main` 브랜치에만 있는 구현을 설명합니다. `main`은 이 구현이 기대는 확장 지점만 갖고 실행체는 갖지 않습니다. 브랜치는 `main → local-main` 한 방향으로만 합칩니다.

## 무엇인가

`MONITOR_PROFILE=sqlite`는 Postgres·Debezium·Redpanda·OpenSearch 없이 Node.js 프로세스 두 개로 같은 흐름을 세웁니다.

```text
plugin daemon → ingest-api            → ledger.sqlite
                                         ↓ seq 커서 폴링
                tracer-local            ↓
                (tracer-api + projector) → tracer.sqlite → 인메모리 알림 → WebSocket
```

투영 유스케이스는 브로커를 모르므로 그대로 씁니다. 배포 프로파일에서 CDC 메시지가 서던 자리를 `LedgerPollConsumer`가 대신합니다.

## 실행

```bash
MONITOR_PROFILE=sqlite SWC_NODE_PROJECT=services/ingest-api/tsconfig.json \
  node --import @swc-node/register/esm-register services/ingest-api/src/main.ts

MONITOR_PROFILE=sqlite SWC_NODE_PROJECT=services/tracer-api/tsconfig.json \
  node --import @swc-node/register/esm-register services/tracer-api/src/local.main.ts
```

`agent-tracer-stack`의 `local-main` 브랜치에는 이 둘을 함께 세우는 `node scripts/up.mjs --profile sqlite`가 있습니다.

| 환경변수 | 기본값 | 뜻 |
| --- | --- | --- |
| `MONITOR_PROFILE` | `local` | `sqlite`여야 이 프로파일이 섭니다 |
| `MONITOR_LOCAL_DIR` | `~/.agent-tracer/local` | 두 데이터베이스 파일이 사는 자리 |
| `MONITOR_LOCAL_PORT` | `3847` | 단일 진입점 |

## 지켜야 하는 것

- **방언은 엔티티 데코레이터가 평가될 때 굳습니다.** `MONITOR_PROFILE`을 YAML에만 적으면 컬럼 타입이 Postgres로 남습니다. 환경변수로 넘깁니다.
- **원장과 조회 모델은 서로 다른 파일입니다.** `ledger.sqlite`와 `tracer.sqlite`를 한 연결에서 섞지 않습니다.
- **스키마는 엔티티 선언이 세웁니다.** 파티션과 `pg_partman`과 퍼블리케이션이 sqlite에 없어 마이그레이션을 쓰지 않으므로, 엔티티를 바꾸면 로컬 파일에 드리프트가 조용히 반영됩니다.
- **플러그인은 수집과 조회를 한 주소로 부릅니다.** `local.main.ts`가 `3847`에서 받고 `/ingest/`만 수집 창구로 넘기므로 플러그인 설정을 바꾸지 않습니다.

## 없는 것

필요하면 `compose/base.yml`이나 `agent-tracer-stack`의 `tracer` 프로파일을 씁니다.

- 전문 검색 — `/api/v1/search/*`가 빈 결과를 냅니다
- 추적 대시보드 화면 — HTTP API와 WebSocket만 열립니다
- CDC와 재투영 — 조회 모델은 원장을 `seq` 커서로 따라 읽어 세웁니다
- OTLP 내보내기와 에이전트 상류

## 인프라로 옮기기

데이터는 두 종류로 갈립니다.

- **원장 파생** — `tasks`·`sessions`·`events`·`turns`·`recipe_applications`·`verdicts`는 투영이 원장에서 다시 만듭니다. 옮기지 않습니다.
- **사용자 소유** — `users`·`recipes`·`rules`·`memos`·`tags`·`task_tags`·`task_user_state`·`task_cleanup_suggestions`는 화면과 데몬이 만들고 원장에 남지 않습니다. **원장을 재생해도 되살아나지 않으므로 반드시 함께 옮깁니다.**

```bash
MONITOR_PROFILE=sqlite LOCAL_EXPORT_DIR=./local-export \
  SWC_NODE_PROJECT=services/tracer-api/tsconfig.json \
  node --import @swc-node/register/esm-register services/tracer-api/src/local.export.main.ts

MONITOR_PROFILE=prd POSTGRES_USER=root POSTGRES_PASSWORD=root \
  TRACER_DB_HOST=127.0.0.1 TRACER_DB_PORT=5433 \
  LOCAL_EXPORT_DIR=./local-export INGEST_BASE_URL=http://127.0.0.1:3847 \
  REPLAY_USER_ID="$(id -un)" \
  SWC_NODE_PROJECT=services/tracer-api/tsconfig.json \
  node --import @swc-node/register/esm-register services/tracer-api/src/local.import.main.ts
```

`local.import.main.ts`가 지키는 순서에는 이유가 있습니다.

1. **사용자 소유 테이블을 먼저 넣습니다.** 규칙이 서 있어야 재생이 닫는 턴에 판정이 붙습니다.
2. **원장을 수집 창구로 재생합니다.** CDC와 투영이 조회 모델을 다시 만듭니다.
3. **검색 색인 요청을 마지막에 넣습니다.** 직접 넣은 행은 유스케이스를 거치지 않아 아웃박스가 비고, 투영이 만든 문서를 덮어써야 아카이브 같은 사용자 상태가 남습니다.

세 단계 모두 다시 실행해도 겹치지 않습니다. 원장은 이벤트 ID로, 사용자 소유 테이블은 기본키 upsert로, 색인 요청은 대상에서 지은 결정적 ID로 각각 막습니다.

`REPLAY_USER_ID`는 재생한 이벤트의 소유자가 되므로 플러그인이 쓰는 신원과 맞춥니다. 다르게 주면 옮긴 기록이 다른 사용자의 것이 됩니다.

## 원장이 더 갖는 것

로컬 원장은 배포 원장에 없는 `turn_id`와 `parent_id`를 함께 적습니다. 배포 원장은 이 둘을 `trace_id`와 `parent_span_id`로 접어 넣는데, `span_id`가 ULID의 하위 8바이트만 취해 되돌릴 수 없기 때문입니다. 두 컬럼을 그대로 남겨 인제스트 요청을 손실 없이 되만듭니다.

## 브랜치

`main`이 갖는 것은 확장 지점입니다.

- `libs/platform`의 방언 해석과 컬럼 타입 헬퍼와 `createDataSource`의 방언 분기
- `LedgerEventRecord`의 `turnId`·`parentId`
- `LedgerSource`와 `ProjectionCursorStore` 경계와 그 주입 토큰

`main`에는 sqlite 어댑터도 진입점도 없으므로 그 확장 지점은 선언으로만 남습니다. 실행체는 이 브랜치가 갖습니다. `main`의 변경은 이 브랜치로 합치고 반대 방향으로는 합치지 않습니다.
