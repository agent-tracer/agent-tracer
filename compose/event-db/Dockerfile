# 원장 DB — pg_partman을 얹은 Postgres 17이며 변경 데이터 캡처를 위해 wal_level=logical로 기동한다.
FROM postgres:17

RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-17-partman \
 && rm -rf /var/lib/apt/lists/*
