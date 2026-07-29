#!/bin/sh
# 커넥터 등록을 재시도로 자가회복하며 등록이 RUNNING 이 될 때까지 기다린다.
set -e

until curl -sf http://connect:8083/connectors >/dev/null; do sleep 2; done

until curl -sf -X PUT http://connect:8083/connectors/event-ledger/config \
  -H 'Content-Type: application/json' -d @/event-ledger.json >/dev/null; do sleep 2; done

while :; do
  status=$(curl -s http://connect:8083/connectors/event-ledger/status || true)
  case "$(printf '%s' "$status" | grep -o '"tasks":\[[^]]*')" in
    *'"state":"RUNNING"'*) break ;;
  esac
  case "$status" in
    *'"state":"FAILED"'*)
      curl -s -X POST "http://connect:8083/connectors/event-ledger/restart?includeTasks=true&onlyFailed=true" >/dev/null || true
      ;;
  esac
  sleep 3
done

echo "event-ledger connector RUNNING"
