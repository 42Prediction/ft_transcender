#!/bin/bash
# One-shot bootstrap for the ELK stack's security + log retention.
#
# Runs after Elasticsearch is healthy and before Kibana/Logstash need it:
#   1. sets the built-in `kibana_system` user's password (Kibana logs in with
#      a least-privilege account, not the `elastic` superuser);
#   2. creates an ILM policy that deletes log indices after the retention
#      window, satisfying the "log retention and archiving" requirement;
#   3. attaches that policy to a `transcendence-logs-*` index template so every
#      daily index Logstash creates inherits it automatically.
set -euo pipefail

ES="http://elasticsearch:9200"
RETENTION_DAYS="${LOG_RETENTION_DAYS:-7}"

echo "Waiting for Elasticsearch to be available..."
until curl -s -u "elastic:${ELASTIC_PASSWORD}" "${ES}/_cluster/health?wait_for_status=yellow&timeout=60s" >/dev/null; do
  echo "  ...still waiting"
  sleep 3
done
echo "Elasticsearch is up."

echo "Setting kibana_system password..."
# Retry until it sticks: right after ES goes yellow the `.security` index may
# not yet accept writes, and a silent failure here leaves Kibana unable to
# authenticate. Verify the HTTP status and confirm kibana_system can log in.
for attempt in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -u "elastic:${ELASTIC_PASSWORD}" \
    -H "Content-Type: application/json" \
    "${ES}/_security/user/kibana_system/_password" \
    -d "{\"password\":\"${KIBANA_SYSTEM_PASSWORD}\"}")
  if [ "$code" = "200" ] && \
     curl -s -o /dev/null -u "kibana_system:${KIBANA_SYSTEM_PASSWORD}" "${ES}/_security/_authenticate"; then
    echo "  done."
    break
  fi
  echo "  attempt ${attempt}: HTTP ${code}, retrying..."
  sleep 3
done

echo "Creating ILM retention policy (delete after ${RETENTION_DAYS}d)..."
curl -s -X PUT -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "${ES}/_ilm/policy/transcendence-logs-policy" \
  -d "{
    \"policy\": {
      \"phases\": {
        \"hot\":    { \"actions\": {} },
        \"delete\": { \"min_age\": \"${RETENTION_DAYS}d\", \"actions\": { \"delete\": {} } }
      }
    }
  }" >/dev/null
echo "  done."

echo "Creating index template with retention policy..."
curl -s -X PUT -u "elastic:${ELASTIC_PASSWORD}" \
  -H "Content-Type: application/json" \
  "${ES}/_index_template/transcendence-logs" \
  -d '{
    "index_patterns": ["transcendence-logs-*"],
    "template": {
      "settings": {
        "index.lifecycle.name": "transcendence-logs-policy",
        "number_of_replicas": 0
      }
    }
  }' >/dev/null
echo "  done."

echo "ELK bootstrap complete."
