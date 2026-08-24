# Worldwide Custom Ecommerce Platform — Master Project Specification

## 1. Project Goal

Build a production-ready, worldwide ecommerce platform for physical products with:

- Premium storefront experience
- Product/category management
- Product variants and inventory
- Customer accounts and guest checkout
- Email/OTP verification and bot protection
- Worldwide shipping and payments
- Custom design/order request workflow
- Customer ↔ admin communication
- Admin quotations and customer approval
- Design revision and approval workflow
- Orders, payments, shipping, returns and refunds
- Customer and business analytics
- CMS/homepage management
- SEO controls
- Role-based admin access
- Audit logs and security
- API-first architecture for future iOS/Android apps
- Cloud/VPS portability

The platform must not be tightly coupled to one cloud provider.

---

## 2. Product Philosophy

This is not only a frontend ecommerce website.

It is a complete commerce platform consisting of:

1. Customer Storefront
2. Commerce/API Backend
3. PostgreSQL Database
4. Admin/Business Dashboard
5. Custom Order Engine
6. Payment Integration
7. Shipping Integration
8. File/Object Storage
9. Analytics
10. Notification System
11. Security/Auth System
12. Future Mobile API layer

---

## 3. Customer Storefront Flow

### Standard purchase

Home
→ Category
→ Product
→ Product customization
→ Cart
→ Login/Guest Checkout
→ Verification when required
→ Address
→ Shipping
→ Payment
→ Payment verification
→ Order Confirmation
→ Order Tracking

### Custom design purchase

Home
→ Product
→ Request Custom Design
→ Requirements
→ Reference files/images
→ Custom Request
→ Customer/Admin conversation
→ Admin quotation
→ Customer accepts or requests changes
→ Design preview
→ Customer approval
→ Checkout
→ Payment
→ Order
→ Production
→ Shipping
→ Delivery

---

## 4. Authentication and Customer Verification

Support:

- Email/password registration
- Email verification/OTP
- Login
- Password reset
- Guest checkout
- Optional Google/Apple login later
- Session management
- Suspicious-login protection
- Rate limiting
- CAPTCHA/risk-based bot protection
- Checkout verification when required

Do not force unnecessary OTP/CAPTCHA on every normal action.

Risk-based verification should be preferred where possible.

Admin authentication must be stronger:

- Separate admin authentication
- Role-based permissions
- Optional/required 2FA for privileged accounts
- Session expiration
- Audit logging

---

## 5. Products

Admin must be able to create, edit and manage products without developer involvement.

Product fields may include:

- Name
- SKU
- Category
- Subcategory
- Description
- Short description
- Regular price
- Sale price
- Currency
- Product status
- Inventory tracking
- Stock quantity
- Low-stock threshold
- Weight
- Dimensions
- Variants
- Customization options
- Shipping information
- SEO title
- SEO description
- URL slug
- Tags
- Images
- Video
- Alt text

Product status:

- Draft
- Active
- Hidden
- Archived

Permanent deletion must be protected when historical orders reference the product. Archive is preferred.

---

## 6. Product Media

Admin can add media through:

### Upload

Upload files from the computer.

### External URL

Paste an image URL.

Uploaded files should be stored in object storage and referenced from the database.

The database must not store large image binaries.

The system should support:

- Multiple images
- Gallery ordering
- Main image
- Replace
- Delete
- Image alt text
- Optional video
- Product media previews

---

## 7. Categories

Admin can:

- Create category
- Edit category
- Hide category
- Archive category
- Delete where safe
- Reorder categories
- Add category image
- Upload image
- Use external image URL
- Add description
- Add SEO metadata
- Manage subcategories

Hidden/archived categories must not destroy historical order references.

---

## 8. Product Variants

Variants must support independent:

- SKU
- Price
- Stock
- Weight
- Dimensions
- Images where needed
- Availability

Example:

Product:
Custom Rug

Variants:
- 5x7 / Standard
- 6x9 / Standard
- 8x10 / Premium

Each variant can have separate inventory.

---

## 9. Normal Product Customization

