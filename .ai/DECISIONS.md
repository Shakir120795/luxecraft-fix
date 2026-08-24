# Architecture Decisions

## Locked Decisions

### D-001 — API First
All business logic is exposed through a backend API so web, iOS and Android can use the same platform.

### D-002 — Frontend
Next.js + TypeScript.

### D-003 — Backend
NestJS + TypeScript.

### D-004 — Database
PostgreSQL.

### D-005 — ORM
Prisma.

### D-006 — Cache/Queue
Redis + BullMQ.

### D-007 — Storage
S3-compatible object storage.

### D-008 — Deployment
Docker-based and cloud/VPS portable.

### D-009 — Mobile
Future React Native + Expo apps consume the same API.

### D-010 — Custom Orders
Bespoke design requests use a dedicated request → conversation → quote → design approval → payment → order workflow.

### D-011 — Product Management
Admin can create, edit, hide, archive and safely delete products/categories, with image upload and URL support.

### D-012 — Historical Commerce Data
Historical order data must not be destroyed by normal product/category changes.

### D-013 — Payment Verification
Payment success is confirmed server-side using provider verification/webhooks.

### D-014 — Admin Security
Admin access must be strongly secured with a dedicated admin authentication boundary, secure sessions, rate limiting, audit logging and 2FA capability.

### D-015 — Initial Admin Role
The initial production version has one privileged role: Super Admin / Owner with full administrative access.

Granular staff roles such as Product Manager, Order Manager, Support, Designer, Finance, Marketing and Analyst are intentionally deferred and may be added later through RBAC without redesigning the core authorization architecture.

### D-016 — Model Agnostic
The project must remain usable by Claude Code, Codex, Antigravity, Kiro, VS Code AI tools and other coding agents.

### D-017 — Canonical Documentation
`.ai/PROJECT_SPEC.md` is the canonical product specification. Model-specific instruction files must not contradict it.

## Pending Decisions

These must be decided before implementation of the relevant modules:

- Exact brand/name
- Exact product categories
- Exact payment provider(s)
- Exact shipping provider(s)
- Tax/VAT provider or rules
- Email provider
- OTP provider
- Analytics provider
- Object storage provider
- Production VPS/cloud
- Domain
- Currency strategy
- Supported countries
- Return policy
- Shipping policy
- Custom design pricing rules
- Customer support/WhatsApp strategy
