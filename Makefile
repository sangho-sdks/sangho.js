.DEFAULT_GOAL := help

# --- Force bash sous Windows (résout ls, /dev/null, true, etc.) ---
ifeq ($(OS),Windows_NT)
SHELL := C:\Program Files\Git\cmd\git.exe
.SHELLFLAGS := -c
endif


tree:
	node ./.commands/generate-tree.js > .project/tree.txt
# =============================================================================
# Sangho SDK JS — Makefile
# =============================================================================
# Usage : make <target>
# Prérequis : pnpm, node >=18, git
# =============================================================================

.DEFAULT_GOAL := help
.PHONY: help install install-ci dev build build-watch typecheck lint lint-fix \
        test test-watch test-coverage clean clean-all \
        version-patch version-minor version-major \
        publish publish-dry changelog release \
        playground docs

# -----------------------------------------------------------------------------
# Couleurs terminal
# -----------------------------------------------------------------------------
RESET  := \033[0m
BOLD   := \033[1m
GREEN  := \033[32m
YELLOW := \033[33m
CYAN   := \033[36m
RED    := \033[31m

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------
PNPM       := pnpm
NODE       := node
VERSION    := $(shell node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")
REGISTRY   := https://registry.npmjs.org
PKG_NAME   := $(shell node -p "require('./package.json').name" 2>/dev/null || echo "sangho-sdk-js")

# -----------------------------------------------------------------------------
# AIDE
# -----------------------------------------------------------------------------
help: ## Affiche cette aide
	@echo ""
	@echo "$(BOLD)$(CYAN)Sangho SDK JS v$(VERSION)$(RESET)"
	@echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# -----------------------------------------------------------------------------
# INSTALLATION
# -----------------------------------------------------------------------------
install: ## Installe les dépendances (dev)
	@echo "$(CYAN)→ Installation des dépendances...$(RESET)"
	$(PNPM) install

install-ci: ## Installe les dépendances en mode CI (frozen lockfile)
	@echo "$(CYAN)→ Installation CI (frozen)...$(RESET)"
	$(PNPM) install --frozen-lockfile

# -----------------------------------------------------------------------------
# DÉVELOPPEMENT
# -----------------------------------------------------------------------------
dev: ## Lance le build en mode watch
	@echo "$(CYAN)→ Mode watch activé...$(RESET)"
	$(PNPM) run dev

playground: ## Lance le playground interactif (tsx)
	@echo "$(CYAN)→ Lancement du playground...$(RESET)"
	@if [ ! -f playground.ts ]; then \
		echo "$(YELLOW)⚠ playground.ts introuvable. Créez-le d'abord.$(RESET)"; \
		exit 1; \
	fi
	npx tsx playground.ts

# -----------------------------------------------------------------------------
# BUILD
# -----------------------------------------------------------------------------
build: clean ## Build de production (ESM + CJS + types)
	@echo "$(CYAN)→ Build en cours...$(RESET)"
	$(PNPM) run build
	@echo "$(GREEN)✓ Build terminé$(RESET)"
	@echo "$(CYAN)  Fichiers générés :$(RESET)"
	@ls -lh dist/ 2>/dev/null || true

build-watch: ## Build en mode watch
	$(PNPM) run build:watch

typecheck: ## Vérifie les types TypeScript sans émettre de fichiers
	@echo "$(CYAN)→ Vérification des types...$(RESET)"
	$(PNPM) run typecheck
	@echo "$(GREEN)✓ Types OK$(RESET)"

# -----------------------------------------------------------------------------
# QUALITÉ DU CODE
# -----------------------------------------------------------------------------
lint: ## Lint du code source
	@echo "$(CYAN)→ Lint...$(RESET)"
	$(PNPM) run lint

lint-fix: ## Lint + correction automatique
	@echo "$(CYAN)→ Lint + fix...$(RESET)"
	$(PNPM) run lint:fix
	@echo "$(GREEN)✓ Lint corrigé$(RESET)"

check: lint typecheck ## Lint + typecheck (pipeline qualité)
	@echo "$(GREEN)✓ Qualité OK$(RESET)"

# -----------------------------------------------------------------------------
# TESTS
# -----------------------------------------------------------------------------
test: ## Lance les tests (une fois)
	@echo "$(CYAN)→ Tests...$(RESET)"
	$(PNPM) run test

test-watch: ## Lance les tests en mode watch
	$(PNPM) run test:watch

test-coverage: ## Lance les tests avec rapport de couverture
	@echo "$(CYAN)→ Tests + couverture...$(RESET)"
	$(PNPM) run test:coverage
	@echo "$(GREEN)✓ Rapport généré dans ./coverage$(RESET)"

test-ci: ## Tests + couverture pour CI (exit code si seuil non atteint)
	@echo "$(CYAN)→ Tests CI...$(RESET)"
	$(PNPM) run test:coverage --reporter=json
	@echo "$(GREEN)✓ Tests CI OK$(RESET)"

test-integration: ## Tests intégration sandbox (nécessite SANGHO_API_KEY)
	@echo "$(CYAN)→ Tests intégration sandbox...$(RESET)"
	$(PNPM) vitest run "tests/integration/**/*.test.ts"
	@echo "$(GREEN)✓ Tests intégration OK$(RESET)"
	@echo "$(CYAN)→ Tests CI...$(RESET)"
	$(PNPM) run test:coverage --reporter=json
	@echo "$(GREEN)✓ Tests CI OK$(RESET)"

# -----------------------------------------------------------------------------
# NETTOYAGE
# -----------------------------------------------------------------------------
clean: ## Supprime le dossier dist/
	@echo "$(CYAN)→ Nettoyage dist/...$(RESET)"
	$(PNPM) run clean

clean-all: clean ## Supprime dist/, node_modules/, coverage/
	@echo "$(CYAN)→ Nettoyage complet...$(RESET)"
	rm -rf node_modules coverage test-results .pnpm-store
	@echo "$(GREEN)✓ Nettoyage complet$(RESET)"

# -----------------------------------------------------------------------------
# VERSIONING (Semantic Versioning)
# -----------------------------------------------------------------------------
version-patch: check test ## Bump patch version (0.1.0 → 0.1.1)
	@echo "$(CYAN)→ Bump patch...$(RESET)"
	$(PNPM) version patch --no-git-tag-version
	@echo "$(GREEN)✓ Nouvelle version : $(shell node -p "require('./package.json').version")$(RESET)"

version-minor: check test ## Bump minor version (0.1.0 → 0.2.0)
	@echo "$(CYAN)→ Bump minor...$(RESET)"
	$(PNPM) version minor --no-git-tag-version
	@echo "$(GREEN)✓ Nouvelle version : $(shell node -p "require('./package.json').version")$(RESET)"

version-major: check test ## Bump major version (0.1.0 → 1.0.0)
	@echo "$(CYAN)→ Bump major...$(RESET)"
	$(PNPM) version major --no-git-tag-version
	@echo "$(GREEN)✓ Nouvelle version : $(shell node -p "require('./package.json').version")$(RESET)"

changelog: ## Génère le CHANGELOG (nécessite conventional-changelog)
	@echo "$(CYAN)→ Génération du CHANGELOG...$(RESET)"
	npx conventional-changelog-cli -p angular -i CHANGELOG.md -s
	@echo "$(GREEN)✓ CHANGELOG mis à jour$(RESET)"

# -----------------------------------------------------------------------------
# PUBLICATION npm
# -----------------------------------------------------------------------------
publish-dry: build typecheck ## Simule la publication sans publier
	@echo "$(CYAN)→ Simulation publication (dry-run)...$(RESET)"
	$(PNPM) publish --dry-run --no-git-checks
	@echo "$(GREEN)✓ Simulation OK$(RESET)"

publish: build typecheck test ## Publie sur npm (nécessite NPM_TOKEN)
	@echo "$(CYAN)→ Publication v$(VERSION) sur npm...$(RESET)"
	@if [ -z "$$NPM_TOKEN" ]; then \
		echo "$(RED)✗ NPM_TOKEN manquant. Exportez-le : export NPM_TOKEN=xxx$(RESET)"; \
		exit 1; \
	fi
	$(PNPM) publish --no-git-checks --registry $(REGISTRY)
	@echo "$(GREEN)✓ $(PKG_NAME)@$(VERSION) publié sur npm$(RESET)"

# -----------------------------------------------------------------------------
# RELEASE COMPLÈTE (versioning + git tag + publish)
# -----------------------------------------------------------------------------
release-patch: ## Release patch complète (bump + tag + publish)
	$(MAKE) version-patch
	$(MAKE) _git-tag-and-push
	$(MAKE) publish

release-minor: ## Release minor complète (bump + tag + publish)
	$(MAKE) version-minor
	$(MAKE) _git-tag-and-push
	$(MAKE) publish

release-major: ## Release major complète (bump + tag + publish)
	$(MAKE) version-major
	$(MAKE) _git-tag-and-push
	$(MAKE) publish

_git-tag-and-push: ## (Interne) Commit, tag et push git
	$(eval NEW_VERSION := $(shell node -p "require('./package.json').version"))
	@echo "$(CYAN)→ Git commit + tag v$(NEW_VERSION)...$(RESET)"
	git add package.json CHANGELOG.md
	git commit -m "chore: release v$(NEW_VERSION)"
	git tag -a "v$(NEW_VERSION)" -m "Release v$(NEW_VERSION)"
	git push origin main --tags
	@echo "$(GREEN)✓ Tag v$(NEW_VERSION) poussé$(RESET)"

# -----------------------------------------------------------------------------
# INFOS
# -----------------------------------------------------------------------------
info: ## Affiche les infos du SDK
	@echo "$(BOLD)Package  :$(RESET) $(PKG_NAME)"
	@echo "$(BOLD)Version  :$(RESET) $(VERSION)"
	@echo "$(BOLD)Registry :$(RESET) $(REGISTRY)"
	@echo "$(BOLD)Node     :$(RESET) $(shell node --version)"
	@echo "$(BOLD)pnpm     :$(RESET) $(shell pnpm --version)"