Normal customization is for predefined options.

Examples:

- Size
- Color
- Material
- Shape
- Dimensions
- Finish
- Quantity

Pricing can be calculated automatically.

Example:

Base product = $350
Large size = +$50
Premium material = +$80

Final = $480

The exact pricing rules must be configurable by admin.

---

## 10. Custom Design Order Engine

A completely bespoke design must use a separate request workflow.

### Customer submits:

- Product/category
- Desired dimensions
- Design description
- Preferred colors
- Material preference
- Quantity
- Reference images/files
- Additional instructions

### Admin receives:

Custom Request ID.

Example:

CR-1024

### Request contains:

- Customer
- Product/category
- Requirements
- Files
- Messages
- Quotes
- Design revisions
- Approval history
- Payment
- Final order

---

## 11. Customer ↔ Admin Communication

Communication should happen inside the platform and be linked to the Custom Request.

Each request has:

- Messages
- Attachments
- Timestamp
- Sender
- Read/unread status

Optional future WhatsApp integration may be added, but WhatsApp must not be the primary system of record.

The complete request history must remain inside the platform.

---

## 12. Custom Quote Engine

Admin decides the final custom price.

A quote can contain:

- Base product
- Custom design fee
- Custom dimensions
- Special material
- Additional work
- Rush fee
- Discount
- Shipping
- Taxes where applicable
- Final total
- Currency
- Quote expiry

Customer can:

- Accept quote
- Request changes
- Decline quote

Quote revisions must maintain history.

Example:

Quote v1 = $570
Customer requests change
Quote v2 = $550

Old quote must remain historically recorded.

---

## 13. Design Revision and Approval

Custom orders may require design previews.

Support:

- Design v1
- Design v2
- Design v3
- Final design

Customer actions:

- Approve
- Request revision

Once approved, the final design must be locked and linked to the order.

Store:

- Design file
- Version
- Uploaded by
- Timestamp
- Approval timestamp
- Approving customer
- Approval status

---

## 14. Cart

Support:

- Product items
- Variants
- Quantity
- Product customization
- Custom order items where applicable
- Coupon
- Shipping estimate
- Tax estimate
- Currency
- Guest cart
- Customer cart

Cart totals must always be validated server-side.

---

## 15. Checkout

Checkout flow:

1. Cart validation
2. Customer/guest identification
3. Email verification if required
4. Address
5. Shipping method
6. Tax/duty calculation where applicable
7. Coupon
8. Final server-side total
9. Payment initiation
10. Payment provider verification
11. Order creation/confirmation

The frontend must never be trusted as the source of truth for price or payment status.

---

## 16. Payment

Payment integration must be provider-agnostic.

Flow:

Customer
→ Backend
→ Payment Provider
→ Provider Webhook
→ Backend verifies webhook
→ Payment status updated
→ Order finalized

Never mark an order as paid solely because the browser reports success.

Support architecture for:

- Card payments
- International payments
- Provider-specific local methods where applicable
- Refunds
- Partial refunds
- Failed payments
- Payment webhooks
- Payment records

The exact provider will be selected separately.

---

## 17. Worldwide Shipping

Admin must be able to configure:

- Countries
- Shipping zones
- Shipping methods
- Country-specific pricing
- Weight-based pricing
- Order-value pricing
- Free shipping rules
- Estimated delivery time
- Tracking number
- Shipment status

Shipping provider integrations must be abstracted so the provider can be changed later.

---

## 18. Taxes / VAT / Duties

Architecture must support:

- Tax rules
- VAT/GST
- Tax-inclusive/exclusive pricing
- Country/region rules
- Duties information

Tax calculations should not be hard-coded into the frontend.

---

## 19. Orders

All orders belong to one central order system.

Order types:

- Standard
- Custom

Order lifecycle can include:

Pending
→ Payment Confirmed
→ Processing
→ Customization/Production
→ Ready to Ship
→ Shipped
→ Out for Delivery
→ Delivered

Other states:

- Cancelled
- Failed
- Refunded
- Returned
- On Hold

