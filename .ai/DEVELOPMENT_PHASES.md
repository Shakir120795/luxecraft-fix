# LuxeCraft — Development Phases

## Purpose

This document is the official development sequence for the LuxeCraft worldwide luxury ecommerce platform.

These phases are locked.

The project must be developed sequentially.

When the user says:

> next phase

the coding agent must identify the next incomplete phase in this document, implement only that phase, verify it, update project state, and then stop.

Do not start a later phase automatically.

---

# PHASE 1 — Project Foundation & Infrastructure

## Objective

Create the complete full-stack development foundation and make the application runnable locally.

## Work

### Repository
- Establish final repository structure.
- Move canonical documentation into `.ai/`.
- Configure Git-ready project structure.
- Configure model-agnostic AI agent instructions.

### Frontend
- Bootstrap Next.js + TypeScript storefront.
- Bootstrap Next.js admin application/interface.
- Establish shared UI foundation.
- Establish environment configuration.

### Backend
- Bootstrap NestJS + TypeScript.
- Establish REST API.
- Establish `/api/v1` API versioning.
- Establish modular backend architecture.
- Establish global validation/error handling.

### Database
- Configure PostgreSQL.
- Configure Prisma.
- Establish database connection.
- Establish migration system.

### Infrastructure
- Configure Redis.
- Configure BullMQ foundation.
- Configure Docker.
- Configure local development services.
- Configure environment variables.
- Add health checks.

### Developer Operations
- Create cross-platform project command system.
- Commands must eventually support:
  - setup
  - install
  - dev
  - test
  - lint
  - typecheck
  - build
  - db:migrate
  - db:seed
  - docker:up
  - docker:down
  - health
  - logs

## Phase 1 Completion

The full stack must run locally:

Next.js → NestJS API → PostgreSQL

with Redis/BullMQ and Docker foundation working.

No ecommerce business feature is considered complete in Phase 1.

---

# PHASE 2 — Authentication & Secure Admin Foundation

## Objective

Create secure customer authentication and the protected Super Admin system.

## Customer Authentication

- Registration
- Login
- Logout
- Password hashing
- Email verification foundation
- Email OTP foundation
- Password reset
- Session management
- Guest checkout foundation
- Rate limiting
- Bot/risk protection foundation

## Admin Authentication

- Separate admin authentication boundary
- Super Admin / Owner only
- Protected admin routes
- Secure sessions
- Login attempt protection
- Session expiration/invalidation
- 2FA-ready architecture
- Audit-log foundation

## Security

- Authorization middleware/guards
- Secure cookies/tokens
- CORS strategy
- CSRF strategy where applicable
- Security headers
- Validation
- Rate limiting

## Phase 2 Completion

A customer can securely authenticate.

A Super Admin can securely log into the admin panel.

Unauthenticated users cannot access protected admin functionality.

---

# PHASE 3 — Catalog, Products, Categories & Inventory

## Objective

Build the complete product/catalog management system.

## Categories

Admin can:

- Create
- Edit
- Hide
- Archive
- Safe-delete
- Reorder
- Add description
- Add SEO metadata
- Add category image
- Upload category image
- Use external image URL

Initial categories:

- Hand Knotted Rugs
- Hand Tufted Rugs
- Flat Weave Rugs
- Craft & Statue

Future categories must be manageable from Admin.

## Products

Admin can:

- Create
- Edit
- Hide
- Archive
- Safe-delete
- Set SKU
- Set description
- Set short description
- Set regular price
- Set sale price
- Set status
- Set SEO data
- Manage variants
- Manage customization options
- Manage shipping information

## Media

- Image upload
- External image URL
- Multiple images
- Main image
- Gallery ordering
- Replace/delete media
- Alt text
- Optional product video foundation

## Variants

Support:

- Variant SKU
- Variant price
- Variant stock
- Variant weight
- Variant dimensions
- Variant availability
- Variant-specific media where required

## Inventory

Support:

- Stock quantity
- Available stock
- Reserved stock foundation
- Variant-level stock
- Low-stock threshold
- Out-of-stock state
- Manual stock adjustment
- Inventory history/audit

## Phase 3 Completion

The Super Admin can fully manage categories, products, media, variants and inventory without developer involvement.

---

# PHASE 4 — Customer Storefront & Shopping Experience

## Objective

Build the complete premium customer-facing shopping experience.

## Storefront

- Homepage
- Header/navigation
- Footer
- Category navigation
- Category pages
- Product listing
- Product detail pages
- Search
- Filters
- Sorting
- Responsive layouts

## Product Experience

- Product gallery
- Product information
- Variants
- Availability
- Pricing
- Normal customization

## Normal Customization

Support predefined product options such as:

