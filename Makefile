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

all: help

help:
	@echo "Available commands:"
	@echo "  make dev        - Start database container, backend, and frontend"
	@echo "  make dev-status - Show backend/frontend process IDs"
	@echo "  make dev-stop   - Stop apps and run clean (down + prune)"
	@echo "  make migrate    - Run backend migrations"
	@echo "  make seed       - Run backend seeds"
	@echo "  make db-init    - Run migrations and seeds"
	@echo "  make up         - Start database container"
	@echo "  make down       - Stop database container"
	@echo "  make shell-db   - Open psql shell in postgres container"
	@echo "  make clean      - Stop containers and prune docker resources"
	@echo "  make clean-all-except-postgres - Stop containers, volumes and images except postgres"
	@echo "  make clean-keep-pulls - Alias for clean-all-except-postgres"
	@echo "  make clean-volume-keep-image - Stop containers and remove the project volume only"
	@echo "  make fclean     - clean + remove volumes + data dir"
	@echo "  make re         - Full reset and start"

up:
	mkdir -p $(DATA_DIR)/postgresql
	$(COMPOSE) up -d

wait-db: up
	@echo "Waiting for PostgreSQL to be ready..."
	@until $(COMPOSE) exec -T postgres pg_isready -U $${DB_USER:-postgres} -d $${DB_NAME:-transcendence_db} >/dev/null 2>&1; do \
		printf "."; \
		sleep 1; \
	done; \
	echo " ready"

down:
	$(COMPOSE) down

shell-db:
	$(COMPOSE) exec postgres psql -U postgres transcendence_db

migrate: wait-db
	@cd $(BACK_DIR) && { [ -d node_modules ] || npm install; }
	@cd $(BACK_DIR) && npm run migration:run

seed:
	@cd $(BACK_DIR) && { [ -d node_modules ] || npm install; }
	@cd $(BACK_DIR) && npm run seed:run

db-init: migrate seed
	@echo "Database initialized (migrations + seeds)."

dev: wait-db
	@echo "Starting backend and frontend..."
	@mkdir -p $(LOG_DIR)
	@mkdir -p $(PID_DIR)
	@if [ -f $(BACK_PID_FILE) ]; then kill $$(cat $(BACK_PID_FILE)) 2>/dev/null || true; rm -f $(BACK_PID_FILE); fi
	@if [ -f $(BACK_CHILD_PID_FILE) ]; then kill -9 $$(cat $(BACK_CHILD_PID_FILE)) 2>/dev/null || true; rm -f $(BACK_CHILD_PID_FILE); fi
	@if [ -f $(FRONT_PID_FILE) ]; then kill $$(cat $(FRONT_PID_FILE)) 2>/dev/null || true; rm -f $(FRONT_PID_FILE); fi
	@if [ -f $(FRONT_CHILD_PID_FILE) ]; then kill -9 $$(cat $(FRONT_CHILD_PID_FILE)) 2>/dev/null || true; rm -f $(FRONT_CHILD_PID_FILE); fi
	@# Limpeza garantida da porta 3000 antes de subir o app
	@if command -v fuser >/dev/null 2>&1; then fuser -k -n tcp 3000 2>/dev/null || true; else listeners=$$(lsof -t -i:3000 2>/dev/null || true); if [ -n "$$listeners" ]; then kill -9 $$listeners 2>/dev/null || true; fi; fi
	@# Limpeza garantida da porta 5173 antes de subir o frontend
	@if command -v fuser >/dev/null 2>&1; then fuser -k -n tcp 5173 2>/dev/null || true; else listeners=$$(lsof -t -i:5173 2>/dev/null || true); if [ -n "$$listeners" ]; then kill -9 $$listeners 2>/dev/null || true; fi; fi
	@cd $(BACK_DIR) && { [ -d node_modules ] || npm install; }
	@# Executa o backend em background
	@(cd $(BACK_DIR) && NO_COLOR=true npm run start:dev > "$(LOG_DIR)/backend.log" 2>&1 &)
	@sleep 2
	@lsof -t -i:3000 > "$(BACK_CHILD_PID_FILE)" 2>/dev/null || true
	@cd $(FRONT_DIR) && { [ -d node_modules ] || npm install; }
	@(cd $(FRONT_DIR) && NO_COLOR=true npm run dev -- --port 5173 --strictPort > "$(LOG_DIR)/frontend.log" 2>&1 & echo $$! > "$(FRONT_PID_FILE)")
	@sleep 2
	@lsof -t -i:5173 > "$(FRONT_CHILD_PID_FILE)" 2>/dev/null || true
	@echo "Backend log: $(LOG_DIR)/backend.log"
	@echo "Frontend log: $(LOG_DIR)/frontend.log"
	@echo "Frontend running at: http://localhost:5173/"
	@echo "Backend API at: http://localhost:3000/examrank"
	@echo "Use 'make dev-status' to check processes and 'make dev-stop' to stop them"

dev-status:
	@echo "Backend PID: $$(cat $(BACK_PID_FILE) 2>/dev/null || echo not-running)"
	@echo "Frontend PID: $$(cat $(FRONT_PID_FILE) 2>/dev/null || echo not-running)"

dev-stop:
	@if [ -f $(BACK_PID_FILE) ]; then kill $$(cat $(BACK_PID_FILE)) 2>/dev/null || true; rm -f $(BACK_PID_FILE); fi
	@if [ -f $(BACK_CHILD_PID_FILE) ]; then kill -9 $$(cat $(BACK_CHILD_PID_FILE)) 2>/dev/null || true; rm -f $(BACK_CHILD_PID_FILE); fi
	@if [ -f $(FRONT_PID_FILE) ]; then kill -9 $$(cat $(FRONT_PID_FILE)) 2>/dev/null || true; rm -f $(FRONT_PID_FILE); fi
	@if [ -f $(FRONT_CHILD_PID_FILE) ]; then kill -9 $$(cat $(FRONT_CHILD_PID_FILE)) 2>/dev/null || true; rm -f $(FRONT_CHILD_PID_FILE); fi
	@echo "Backend and frontend stopped; clean completed"

clean: down
	docker system prune -af

fclean: dev-stop
	docker volume rm $(shell docker volume ls -q) 2>/dev/null || true
	sudo rm -rf $(DATA_DIR)

re: fclean dev

.PHONY: all help up down wait-db shell-db migrate seed db-init dev dev-status dev-stop clean fclean re