Each order must preserve historical snapshots of:

- Customer information relevant to the order
- Shipping/billing address
- Product name
- SKU
- Variant
- Price at purchase
- Quantity
- Customization
- Discount
- Tax
- Shipping
- Currency

Changing a product later must not rewrite old order history.

---

## 20. Returns / Refunds

Customer can request:

- Cancellation
- Return
- Refund

Admin can:

- Approve
- Reject
- Partial refund
- Full refund
- Record reason
- Update status

Refunds must be linked to payment records.

---

## 21. Inventory

Support:

- Stock quantity
- Available stock
- Reserved stock
- Low-stock threshold
- Out-of-stock status
- Stock tracking ON/OFF
- Variant-level inventory
- Stock adjustments
- Order deduction
- Cancellation/return adjustments

Admin should be able to manually adjust inventory with an audit trail.

---

## 22. Customers

Customer profile should include:

- Customer ID
- Name
- Email
- Phone
- Country
- Addresses
- Account status
- Verification status
- Orders
- Total spent
- Last purchase
- Registration date
- Customer activity
- Wishlist
- Reviews
- Custom requests

Avoid storing unnecessary sensitive personal data.

---

## 23. Analytics

Track the ecommerce funnel:

Visitor
→ Product View
→ Add to Cart
→ Checkout
→ Payment
→ Purchase

Admin analytics should include:

- Visitors
- Unique visitors
- Sessions
- New vs returning
- Country
- Region where appropriate
- Device
- Traffic source
- Product views
- Category views
- Add to cart
- Checkout started
- Purchases
- Conversion rate
- Revenue
- Average order value
- Revenue by country
- Revenue by product
- Revenue by category
- Best sellers
- Repeat purchase rate
- Customer lifetime value where feasible
- Abandoned carts

Privacy and data-retention requirements must be respected for worldwide users.

---

## 24. Abandoned Cart

Track carts where checkout/purchase was not completed.

Admin can see:

- Abandoned carts
- Cart value
- Customer/guest status
- Last activity

Future capability:

- Email recovery
- Promotional recovery
- Automated reminders

---

## 25. Wishlist

Customer can:

- Add product
- Remove product
- View wishlist
- Move wishlist item to cart

---

## 26. Reviews

Only verified purchasers should be eligible for verified reviews.

Admin can:

- Approve
- Hide
- Remove
- Feature

Reviews are associated with products and customers.

---

## 27. Coupons and Promotions

Support:

- Percentage discount
- Fixed discount
- Product-specific discount
- Category-specific discount
- Minimum order value
- Expiry date
- Usage limit
- Per-customer limit
- First-order promotion
- Country-specific promotion

Coupon validation must happen server-side.

---

## 28. Homepage / CMS

Admin should modify storefront content without developer changes.

Manage:

- Hero sections
- Banners
- Images
- Text
- Featured products
- Featured categories
- New arrivals
- Best sellers
- Promotions
- Testimonials
- Promotional sections
- Homepage ordering

Content should support draft/preview/publish where practical.

---

## 29. SEO

Admin controls:

- SEO title
- Meta description
- URL slug
- Image alt text
- Product/category metadata

Platform should generate/manage:

- Sitemap
- Robots rules
- Canonical URLs
- Structured data/schema where appropriate

---

## 30. Notifications

Customer notifications:

- Account verification
- Password reset
- Order confirmation
- Payment confirmation
- Order status
- Shipping
- Delivery
- Custom request update
- Admin message
- Quote ready
- Quote update
- Design preview
- Design approval
- Refund

Admin notifications:

- New order
- New customer
- Custom request
- New message
- Payment failure
- Low stock
- Return request
- Refund request

Email first; SMS/WhatsApp can be added later.

---

## 31. Admin Access and Roles

### Initial Version

Only one privileged administrative role is required:

### Super Admin / Owner
Full access to the complete admin panel.

The initial release must not add unnecessary staff roles.

### Future

The authorization architecture must remain RBAC-ready so granular roles can be introduced later without redesigning the application.

Possible future roles may include:

