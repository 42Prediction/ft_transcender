# Guia de Observabilidade (Kibana, Grafana, Prometheus)

Este ficheiro explica o que já está configurado na stack de observabilidade
(`make up-prod`) e o que vale a pena olhar em cada ferramenta. Não é
documentação genérica — reflete exatamente o que está definido em
`observability/` e em `app-backend/src/observability/`.

Acessos locais:

| Ferramenta | URL | Login |
|---|---|---|
| Kibana | http://localhost:5601 | `elastic` / `ELASTIC_PASSWORD` (`.env`) |
| Grafana | http://localhost:3001 | `admin` / `GRAFANA_ADMIN_PASSWORD` (`.env`) |
| Prometheus | http://localhost:9090 | sem login |

---

## 1. Grafana — métricas (o que já vem pronto)

O datasource Prometheus e o dashboard já são provisionados automaticamente
(`observability/grafana/provisioning/`), não precisas de criar nada à mão.

Abre **Dashboards → Transcendence — Backend Overview**
(`observability/grafana/dashboards/backend-overview.json`). Painéis:

- **HTTP request rate (req/s)** — tráfego total no backend.
- **Request latency p95 (s)** — 95º percentil da duração dos pedidos. É o
  mesmo threshold usado no alerta `HighRequestLatencyP95` (>1s durante 5min).
- **5xx error rate** — % de respostas 5xx. Corresponde ao alerta
  `HighHttpErrorRate` (>5% durante 5min).
- **Backend up** — 1/0, se o Prometheus consegue fazer scrape a `/metrics`.
- **Backend memory (RSS)** — corresponde ao alerta `HighProcessMemory`
  (>800MB durante 10min).

Isto é o painel a olhar quando quiseres saber "está tudo bem com o
backend agora?" — é o mais direto para debugging de performance/erros.

**O que falta / vale a pena adicionar** se o projeto crescer:
- Painel para o Postgres (`postgres-exporter` já está a ser feito scrape,
  mas não tem painel dedicado no dashboard atual).
- Painel para métricas por rota (`route` é um label em
  `http_requests_total`/`http_request_duration_seconds`, dá para quebrar
  por endpoint em vez de agregado).

---

## 2. Prometheus — métricas cruas + alertas

Prometheus é a peça "por trás" do Grafana. Usa-o diretamente quando quiseres
queries PromQL ad-hoc ou verificar o estado dos alertas.

- **Status → Targets** (http://localhost:9090/targets): confirma que os 4
  jobs (`backend`, `node`, `postgres`, `prometheus`) estão `UP`. Se algum
  estiver `DOWN`, é o primeiro sítio a olhar antes de ir para o Grafana.
- **Alerts** (http://localhost:9090/alerts): mostra o estado (`inactive` /
  `pending` / `firing`) dos 5 alertas definidos em `alert.rules.yml`:
  `BackendDown`, `PostgresDown`, `HighHttpErrorRate`,
  `HighRequestLatencyP95`, `HighProcessMemory`.

  ⚠️ Nota: os alertas ficam "firing" aqui dentro do Prometheus, mas **não há
  Alertmanager configurado** — ou seja, nada envia notificação (Slack,
  email, etc.) quando disparam. Se quiseres alertas ativos de verdade, é o
  próximo passo lógico a adicionar à stack.

- **Graph** (http://localhost:9090/graph): útil para testar queries antes de
  as pores num painel do Grafana. Algumas que vais usar com frequência:
  - `rate(http_requests_total[5m])` — taxa de pedidos.
  - `sum by (route) (rate(http_requests_total[5m]))` — tráfego por rota.
  - `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))` — p95 por rota.
  - `pg_stat_activity_count` (via postgres-exporter) — ligações ativas à BD.

---

## 3. Kibana — logs estruturados do backend

Isto é o que precisa de setup manual (não é provisionado automaticamente).

### Primeiro acesso: criar o Data View

1. Menu ☰ → **Stack Management → Data Views → Create data view**.
2. Index pattern: `transcendence-logs-*` (é o padrão diário criado pelo
   Logstash, ver `observability/logstash/pipeline/logstash.conf`).
3. Timestamp field: `@timestamp`.

Sem isto o **Discover** não mostra nada.

### Discover — os campos que interessam

Cada linha de log do backend (pino → Logstash → Elasticsearch) tem estes
campos relevantes:

- `log_level` — `trace`/`debug`/`info`/`warn`/`error`/`fatal` (mapeado a
  partir do nível numérico do pino). Filtra por `log_level: error` para ver
  só falhas.
- `msg` — a mensagem de log.
- `userId` — id do utilizador autenticado quando existe (`customProps` em
  `logger.config.ts`); `null` em pedidos anónimos. Útil para investigar o
  que um utilizador específico fez.
- `req.method`, `req.url`, `res.statusCode`, `responseTime` — campos padrão
  do `pino-http` para cada pedido.
- `service` — sempre `"backend"` por agora (fixo no pipeline do Logstash);
  fica pronto para quando houver mais do que um serviço a escrever logs.

**Nota de segurança**: `req.headers.cookie`, `req.headers.authorization`,
`res.headers["set-cookie"]` e `req.body.password` são removidos antes de
saírem do backend (`redact` em `logger.config.ts`) — não vais encontrá-los
nos logs, mesmo em erro.

Queries KQL úteis no Discover:
- `log_level: "error" or log_level: "fatal"` — só falhas.
- `userId: "<id>"` — atividade de um utilizador.
- `res.statusCode >= 500` — pedidos que resultaram em erro de servidor.

### Retenção

Os índices `transcendence-logs-*` têm uma ILM policy que apaga dados após
`LOG_RETENTION_DAYS` (`.env`, default 7 dias) — configurado em
`observability/setup/setup.sh`. Não precisas de limpar nada à mão.

---

## Resumo — quando usar cada ferramenta

| Pergunta | Ferramenta |
|---|---|
| "O backend está com boa saúde agora?" | Grafana (dashboard) |
| "Algum alerta está a disparar?" | Prometheus (`/alerts`) |
| "Porque é que este pedido falhou / o que fez este utilizador?" | Kibana (Discover) |
| "Quero uma query PromQL nova antes de pôr num painel" | Prometheus (`/graph`) |
