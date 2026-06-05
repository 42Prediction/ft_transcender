COMPOSE = docker compose -f docker-compose.dev.yml
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
	@echo "Available commands:"
	@echo "  make dev        - Pull image if needed, start DB container, start backend and frontend"
	@echo "  make dev-stop   - Stop backend/frontend and stop DB container"
	@echo "  make dev-status - Show backend/frontend process IDs"
	@echo "  make migrate    - Run backend migrations"
	@echo "  make seed       - Run backend seeds"
	@echo "  make clean      - Stop apps and remove containers, volumes, and data dir"
	@echo "  make fclean     - clean + remove images"
	@echo "  make re         - clean + make dev"

up:
	mkdir -p $(DATA_DIR)/postgresql
	$(COMPOSE) up -d --pull missing

wait-db: up
	@echo "Waiting for PostgreSQL to be ready..."
	@until $(COMPOSE) exec -T postgres pg_isready -U $${DB_USER:-postgres} -d $${DB_NAME:-transcendence_db} >/dev/null 2>&1; do \
		printf "."; \
		sleep 1; \
	done; \
	echo " ready"

migrate:
	@echo "Generating migration..."
	@cd $(BACK_DIR) && \
	NAME=migration && \
	COUNT=$$(ls -1 src/migrations/*.ts 2>/dev/null | wc -l | tr -d ' ') && \
	NEXT=$$((COUNT + 1)) && \
	npm run migration:generate -- "src/migrations/$${NAME}$${NEXT}"
	@echo "Migration generated"
	@echo "Running migration"
	@cd $(BACK_DIR) && npm run migration:run
	@echo "Migration runned"

seed:
	@cd $(BACK_DIR) && npm run seed:run

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
	@(cd $(BACK_DIR) && NO_COLOR=true npm run start:dev > "$(LOG_DIR)/backend.log" 2>&1 & echo $$! > "$(BACK_PID_FILE)")
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

clean: dev-stop
	@$(COMPOSE) down -v --remove-orphans
	@sudo rm -rf $(DATA_DIR)

fclean: clean
	docker image prune -af

re: fclean dev

.PHONY: all help up down wait-db migrate seed dev dev-status dev-stop clean fclean re