- Product Manager
- Order Manager
- Support
- Designer
- Finance
- Marketing
- Analyst

Permissions must be enforced server-side even though the initial release has one full-access role.

---

## 32. Audit Logs

Record important admin actions:

- Product created
- Product edited
- Product hidden
- Product archived
- Product deleted
- Price changed
- Stock changed
- Category changed
- Order status changed
- Refund issued
- Quote changed
- Design approved
- Permission changed

Record:

- Actor
- Action
- Resource
- Before/after where appropriate
- Timestamp
- Request metadata where appropriate

---

## 33. Admin Dashboard

Dashboard should show:

### Today

- Orders
- Revenue
- New customers
- Visitors

### Period analytics

- Revenue
- Orders
- Customers
- Conversion
- Top products
- Top countries

### Alerts

- Low stock
- Failed payments
- Pending custom requests
- Pending quotes
- Return/refund requests

---

## 34. Technology Decisions

### Frontend

Next.js + TypeScript

### Backend

NestJS + TypeScript

### API

REST API

API must be versionable, e.g. `/api/v1/...`.

### Database

PostgreSQL

### ORM

Prisma

### Cache / Queue

Redis

### Background Jobs

BullMQ

### Object Storage

S3-compatible storage

Examples:

- Amazon S3
- Cloudflare R2
- DigitalOcean Spaces

The application must not hard-code itself to one storage provider.

### Reverse Proxy

Nginx

### CDN / DNS / Security

Cloudflare-compatible architecture

### Containerization

Docker

### Version Control

Git + GitHub

### Future Mobile

React Native + Expo

---

## 35. API-First Requirement

The website must never contain business logic that is required only because it is a website.

Core business logic belongs in the backend.

Future clients:

- Web
- iOS
- Android
- Admin

must consume the same backend API.

Target:

Web
→ API
→ Backend Services
→ Database/Storage

iOS
→ API
→ Backend Services
→ Database/Storage

Android
→ API
→ Backend Services
→ Database/Storage

---

## 36. Database Principles

Use PostgreSQL as the source of truth.

Important relational entities include:

- users
- user_addresses
- sessions
- categories
- products
- product_variants
- product_images
- inventory
- carts
- cart_items
- orders
- order_items
- payments
- refunds
- shipments
- custom_requests
- custom_messages
- custom_quotes
- custom_designs
- design_revisions
- coupons
- reviews
- wishlists
- notifications
- analytics_events
- admin_users
- roles
- permissions
- audit_logs

This list is conceptual, not a final migration/schema.

---

## 37. Cloud/VPS Portability

The platform must be deployable on:

- AWS
- Google Cloud
- DigitalOcean
- Hetzner
- Other standard Linux VPS providers

Avoid unnecessary provider-specific dependencies.

Use:

- Docker
- Environment variables
- PostgreSQL
- Redis
- Object-storage abstraction
- Reverse proxy
- Automated migrations
- Health checks
- Logs

---

## 38. Production Architecture

Conceptual:

Internet
→ Cloudflare/CDN
→ Nginx
→ Next.js
→ NestJS API
→ PostgreSQL

Backend
→ Redis
→ Worker/BullMQ

Backend
→ Object Storage

Backend
→ Payment Provider

Backend
→ Shipping Provider

Backend
→ Email/Notification Provider

---

## 39. Environment Management

Never hard-code:

- Database passwords
- API keys
- Payment secrets
- Storage credentials
- SMTP credentials
- JWT secrets

Use environment variables.

Maintain separate environments:

- Development
- Staging
- Production

---

## 40. Security Requirements

Must include:

- HTTPS
- Secure cookies/tokens
- Strong password hashing
- Input validation
- Output validation where appropriate
- Rate limiting
- CSRF strategy where applicable
- Strict CORS configuration
- SQL injection protection through ORM/query discipline
- XSS protection
- File upload validation
- File size limits
- Dedicated admin authentication boundary
- Admin session timeout/invalidation
- Admin login attempt protection
- Admin 2FA capability
- Audit logging
- Secure secrets
- Backup strategy
- Dependency/security updates

