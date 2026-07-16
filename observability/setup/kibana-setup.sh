#!/bin/bash
# One-shot bootstrap for Kibana: creates the data view (index pattern) that
# lets Discover/dashboards query the log indices Logstash writes.
#
# Runs after Kibana reports itself healthy (docker-compose healthcheck).
# Idempotent — skips creation if the data view already exists, so re-running
# `up-prod` on a stack that still has its Kibana saved-objects data is a no-op.
set -euo pipefail

KIBANA="http://kibana:5601"
DATA_VIEW_ID="transcendence-logs"

echo "Checking for existing '${DATA_VIEW_ID}' data view..."
code=$(curl -s -o /dev/null -w "%{http_code}" -u "elastic:${ELASTIC_PASSWORD}" \
  -H "kbn-xsrf: true" \
  "${KIBANA}/api/data_views/data_view/${DATA_VIEW_ID}")

if [ "$code" = "200" ]; then
  echo "  already exists, skipping."
else
  echo "Creating '${DATA_VIEW_ID}' data view (pattern: transcendence-logs-*)..."
  body="/tmp/create_resp.json"
  create_code=$(curl -s -o "$body" -w "%{http_code}" -X POST -u "elastic:${ELASTIC_PASSWORD}" \
    -H "kbn-xsrf: true" -H "Content-Type: application/json" \
    "${KIBANA}/api/data_views/data_view" \
    -d "{\"data_view\":{\"id\":\"${DATA_VIEW_ID}\",\"title\":\"transcendence-logs-*\",\"name\":\"transcendence-logs\",\"timeFieldName\":\"@timestamp\"}}")
  if [ "$create_code" != "200" ]; then
    echo "  ERROR: creation failed with HTTP ${create_code}:"
    cat "$body"
    exit 1
  fi
  echo "  done."
fi

echo "Kibana bootstrap complete."