- Size
- Color
- Material
- Shape
- Dimensions
- Finish
- Quantity

Pricing must be recalculated and validated server-side.

## Customer Features

- Wishlist
- Cart
- Cart persistence
- Guest cart
- Customer cart

## Design Direction

The storefront must have a premium/luxury ecommerce experience appropriate for high-value rugs and crafts.

Do not copy another brand's identity or assets.

## Phase 4 Completion

A customer can browse products, select variants/customization, add products to cart and manage a wishlist.

---

# PHASE 5 — Checkout, Payments, Shipping & Orders

## Objective

Build the complete standard ecommerce transaction engine.

## Checkout

Flow:

Home
→ Category
→ Product
→ Customize
→ Cart
→ Login/Guest
→ Verification when required
→ Address
→ Shipping
→ Tax
→ Coupon
→ Final server-side total
→ Payment
→ Webhook verification
→ Order
→ Confirmation
→ Tracking

## Customer Checkout

- Address management
- Billing/shipping address
- Guest checkout
- Customer checkout
- Email verification when required
- Currency selection/display
- Coupon validation

## Shipping

- Countries
- Shipping zones
- Shipping methods
- Country-specific pricing
- Weight-based pricing
- Order-value pricing
- Free-shipping rules
- Delivery estimates
- Tracking number
- Shipment status

Shipping providers must remain abstracted.

## Tax

- Tax rules
- Country/region rules
- VAT/GST support
- Tax-inclusive/exclusive pricing foundation
- Admin configuration

## Payments

- Provider abstraction
- Payment creation
- Payment status
- Webhooks
- Server-side verification
- Failed payments
- Refund foundation
- Partial refund foundation

Never trust frontend payment success.

## Orders

- Order creation
- Order items
- Historical price snapshots
- Historical address snapshots
- Historical customization snapshots
- Order status
- Payment status
- Shipment status
- Cancellation
- Returns
- Refunds

## Phase 5 Completion

A customer can complete a real standard ecommerce purchase from product page through payment and order confirmation.

---

# PHASE 6 — Luxury Custom Design Order Engine

## Objective

Build the complete bespoke/custom design business workflow.

## Customer Custom Request

Customer can submit:

- Product/category
- Desired dimensions
- Design description
- Preferred colors
- Material preference
- Quantity
- Budget range where applicable
- Reference images
- Reference files
- Reference URLs
- Additional instructions

## Custom Request

Create unique request ID, for example:

CR-1024

Store the complete request history.

## Customer ↔ Admin Communication

- Private request-linked conversation
- Messages
- Attachments
- Read/unread state
- Timestamps
- Sender identity

## Quote Engine

Admin can create:

- Base product price
- Design fee
- Material fee
- Size/dimension fee
- Rush fee
- Shipping
- Tax
- Discount
- Currency
- Expiry
- Final total

Customer can:

- Accept
- Request changes
- Decline

Quote revisions:

- v1
- v2
- v3
- etc.

Previous versions must remain historically preserved.

## Design Workflow

- Design upload
- Design preview
- Design version
- Customer revision request
- Admin revision
- Customer approval
- Final design lock

## Custom Order Conversion

Approved custom design:

→ Checkout
→ Payment
→ Order
→ Production
→ Ready to Ship
→ Shipped
→ Delivered

## Phase 6 Completion

The complete luxury bespoke workflow works end-to-end and is connected to the central order/payment system.

---

# PHASE 7 — Business & Admin Management

## Objective

Complete the Super Admin business operating system.

## Dashboard

- Today's orders
- Revenue
- New customers
- Visitors
- Alerts
- Low stock
- Failed payments
- Pending custom requests
- Pending quotes
- Returns/refunds

## Customers

- Customer profiles
- Account status
- Verification status
- Addresses
- Order history
- Total spent
- Custom requests
- Activity

## Orders

- Search/filter
- View order
- Update status
- Manage cancellation
- Manage returns
- Manage refunds
- Shipping/tracking

## Custom Orders

- Requests
- Messages
- Quotes
- Designs
- Approvals
- Final order

## Payments

- Payment records
- Payment status
- Refunds
- Webhook logs

## Inventory

- Stock
- Adjustments
- Low stock
- Inventory history

## CMS

Admin can manage:

- Hero sections
- Banners
- Featured products
- Featured categories
- New arrivals
- Best sellers
- Promotions
- Testimonials
- Homepage sections
- Draft/preview/publish

## Coupons

- Percentage discounts
- Fixed discounts
- Product/category restrictions
- Minimum order
- Expiry
- Usage limits
- Per-customer limits
- First-order promotions
- Country-specific promotions

## Reviews

- Approve
- Hide
- Remove
- Feature

