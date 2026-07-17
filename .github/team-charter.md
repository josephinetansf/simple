# Habita Mobile App — Agent Team Charter

## Team Structure

| Agent | File | Role |
|-------|------|------|
| Architect | `.github/architect.agent.md` | Requirements, design, phase scoping |
| Developer | `.github/developer.agent.md` | Code implementation |
| Reviewer | `.github/reviewer.agent.md` | Code audit, quality gates |
| Tester | `.github/tester.agent.md` | Testing, APK verification |
| Documenter | `.github/documenter.agent.md` | Documentation, changelog |

## Workflow

```
Architect → Developer → Reviewer → Tester → Documenter → Architect (sign-off)
                ↑                              │
                └─────────── feedback ─────────┘
```

## Quality Gates

| Gate | Enforced By | Criteria |
|------|-------------|----------|
| G1: Design Review | Architect | Scope matches request, no speculation |
| G2: Code Review | Reviewer | Minimal, surgical, follows conventions |
| G3: Test Coverage | Tester | Critical paths tested, APK builds |
| G4: Documentation | Documenter | Docs match implementation |

## Behavioral Constraint: Karpathy Guidelines

All agents MUST follow these principles:

1. **Think Before Coding** — State assumptions explicitly. Surface tradeoffs. Ask when uncertain.
2. **Simplicity First** — Minimum code that solves the problem. No speculative features.
3. **Surgical Changes** — Touch only what's required. Don't improve unrelated code.
4. **Goal-Driven Execution** — Define verifiable success criteria. Loop until verified.

## Coordination Files

| File | Purpose | Updated By |
|------|---------|------------|
| `README.md` | Project overview, structure, status | Documenter |
| `.github/phase-tracker.md` | Phase status across team | All agents |
| `.github/review-log.md` | Reviewer findings & resolution | Reviewer |
| `.github/test-report.md` | Test results, defects, pass/fail | Tester |
| `.github/changelog.md` | Version history & release notes | Documenter |

## Phase Execution Order

| Phase | Name | Depends On |
|-------|------|------------|
| 0 | Team Setup & Coordination | — |
| 1 | Project Setup & Config | — |
| 2 | Database Layer | Phase 1 |
| 3 | OCR Pipeline | Phase 2 |
| 4 | UI Pages | Phase 2 |
| 5 | Notifications | Phase 2, 3 |
| 6 | Build & Release | All phases |
