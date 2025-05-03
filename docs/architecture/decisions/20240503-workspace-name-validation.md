# 20240503 - Workspace Name Validation Pattern

## Context
The current workspace name validation (`^[a-z0-9-_]+$`) allows any lowercase alphanumeric string but doesn't enforce our environment naming convention:
- `prod` for production
- `accept` for acceptance testing
- `dev-{name}` for development environments

## Decision
Adopt a structured validation pattern:
```regex
^(prod|accept|dev-[a-z0-9-_]+)$
```

## Status
Approved

## Consequences
- **Positive**:
  - Explicit environment type enforcement
  - Aligns with existing directory structure (`environments/prod`, `environments/accept`)
  - Clearer error messaging
- **Negative**:
  - Requires updating existing dev environment names
  - More rigid naming structure

## Compliance
```mermaid
graph LR
    Validation -->|Ensures| Environments[Environment Directories]
    Environments --> prod
    Environments --> accept
    Environments --> dev-pattern