TOFU_IMAGE := monorepo-tofu
TOFU_CMD := docker run --rm -v $(shell pwd):/app/infrastructure -w /app/infrastructure $(TOFU_IMAGE)

init:
	@$(TOFU_CMD) init -input=false

plan:
	@$(TOFU_CMD) plan

apply:
	@$(TOFU_CMD) apply -auto-approve

destroy:
	@$(TOFU_CMD) destroy -auto-approve