# OpenClaw Marketplace - Makefile
# Run `make help` for targets.

.PHONY: help install setup dev dev-frontend dev-convex build build-frontend \
	test test-frontend test-convex test-mcp lint format start \
	docker-up docker-down convex-codegen smoke-test clean

# Default target
help:
	@echo "OpenClaw Marketplace"
	@echo ""
	@echo "Setup:"
	@echo "  make install     Install dependencies (pnpm install)"
	@echo "  make setup       Install + copy frontend .env.local.example → .env.local"
	@echo ""
	@echo "Development:"
	@echo "  make dev         Start frontend dev server (Next.js)"
	@echo "  make dev-convex  Start Convex backend (run in another terminal)"
	@echo ""
	@echo "Build & test:"
	@echo "  make build      Build all packages"
	@echo "  make build-frontend  Build frontend only"
	@echo "  make test       Run frontend unit tests"
	@echo "  make test-convex    Run Convex tests"
	@echo "  make test-mcp   Run MCP package tests"
	@echo "  make lint       Lint all packages"
	@echo "  make format     Format with Prettier"
	@echo ""
	@echo "Other:"
	@echo "  make start      Start frontend (production)"
	@echo "  make convex-codegen  Run Convex codegen"
	@echo "  make smoke-test Run Week 1 smoke test script"
	@echo "  make docker-up  docker compose up -d"
	@echo "  make docker-down  docker compose down"
	@echo "  make clean      Remove node_modules and build artifacts"

# Setup
install:
	pnpm install

setup: install
	@if [ ! -f packages/frontend/.env.local ]; then \
		cp packages/frontend/.env.local.example packages/frontend/.env.local; \
		echo "Created packages/frontend/.env.local - add CONVEX_URL from \`make dev-convex\`"; \
	else \
		echo "packages/frontend/.env.local already exists"; \
	fi

# Development
dev: dev-frontend

dev-frontend:
	pnpm --filter frontend dev

dev-convex:
	npx convex dev

# Build
build:
	pnpm -r build

build-frontend:
	pnpm --filter frontend build

# Test
test: test-frontend

test-frontend:
	pnpm --filter frontend test

test-convex:
	pnpm exec vitest run convex/

test-mcp:
	pnpm --filter @openclaw/mcp test

# Lint & format
lint:
	pnpm -r lint

format:
	pnpm exec prettier --write "**/*.{ts,tsx,js,jsx,json,md}"

# Production
start:
	pnpm --filter frontend start

# Convex
convex-codegen:
	npx convex codegen

# Scripts
smoke-test:
	./scripts/week1-smoke-test.sh

# Docker
docker-up:
	pnpm run docker:up

docker-down:
	pnpm run docker:down

# Clean (optional)
clean:
	rm -rf node_modules packages/*/node_modules .next packages/frontend/.next
	@echo "Removed node_modules and .next - run make install to reinstall"
