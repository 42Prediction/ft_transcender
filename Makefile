COMPOSE = docker compose -f docker-compose.dev.yml
PROD_COMPOSE = docker compose -f docker-compose.yml
PROJECT_ROOT = $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
DATA_DIR = /home/$(USER)/data
FRONT_DIR = $(PROJECT_ROOT)/app-frontend
BACK_DIR = $(PROJECT_ROOT)/app-backend
LOG_DIR = $(PROJECT_ROOT)/logs
PID_DIR = $(PROJECT_ROOT)/.pids
BACK_PID_FILE = $(PID_DIR)/backend.pid
BACK_CHILD_PID_FILE = $(PID_DIR)/backend.child.pid
FRONT_PID_FILE = $(PID_DIR)/frontend.pid
FRONT_CHILD_PID_FILE = $(PID_DIR)/frontend.child.pid
BACK_PORT ?= 3000
FRONT_PORT ?= 5173
BACK_URL ?= http://localhost:$(BACK_PORT)
FRONT_URL ?= http://localhost:$(FRONT_PORT)/

all: help

help:
	@echo "ft_transcendence - available commands:"
	@echo ""
	@echo "Local dev (Postgres in Docker, apps as host processes):"
	@echo "  make dev            - Start DB container, then backend and frontend"
	@echo "  make dev-stop       - Stop backend/frontend and stop DB container"
	@echo "  make dev-status     - Show backend/frontend process IDs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate-run      - Run backend TypeORM migrations"
	@echo "  make migrate-generate - Run migrations, then generate the next one"
	@echo "  make seed             - Run backend seeds"
	@echo ""
	@echo "Tests:"
	@echo "  make test           - Backend unit + e2e tests (CI entry point)"
	@echo "  make test-frontend  - Frontend build + lint"
	@echo ""
	@echo "Full containerized stack (app + ELK + Prometheus/Grafana):"
	@echo "  make up-prod        - Build and start the whole stack (one command)"
	@echo "  make down-prod      - Stop the whole stack"
	@echo "  make logs-prod      - Follow logs (make logs-prod SERVICE=backend for one service)"
	@echo "  make ps-prod        - Show stack container status"
	@echo "  make fclean-prod    - Stop stack and remove its volumes"
	@echo ""
	@echo "Teardown:"
	@echo "  make clean          - Stop apps, remove dev containers/volumes and data dir"
	@echo "  make fclean         - clean + remove images"
	@echo "  make re             - clean + make dev"

# Fail early with a clear message if .env is missing: docker compose interpolates
# DB_*, and the prod stack also needs ELASTIC_PASSWORD / GRAFANA_ADMIN_PASSWORD.
require-env:
	@test -f .env || { echo "ERROR: .env not found at repo root. Copy .env.example to .env and fill it in first."; exit 1; }

up: require-env
	mkdir -p $(DATA_DIR)/postgresql
	$(COMPOSE) up -d --pull missing

wait-db: up
	@echo "Waiting for PostgreSQL to be ready..."
	@until $(COMPOSE) exec -T postgres pg_isready -U $${DB_USER:-postgres} -d $${DB_NAME:-transcendence_db} >/dev/null 2>&1; do \
		printf "."; \
		sleep 1; \
	done; \
	echo " ready"

