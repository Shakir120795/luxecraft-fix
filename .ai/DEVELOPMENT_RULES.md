# Development Rules

## Rule 1 — Read Before Change

Any AI coding agent must inspect:

- `.ai/PROJECT_SPEC.md`
- `.ai/ARCHITECTURE.md`
- `.ai/DECISIONS.md`
- `.ai/CURRENT_STATE.md`
- `.ai/TASK_QUEUE.md`

before making meaningful changes.

## Rule 2 — Never Restart From Scratch

Do not replace the existing application with a new project unless explicitly authorized.

## Rule 3 — One Feature at a Time

Complete features vertically:

Frontend → API → Database → Validation → Security → Tests → Admin → State update.

## Rule 4 — No Fake Integrations

Do not pretend payment, shipping, OTP, email or storage integrations are working when they are mocked.

Clearly label mocks.

## Rule 5 — No Secret Leakage

Never commit:

- API keys
- passwords
- private tokens
- production secrets
- payment secrets

Use environment variables.

## Rule 6 — Database Changes

Every schema change must have a migration.

Never silently modify production schema.

## Rule 7 — Commerce Safety

Never trust:

- client-side prices
- client-side stock
- client-side payment status
- client-side permissions

The backend is authoritative.

## Rule 8 — Historical Data

Do not hard-delete products/categories/custom requests/orders that are referenced by historical records unless a deliberate data-retention policy allows it.

Prefer archive/soft delete.

## Rule 9 — Verification

After changes, run the smallest relevant verification set:

- typecheck
- lint
- unit/integration tests
- build
- end-to-end tests for critical flows

## Rule 10 — State Tracking

After meaningful work update:

- CURRENT_STATE.md
- TASK_QUEUE.md
- CHANGELOG if present

## Rule 11 — Explain Work

Every completed AI task should report:

1. What changed
2. Files/modules changed
3. Tests/checks run
4. Result
5. Remaining issues

## Rule 12 — Ask on Conflict

If the requested change conflicts with a locked decision, stop and ask rather than silently changing architecture.
