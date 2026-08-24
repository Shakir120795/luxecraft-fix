# Architecture

## High-Level

```text
                    ┌─────────────────────┐
                    │   Customer Web      │
                    │      Next.js        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    REST API v1      │
                    │      NestJS         │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐    ┌────────▼────────┐    ┌───────▼────────┐
│  PostgreSQL    │    │      Redis      │    │ Object Storage │
│ Source of Truth│    │ Cache + Queue   │    │ Images/Files   │
└────────────────┘    └────────┬────────┘    └────────────────┘
                               │
                         ┌─────▼─────┐
                         │  Worker   │
                         │ BullMQ    │
                         └───────────┘

Future:
Next.js Web
React Native iOS
React Native Android
Admin
      │
      └──────────────► Same API
```

## Application Boundaries

### Storefront
Customer-facing UI only. No direct database access.

### Admin
Business management UI. No direct database access.

### API
Authentication, authorization, validation and business rules.

### Database
Persistent source of truth.

### Workers
Async tasks such as emails, notifications, analytics processing and other non-blocking jobs.

### Storage
Product media and private customer files.

## Domain Modules

Recommended backend modules:

```text
auth
users
catalog
categories
products
variants
inventory
cart
checkout
orders
payments
shipping
customers
custom-orders
quotes
designs
messaging
reviews
wishlist
coupons
cms
analytics
notifications
admin
rbac
audit
files
health
```

Modules should have clear boundaries and avoid unnecessary cross-module coupling.

## API Rules

- Version APIs.
- Validate every external request.
- Authorize every protected action.
- Keep payment state server-side.
- Keep pricing calculations server-side.
- Keep inventory mutation server-side.
- Use idempotency for payment/order-sensitive operations.
- Use webhooks for provider callbacks.
- Return stable error formats.

## Data Rules

- PostgreSQL is authoritative.
- Use transactions for related commerce mutations.
- Historical order data must be immutable except for explicitly allowed administrative corrections.
- Store snapshots for order pricing/address/customization.
- Use soft delete/archive for entities referenced by historical commerce records.

## Storage Rules

Public media may be served through CDN.

Private customer design files must require authorization or signed access.

## Deployment

Prefer Dockerized services and environment-based configuration.

The same application should run on a developer machine and a standard Linux VPS with configuration changes only.