## Notifications

- Customer notifications
- Admin notifications
- Transactional event triggers

## Audit Logs

- Actor
- Action
- Resource
- Timestamp
- Before/after where appropriate

## Phase 7 Completion

The Super Admin can operate the ecommerce business without developer involvement for normal daily operations.

---

# PHASE 8 — Analytics, SEO, Security & Production Hardening

## Objective

Make the platform measurable, secure, reliable and production-ready.

## Analytics

Track:

Visitor
→ Landing Page
→ Category
→ Product View
→ Customize
→ Cart
→ Checkout
→ Payment
→ Purchase

Admin analytics:

- Visitors
- Sessions
- New vs returning
- Country/region where appropriate
- Device
- Traffic source
- Product views
- Category views
- Add to cart
- Checkout
- Purchases
- Conversion rate
- Revenue
- Average order value
- Revenue by country
- Revenue by product
- Revenue by category
- Best sellers
- Abandoned carts
- Repeat purchases
- Customer lifetime value where feasible

## SEO

- Meta titles
- Meta descriptions
- URL slugs
- Canonical URLs
- Sitemap
- Robots
- Product structured data
- Category structured data
- Image alt text

## Security Hardening

- HTTPS
- Secure cookies/tokens
- Rate limiting
- Admin protection
- 2FA capability
- File upload validation
- File size limits
- CORS
- CSRF strategy
- Security headers
- Secret management
- Dependency security
- Audit logs

## Reliability

- Error handling
- Structured logs
- Request IDs
- Health checks
- Queue monitoring
- Payment webhook reliability
- Storage reliability
- Database reliability

## Backup

- Automated database backup
- Retention
- Restore procedure
- Restore testing

## Phase 8 Completion

The platform passes security, reliability and production-readiness checks.

---

# PHASE 9 — Testing, Deployment & Launch

## Objective

Verify the complete platform and deploy it to production.

## Testing

### Unit
- Business logic
- Pricing
- Tax
- Coupons
- Inventory
- Permissions

### Integration/API
- Authentication
- Products
- Cart
- Checkout
- Orders
- Payments
- Shipping
- Custom orders
- Quotes
- Design approvals

### End-to-End

Critical flows:

1. Customer registration/login
2. Guest checkout
3. Standard product purchase
4. Payment webhook
5. Inventory update
6. Custom request
7. Admin conversation
8. Custom quote
9. Design revision
10. Customer design approval
11. Custom order payment
12. Shipping/tracking
13. Refund/return
14. Admin security

## Production

- Docker production configuration
- Nginx
- Cloudflare-compatible setup
- PostgreSQL production
- Redis production
- Object storage
- Environment variables
- Database migrations
- Backups
- Monitoring
- Logging
- Deployment scripts
- Health checks
- Rollback procedure

## Cloud/VPS Portability

Verify that the application can be deployed on:

- AWS
- Google Cloud
- DigitalOcean
- Hetzner
- Other standard Linux VPS providers

without rewriting application code.

## Phase 9 Completion

The complete full-stack ecommerce platform is tested, production-configured and ready for launch.

---

# Phase Dependency

```text
PHASE 1
Foundation
   ↓
PHASE 2
Auth + Admin Security
   ↓
PHASE 3
Catalog + Inventory
   ↓
PHASE 4
Storefront + Shopping
   ↓
PHASE 5
Checkout + Payment + Shipping + Orders
   ↓
PHASE 6
Luxury Custom Orders
   ↓
PHASE 7
Complete Admin Business System
   ↓
PHASE 8
Analytics + SEO + Hardening
   ↓
PHASE 9
Testing + Deployment + Launch
```

---

# Important Execution Rule

Only one phase may be actively implemented at a time.

When the user says:

> "next phase"

the agent must:

1. Check `.ai/CURRENT_STATE.md`.
2. Determine the next incomplete phase.
3. Read this document.
4. Implement that phase only.
5. Run appropriate verification.
6. Fix errors.
7. Update `.ai/CURRENT_STATE.md`.
8. Update `.ai/TASK_QUEUE.md`.
9. Update `.ai/DECISIONS.md` only if a genuinely new decision was explicitly approved.
10. Report completion.
11. STOP.

The agent must NOT automatically begin the next phase.

---

# Scope Protection

Do not:

- Restart the project.
- Skip phases.
- Implement later-phase features early without approval.
- Add unnecessary enterprise complexity.
- Add staff roles before they are explicitly requested.
- Replace locked technologies without approval.
- Replace PostgreSQL with another database.
- Create a separate backend for mobile.
- Couple the application to one cloud provider.
- Mark incomplete work as complete.

The user controls phase progression by saying:

> next phase
