# Contracts Makefile

.PHONY: help build test deploy-testnet test-testnet verify

help:
	@echo "OpenClaw Contracts"
	@echo ""
	@echo "Setup:"
	@echo "  make install         Install dependencies"
	@echo "  make verify-setup    Check .env and wallet (run this first!)"
	@echo ""
	@echo "Development:"
	@echo "  make build           Compile contracts"
	@echo "  make test            Run tests"
	@echo ""
	@echo "Testnet (Base Sepolia):"
	@echo "  make deploy-testnet    Deploy Marketplace to Base Sepolia"
	@echo "  make test-testnet ADDR=<address>    Test deployed contract"
	@echo "  make verify ADDR=<implementation_address>    Verify on Basescan"
	@echo ""
	@echo "Note: Requires Node 22 LTS (nvm use 22 or fnm use 22)"

install:
	bun install

verify-setup:
	npx hardhat run scripts/verify-setup.ts --network base-sepolia

build:
	npx hardhat compile

test:
	npx hardhat test

deploy-testnet:
	npx hardhat run scripts/deploy-marketplace.ts --network base-sepolia

test-testnet:
	@if [ -z "$(ADDR)" ]; then \
		echo "Error: ADDR not set. Usage: make test-testnet ADDR=<marketplace_address>"; \
		exit 1; \
	fi
	npx hardhat run scripts/test-marketplace.ts --network base-sepolia $(ADDR)

verify:
	@if [ -z "$(ADDR)" ]; then \
		echo "Error: ADDR not set. Usage: make verify ADDR=<implementation_address>"; \
		exit 1; \
	fi
	npx hardhat verify --network base-sepolia $(ADDR)
