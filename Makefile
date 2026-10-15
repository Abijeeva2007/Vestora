# Vestora starter - convenience commands.
# Run `make` to list available targets.

.PHONY: help install dev backend test lint typecheck build

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install frontend + backend dependencies
	cd frontend && npm install
	cd backend && uv sync

dev: ## Run the frontend dev server (start `make backend` in another terminal)
	cd frontend && npm run dev

backend: ## Run the FastAPI backend with auto-reload
	cd backend && uv run uvicorn app.main:app --reload

test: ## Run backend tests
	cd backend && uv run pytest

lint: ## Lint the frontend
	cd frontend && npm run lint

typecheck: ## Type-check the frontend
	cd frontend && npx tsc --noEmit

build: ## Production build of the frontend
	cd frontend && npm run build
