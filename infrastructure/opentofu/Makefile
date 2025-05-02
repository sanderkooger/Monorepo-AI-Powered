REPO_ROOT := $(shell git rev-parse --show-toplevel)
REPO_NAME := $(shell basename $(REPO_ROOT))
.DEFAULT_GOAL := init

%: check-docker
	@:

TOFU_IMAGE := monorepo-tofu
TOFU_CMD := docker run --rm -v $(shell pwd):/app/infrastructure -w /app/infrastructure $(TOFU_IMAGE)

check-docker:
	@$(REPO_ROOT)/repository-tools/helper-scripts/check-docker.sh || (echo "Docker required for infrastructure operations"; exit 1)

init:
	@$(TOFU_CMD) init -input=false


plan:
	@$(TOFU_CMD) plan 

build:
	@docker build -f Dockerfile.opentofu -t $(TOFU_IMAGE) .

apply: build
	@$(TOFU_CMD) init -input=false
	@$(TOFU_CMD) apply -auto-approve

destroy:
	@$(TOFU_CMD) destroy -auto-approve