migrate-generate:
	@echo "Generating migration..."
	@cd $(BACK_DIR) && \
	npm run migration:run &&\
	NAME=migration && \
	COUNT=$$(ls -1 src/migrations/*.ts 2>/dev/null | wc -l | tr -d ' ') && \
	NEXT=$$((COUNT + 1)) && \
	npm run migration:generate -- "src/migrations/$${NAME}$${NEXT}"

migrate-run:
	@echo "Running migrations..."
	@cd $(BACK_DIR) && npm run migration:run
	@echo "Migrations complete"

# Backward-compatible alias.
migrate: migrate-run

seed:
	@cd $(BACK_DIR) && npm run seed:run

test-backend: wait-db
	@cd $(BACK_DIR) && npm ci
	@cd $(BACK_DIR) && npm test
	@cd $(BACK_DIR) && npm run test:e2e

test-all: test-backend
	@echo "All project tests and checks passed"

test: test-all

dev: wait-db
	@echo "Starting backend and frontend..."
	@mkdir -p $(LOG_DIR)
	@mkdir -p $(PID_DIR)
	@if [ -f $(BACK_PID_FILE) ]; then kill $$(cat $(BACK_PID_FILE)) 2>/dev/null || true; rm -f $(BACK_PID_FILE); fi
	@if [ -f $(BACK_CHILD_PID_FILE) ]; then kill -9 $$(cat $(BACK_CHILD_PID_FILE)) 2>/dev/null || true; rm -f $(BACK_CHILD_PID_FILE); fi
	@if [ -f $(FRONT_PID_FILE) ]; then kill $$(cat $(FRONT_PID_FILE)) 2>/dev/null || true; rm -f $(FRONT_PID_FILE); fi
	@if [ -f $(FRONT_CHILD_PID_FILE) ]; then kill -9 $$(cat $(FRONT_CHILD_PID_FILE)) 2>/dev/null || true; rm -f $(FRONT_CHILD_PID_FILE); fi
	@# Limpeza garantida da porta do backend antes de subir o app
	@if command -v fuser >/dev/null 2>&1; then fuser -k -n tcp $(BACK_PORT) 2>/dev/null || true; else listeners=$$(lsof -t -i:$(BACK_PORT) 2>/dev/null || true); if [ -n "$$listeners" ]; then kill -9 $$listeners 2>/dev/null || true; fi; fi
	@# Limpeza garantida da porta do frontend antes de subir o frontend
	@if command -v fuser >/dev/null 2>&1; then fuser -k -n tcp $(FRONT_PORT) 2>/dev/null || true; else listeners=$$(lsof -t -i:$(FRONT_PORT) 2>/dev/null || true); if [ -n "$$listeners" ]; then kill -9 $$listeners 2>/dev/null || true; fi; fi
	@cd $(BACK_DIR) && npm install
	@# Executa o backend em background
	@(cd $(BACK_DIR) && NO_COLOR=true  SYN=true npm run start:dev > "$(LOG_DIR)/backend.log" 2>&1 & echo $$! > "$(BACK_PID_FILE)")
	@sleep 2
	@lsof -t -i:$(BACK_PORT) > "$(BACK_CHILD_PID_FILE)" 2>/dev/null || true
	@cd $(FRONT_DIR) && npm install
	@(cd $(FRONT_DIR) && NO_COLOR=true npm run dev -- --port $(FRONT_PORT) --strictPort > "$(LOG_DIR)/frontend.log" 2>&1 & echo $$! > "$(FRONT_PID_FILE)")
	@sleep 2
	@lsof -t -i:$(FRONT_PORT) > "$(FRONT_CHILD_PID_FILE)" 2>/dev/null || true
	@echo "Backend log: $(LOG_DIR)/backend.log"
	@echo "Frontend log: $(LOG_DIR)/frontend.log"
	@echo "Frontend running at: $(FRONT_URL)"
	@echo "Backend API at: $(BACK_URL)"
	@echo "Use 'make dev-status' to check processes and 'make dev-stop' to stop them"

dev-status:
	@echo "Backend PID: $$(cat $(BACK_PID_FILE) 2>/dev/null || echo not-running)"
	@echo "Frontend PID: $$(cat $(FRONT_PID_FILE) 2>/dev/null || echo not-running)"

dev-stop:
	@if [ -f $(BACK_PID_FILE) ]; then kill $$(cat $(BACK_PID_FILE)) 2>/dev/null || true; rm -f $(BACK_PID_FILE); fi
	@if [ -f $(BACK_CHILD_PID_FILE) ]; then kill -9 $$(cat $(BACK_CHILD_PID_FILE)) 2>/dev/null || true; rm -f $(BACK_CHILD_PID_FILE); fi
	@if [ -f $(FRONT_PID_FILE) ]; then kill -9 $$(cat $(FRONT_PID_FILE)) 2>/dev/null || true; rm -f $(FRONT_PID_FILE); fi
	@if [ -f $(FRONT_CHILD_PID_FILE) ]; then kill -9 $$(cat $(FRONT_CHILD_PID_FILE)) 2>/dev/null || true; rm -f $(FRONT_CHILD_PID_FILE); fi
	@$(COMPOSE) stop
	@echo "Backend and frontend stopped; DB container stopped"

# ---- Containerized full stack (app + observability) - single command ----
# On boot the backend container runs pending migrations and seeds the admin
# account (docker-entrypoint.sh, idempotent), so no separate migrate/seed step
# is needed here.
up-prod: require-env
	@$(PROD_COMPOSE) up -d --build
	@echo "Stack starting. Frontend: http://localhost:5173 | Backend: http://localhost:3000"
	@echo "Kibana: http://localhost:5601 | Grafana: http://localhost:3001 | Prometheus: http://localhost:9090"

down-prod:
	@$(PROD_COMPOSE) down

# Follow all services, or a single one: make logs-prod SERVICE=backend
logs-prod:
	@$(PROD_COMPOSE) logs -f $(SERVICE)

ps-prod:
	@$(PROD_COMPOSE) ps

fclean-prod:
	@$(PROD_COMPOSE) down -v --remove-orphans

clean: dev-stop
	@$(COMPOSE) down -v --remove-orphans
	@sudo rm -rf $(DATA_DIR)

fclean: clean
	docker image prune -af

re: fclean dev

.PHONY: all help require-env up wait-db migrate migrate-run migrate-generate seed \
	test test-all test-backend test-frontend dev dev-status dev-stop \
	up-prod down-prod logs-prod ps-prod fclean-prod clean fclean re
