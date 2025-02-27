# Monorepo AI Collaboration Guide

## Core Principles

- All projects must include their own AI_CONTEXT.md
- Infrastructure-as-Code patterns using OpenTofu
- Ansible configuration management standards

## Commit Strategy

### Atomic Changes

- Each commit must address a single logical change
- Maximum change scope per commit:
  - 1 file type (e.g., config/docs/code)
  - 1 functional area
  - 1 documentation section

### Documentation Requirements

- Commit messages must reference affected AI_CONTEXT.md sections
- Multi-file changes require a commit summary table:

| File | Change Description | Context Reference |
| ---- | ------------------ | ----------------- |

## Documentation Map
