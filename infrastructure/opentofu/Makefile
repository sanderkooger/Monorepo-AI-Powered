TOFU_IMAGE := monorepo-tofu
TOFU_CMD := docker run --rm -v $(shell pwd):/app/infrastructure -w /app/infrastructure $(TOFU_IMAGE)

init:
	@$(TOFU_CMD) init -input=false

plan:
	@$(TOFU_CMD) plan

build:
	@docker build -f Dockerfile.opentofu -t $(TOFU_IMAGE) .

REPO_NAME := $(shell basename $(shell git rev-parse --show-toplevel))
apply: build
	@$(TOFU_CMD) init -input=false -var "vault_addr=$(VAULT_ADDR)" -var "vault_token=$(VAULT_TOKEN)" -var "repo_name=$(REPO_NAME)"
	@$(TOFU_CMD) apply -auto-approve -var "vault_addr=$(VAULT_ADDR)" -var "vault_token=$(VAULT_TOKEN)" -var "repo_name=$(REPO_NAME)"

destroy:
	@$(TOFU_CMD) destroy -auto-approve