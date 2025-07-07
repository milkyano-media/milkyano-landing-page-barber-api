.PHONY: help up down build build-preview logs shell db-migrate db-seed clean restart ps push push-preview preview preview-down preview-logs preview-migrate images

# Docker Hub configuration
DOCKER_USERNAME ?= syahiidkamiltech
IMAGE_NAME ?= barber-core-api
IMAGE_TAG ?= latest
PREVIEW_TAG ?= preview

# Default target
help:
	@echo "Barber Core API Docker Commands (Production):"
	@echo ""
	@echo "Local Operations:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make ps          - Show running services"
	@echo "  make build       - Build production image locally"
	@echo "  make build-preview - Build preview image locally"
	@echo "  make images      - Show all Docker images"
	@echo "  make logs        - View API logs"
	@echo "  make shell       - Access API shell"
	@echo "  make db-migrate  - Run database migrations manually"
	@echo "  make db-seed     - Seed database"
	@echo "  make clean       - Stop services and remove volumes (WARNING: deletes data)"
	@echo ""
	@echo "Docker Hub Operations:"
	@echo "  make push        - Build and push production image to Docker Hub"
	@echo "  make push-preview - Build and push preview image to Docker Hub"
	@echo ""
	@echo "Preview Environment:"
	@echo "  make preview     - Start preview environment"
	@echo "  make preview-down - Stop preview environment"
	@echo "  make preview-logs - View preview logs"
	@echo "  make preview-migrate - Run preview migrations"

# Start services
up:
	docker-compose up -d
	@echo "Services started. API available at http://localhost:$${PORT:-3000}"
	@echo "Remember to run 'make db-migrate' if this is first time setup"

# Stop services
down:
	docker-compose down

# Restart services
restart:
	docker-compose restart

# Show running services
ps:
	docker-compose ps

# Build production image locally
build:
	@echo "Building production image: $(DOCKER_USERNAME)/$(IMAGE_NAME):$(IMAGE_TAG)"
	docker build -t $(DOCKER_USERNAME)/$(IMAGE_NAME):$(IMAGE_TAG) .
	docker tag $(DOCKER_USERNAME)/$(IMAGE_NAME):$(IMAGE_TAG) $(DOCKER_USERNAME)/$(IMAGE_NAME):latest
	@echo "Production image built successfully"

# Build preview image locally
build-preview:
	@echo "Building preview image: $(DOCKER_USERNAME)/$(IMAGE_NAME)-preview:$(PREVIEW_TAG)"
	docker build -t $(DOCKER_USERNAME)/$(IMAGE_NAME)-preview:$(PREVIEW_TAG) .
	docker tag $(DOCKER_USERNAME)/$(IMAGE_NAME)-preview:$(PREVIEW_TAG) $(DOCKER_USERNAME)/$(IMAGE_NAME)-preview:latest
	@echo "Preview image built successfully"

# View logs
logs:
	docker-compose logs -f api

# Access shell
shell:
	docker-compose exec api sh

# Run database migrations manually
db-migrate:
	docker-compose run --rm migrate
	@echo "Migrations completed successfully"

# Seed database
db-seed:
	docker-compose exec api npm run db:seed
	@echo "Database seeded successfully"

# Clean everything (WARNING: removes all data)
clean:
	@echo "WARNING: This will remove all containers and volumes (data will be lost)!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	docker-compose down -v
	@echo "All containers and volumes removed"

# Push production image to Docker Hub (build first if needed)
push: build
	@echo "Pushing production image to Docker Hub..."
	docker push $(DOCKER_USERNAME)/$(IMAGE_NAME):$(IMAGE_TAG)
	docker push $(DOCKER_USERNAME)/$(IMAGE_NAME):latest
	@echo "Successfully pushed $(DOCKER_USERNAME)/$(IMAGE_NAME):$(IMAGE_TAG) and :latest"

# Push preview image to Docker Hub (build first if needed)
push-preview: build-preview
	@echo "Pushing preview image to Docker Hub..."
	docker push $(DOCKER_USERNAME)/$(IMAGE_NAME)-preview:$(PREVIEW_TAG)
	docker push $(DOCKER_USERNAME)/$(IMAGE_NAME)-preview:latest
	@echo "Successfully pushed $(DOCKER_USERNAME)/$(IMAGE_NAME)-preview:$(PREVIEW_TAG) and :latest"

# Preview environment commands
preview:
	docker-compose -f docker-compose.preview.yml up -d
	@echo "Preview environment started on port $${PREVIEW_PORT:-3001}"

preview-down:
	docker-compose -f docker-compose.preview.yml down

preview-logs:
	docker-compose -f docker-compose.preview.yml logs -f api-preview

preview-migrate:
	docker-compose -f docker-compose.preview.yml run --rm migrate-preview
	@echo "Preview migrations completed"

# Show all barber-core-api images
images:
	@echo "Production Images:"
	@docker images $(DOCKER_USERNAME)/$(IMAGE_NAME) --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
	@echo ""
	@echo "Preview Images:"
	@docker images $(DOCKER_USERNAME)/$(IMAGE_NAME)-preview --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"