Admin security is a high-priority requirement. The Super Admin account must not rely on ordinary customer authentication alone.

---

## 41. File Upload Security

Uploaded files must be:

- Type validated
- Size limited
- Sanitized
- Stored outside application source
- Given safe generated names/keys
- Access controlled when private

Customer custom-design files must not automatically become public.

---

## 42. Observability

Production should support:

- Application logs
- Error logs
- Request IDs
- Health endpoint
- Database health
- Queue health
- Payment webhook logs
- Shipping integration logs

Optional future:

- Error tracking
- Metrics
- Tracing
- Uptime monitoring

---

## 43. Backup

Database backups must be automated.

Need:

- Backup schedule
- Retention
- Restore procedure
- Periodic restore testing

Backups are part of the production requirement, not an optional afterthought.

---

## 44. Model-Agnostic AI Development

The project must be understandable by:

- Claude Code
- Codex
- Antigravity
- VS Code + AI extensions
- Kiro
- Other coding agents

There must be one canonical source of project truth.

Suggested repository documentation:

```text
/
├── .ai/
│   ├── PROJECT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── DEVELOPMENT_RULES.md
│   ├── CURRENT_STATE.md
│   └── TASK_QUEUE.md
├── AGENTS.md
├── CLAUDE.md
├── GEMINI.md
├── README.md
└── ...
```

`PROJECT_SPEC.md` is the canonical product requirement.

AI-specific files must not contain conflicting requirements.

---

## 45. Single Command Development Control

The repository should eventually expose one cross-platform project command.

Target examples:

### Windows

`dev.ps1 <command>`

### Linux/macOS

`./dev <command>`

Or a cross-platform package command such as:

`npm run dev:project -- <command>`

Commands should eventually cover:

- status
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

The command runner must be the project's operational entry point, while AI coding tools remain responsible for code changes.

---

## 46. AI Agent Rules

Every AI coding agent must:

1. Read canonical project documentation before modifying code.
2. Never rewrite the project from scratch unless explicitly instructed.
3. Preserve existing architecture and decisions.
4. Inspect the current code before changing it.
5. Work in small, testable phases.
6. Run relevant tests/typechecks/lint after changes.
7. Never invent credentials.
8. Never expose secrets.
9. Never silently change database schema.
10. Create migrations for schema changes.
11. Never mark payment as successful based only on frontend state.
12. Never delete historical commerce data casually.
13. Prefer archive/soft-delete for business entities with history.
14. Update project state documentation after meaningful changes.
15. Explain what changed and what was verified.
16. Stop and ask when a requirement conflicts with a locked architectural decision.

---

## 47. Development Philosophy

Build in vertical slices.

Do not build the entire frontend first and backend later.

Each major feature should be completed across:

UI
→ API
→ Database
→ Validation
→ Security
→ Tests
→ Admin where required
→ Documentation/state

Example:

Product Management should be implemented as a complete feature, not only as a UI mockup.

---

## 48. Testing Requirements

Testing strategy should include:

- Unit tests
- API/integration tests
- Database tests where appropriate
- Authentication tests
- Checkout tests
- Payment webhook tests
- Inventory tests
- Custom quote tests
- Permission/RBAC tests
- End-to-end critical flows

Critical ecommerce flows must be tested before production.

---

## 49. Non-Goals for Initial Core Version

Do not automatically add:

- Loyalty points
- Affiliate system
- Subscription commerce
- Marketplace/multi-vendor
- Cryptocurrency payments
- Complex AI recommendation engine
- Unnecessary microservices

These may be future modules only if explicitly approved.

---

## 50. Final Architectural Principle

The system should be:

- API-first
- Database-driven
- Cloud portable
- Mobile ready
- Secure
- Maintainable
- Testable
- Modular
- Admin manageable
- Custom-order capable
- Worldwide-commerce capable

The goal is not merely to copy an existing ecommerce website.

The goal is to build a reusable commerce platform that can operate the business without requiring a developer for normal daily tasks.
