# LuxeCraft — Global Luxury Design System & Website UI Consistency

**LAST UPDATED:** Phase 9 — Frontend Development

---

## CRITICAL RULE

The **Home Page** and **Product Page** are already built.

These two existing pages are now the **PRIMARY VISUAL REFERENCE** for the entire LuxeCraft website.

**DO NOT** redesign the Home Page or Product Page from scratch.

**DO NOT** replace their existing visual identity unnecessarily.

Your task is to study the existing Home Page and Product Page implementation carefully and establish one consistent global luxury design system based on them, then apply that design system consistently across the rest of the website.

**The website must feel like ONE premium luxury brand**, not a collection of separately designed pages.

---

## 1. FIRST — INSPECT THE EXISTING IMPLEMENTATION

Before changing anything:

- ✅ Inspect the complete Home Page code: `apps/storefront/src/app/page.tsx`
- ✅ Inspect the complete Product Page code: `apps/storefront/src/app/products/[slug]/page.tsx`
- ✅ Inspect all existing CSS/Tailwind/theme files:
  - `apps/storefront/tailwind.config.js`
  - `apps/storefront/src/app/globals.css`
- ✅ Inspect existing components:
  - `apps/storefront/src/components/ProductCard.tsx`
  - `apps/storefront/src/components/CategoryCard.tsx`
- ✅ Inspect existing fonts
- ✅ Inspect existing colors
- ✅ Inspect existing spacing
- ✅ Inspect existing buttons
- ✅ Inspect existing cards
- ✅ Inspect existing header/navigation (if present)
- ✅ Inspect existing footer (if present)
- ✅ Inspect existing responsive behavior
- ✅ Inspect existing light/dark theme implementation if already present
- ✅ Run the current application and visually inspect the Home Page and Product Page

**Do NOT make changes before understanding the existing implementation.**

The existing Home Page and Product Page are the visual source of truth.

---

## 2. LUXURY DESIGN DIRECTION

The overall visual direction of LuxeCraft is:

**"Quiet Luxury + Indian Craftsmanship + Modern Editorial"**

The website should feel:

- Premium
- Sophisticated
- Warm
- Artistic
- Handcrafted
- Expensive
- Calm
- Editorial
- Modern
- Trustworthy

It should feel like:

**"A luxury design house that happens to have an ecommerce store."**

It must **NOT** feel like:

- Generic Shopify
- Cheap marketplace
- Overly colorful ecommerce
- Template-based website
- Excessively rounded SaaS UI
- Flashy modern startup UI

---

## 3. COLOR SYSTEM

Use the existing Home/Product implementation as the primary reference.

Where a global palette needs to be standardized, use this direction:

### LIGHT THEME

| Color | Hex | Usage |
|---|---|---|
| Background | `#F6F1E8` | Page background |
| Surface | `#FBF8F2` | Cards, elevated surfaces |
| Primary Text | `#211D19` | Headings, primary content |
| Secondary Text | `#756B61` | Body text, descriptions |
| Border | `#DED5C8` | Dividers, card borders |
| Muted Terracotta | `#A86F5D` | Accent elements |
| Antique Brass / Gold | `#B3955A` | CTA, highlights |
| Dark Section | `#25211D` | Hero sections, footer |

### DARK THEME

| Color | Hex | Usage |
|---|---|---|
| Background | `#171513` | Page background |
| Surface | `#211E1A` | Cards, elevated surfaces |
| Primary Text | `#F2ECE2` | Headings, primary content |
| Secondary Text | `#B9AEA0` | Body text, descriptions |
| Border | `#3A342D` | Dividers, card borders |
| Muted Terracotta | `#B97864` | Accent elements |
| Antique Brass / Gold | `#C1A269` | CTA, highlights |

### CURRENT IMPLEMENTATION (Phase 9)

```javascript
// tailwind.config.js
colors: {
  luxury: {
    cream: '#FAF8F5',      // Background
    beige: '#F5F1ED',      // Surface
    sand: '#E8E3DC',       // Border
    gold: '#D4AF37',       // Accent/CTA
    darkGold: '#B8860B',   // Hover states
    brown: '#4A3F35',      // Secondary text
    charcoal: '#2D2A26',   // Primary text / Dark sections
  },
}
```

### IMPORTANT RULES

- Do not blindly replace existing colors.
- If the current Home/Product pages already use visually equivalent colors, preserve them.
- The goal is consistency, not unnecessary redesign.
- Avoid pure white and pure black as the dominant visual background.
- Use warm ivory and deep espresso/charcoal instead.
- Accent colors must remain restrained.
- Use approximately: **90% neutral + 10% accent**
- Gold and terracotta should be accents, not dominant colors.

---

## 4. TYPOGRAPHY

Maintain the typography direction already established by Home/Product.

Global typography should follow:

### FONT FAMILIES

**SERIF:** Luxury/editorial headings

**SANS-SERIF:** Navigation, body text, UI, pricing and functional content

### Recommended Direction

| Element | Font | Weight | Size |
|---|---|---|---|
| Headings | Cormorant Garamond / DM Serif Display style | Light/Regular | Variable |
| Body/UI | Inter / Manrope style | Regular/Medium | 16px base |

### CURRENT IMPLEMENTATION

```javascript
// tailwind.config.js
fontFamily: {
  sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
}
```

```css
/* globals.css */
h1, h2, h3, h4, h5, h6 {
  @apply font-serif;
}
```

### TYPOGRAPHY HIERARCHY

Create a consistent typography hierarchy:

- **Display** — Hero headlines (56-72px)
- **H1** — Page titles (40-48px)
- **H2** — Section headings (32-36px)
- **H3** — Subsection headings (24-28px)
- **Body** — Paragraph text (16-18px)
- **Small** — Captions (14px)
- **Caption** — Labels (12px)
- **Label** — Form labels (14px, uppercase, tracking-wide)
- **Navigation** — Nav links (14-16px)
- **Price** — Product pricing (serif, 28-36px)
- **Button** — CTA text (14px, uppercase, tracking-wider)

**Every page must use the same hierarchy.**

**Do NOT change fonts if the existing implementation already has a strong equivalent.**

---

## 5. SPACING SYSTEM

Create a consistent spacing system.

Use generous whitespace.

Luxury design depends heavily on:

- Breathing room
- Large margins
- Clean sections
- Controlled content width
- Consistent vertical rhythm

### SPACING SCALE

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Tight spacing |
| sm | 8px | Small gaps |
| md | 16px | Default spacing |
| lg | 24px | Section padding |
| xl | 32px | Large sections |
| 2xl | 48px | Hero sections |
| 3xl | 64px | Major sections |
| 4xl | 96px | Extra large sections |

### AVOID

- Crowded sections
- Excessive cards
- Excessive borders
- Excessive shadows
- Random spacing
- Inconsistent section heights

**Do not make every element huge.**

The website should feel spacious but still practical for ecommerce.

---

## 6. BUTTON SYSTEM

Create one global button system.

### PRIMARY CTA

```css
.btn-luxury {
  background: luxury-gold;
  color: white;
  padding: 1rem 2.5rem;
  font-family: serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s;
}
.btn-luxury:hover {
  background: luxury-darkGold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

### SECONDARY CTA

```css
.btn-luxury-outline {
  background: transparent;
  border: 2px solid luxury-gold;
  color: luxury-gold;
  padding: 1rem 2.5rem;
  font-family: serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s;
}
.btn-luxury-outline:hover {
  background: luxury-gold;
  color: white;
}
```

### ACCENT CTA

Muted terracotta or antique brass only when appropriate.

### BUTTON RULES

- **Do NOT** use random bright red, yellow, blue or green buttons.
- **Do NOT** make every button pill-shaped.
- Buttons should generally be:
  - Elegant
  - Minimal
  - Slightly rounded or subtly squared
  - Consistent in height
  - Consistent in typography

Existing Home/Product button style should remain the main reference.

---

## 7. CARDS

Create a consistent luxury product/card system.

### AVOID

Generic ecommerce cards with:
- Image
- Product
- Price
- Huge Add to Cart button

### PRIORITIZE

- Large product imagery
- Product name
- Collection/category
- Material where relevant
- Price
- Subtle interaction
- Minimal CTA

### CARD CHARACTERISTICS

- Minimal borders
- Subtle hover states
- Restrained shadows
- Consistent image ratios

**Do not overuse rounded cards.**

Use photography as the primary visual element.

---

## 8. PRODUCT IMAGE TREATMENT

Product photography is extremely important.

### MAINTAIN

- Large images
- Clean backgrounds
- Consistent aspect ratios (1:1 or 4:5)
- High-quality presentation
- Subtle hover zoom
- Smooth transitions

**Do not place unnecessary UI over product images.**

The product itself must remain the visual focus.

---

## 9. HEADER / NAVIGATION

The header must use the same design language as the Home/Product pages.

### DESKTOP DIRECTION

```
LOGO | SHOP | COLLECTIONS | BESPOKE | OUR STORY | JOURNAL | [SEARCH] [ACCOUNT] [WISHLIST] [CART]
```

Keep navigation elegant and minimal.

### MOBILE

```
[MENU] LOGO [CART]
```

Search and account should remain easily accessible.

**Do not introduce a completely different header on different pages.**

One global header system must be used.

---

## 10. FOOTER

Create one global premium footer.

### POSSIBLE SECTIONS

**SHOP**
- Hand Knotted Rugs
- Hand Tufted Rugs
- Flat Weave Rugs
- Craft & Statue

**BESPOKE**
- Design Your Own
- Custom Orders
- Our Process

**ABOUT**
- Our Story
- Craftsmanship
- Journal

**HELP**
- Shipping
- Returns
- Contact
- FAQs

**SOCIAL / NEWSLETTER**

**Legal links**

Footer should follow the same warm luxury visual language.

---

## 11. PAGE DESIGN LANGUAGE

Apply the same design system to:

### STOREFRONT PAGES
- ✅ Home
- Category
- Product
- Search
- Wishlist
- Cart
- Checkout
- Login
- Register
- Account
- Orders
- Order Details

### CUSTOM DESIGN PAGES
- Custom Design
- Custom Request
- Quote
- Design Approval

### CONTENT PAGES
- About
- Our Story
- Craftsmanship
- Journal
- Contact
- FAQ
- Shipping
- Returns
- Privacy
- Terms

### UTILITY PAGES
- 404
- Loading
- Error pages

**Every page must look like it belongs to LuxeCraft.**

---

## 12. CATEGORY / COLLECTION PAGES

Use an editorial luxury layout.

### EXAMPLE STRUCTURE

```
Collection Hero
↓
Collection introduction
↓
Filters / Sort
↓
Product Grid
↓
Craftsmanship / Story section
↓
Related Collection
```

Filters should be functional and visually minimal.

**Do not make the category page look like a marketplace.**

---

## 13. CART

Cart must feel premium and clean.

### INCLUDE

- Product image
- Product name
- Variant
- Customization
- Quantity
- Price
- Remove
- Subtotal
- Shipping estimate
- Checkout CTA

Keep the layout spacious.

---

## 14. CHECKOUT

Checkout should prioritize trust and simplicity.

### FLOW

```
Customer information
→ Address
→ Shipping
→ Tax
→ Payment
→ Confirmation
```

**Do not overload checkout with marketing sections.**

Use clear:
- Pricing
- Currency
- Shipping
- Taxes
- Payment status
- Order summary

---

## 15. CUSTOM / BESPOKE PAGES

These pages are extremely important to the LuxeCraft brand.

The visual language should communicate:

**"Private luxury design consultation"**

not:

**"Submit a form."**

### USE

- Large editorial imagery
- Elegant typography
- Generous whitespace
- Premium form controls
- Clear process steps
- Subtle gold/terracotta accents

### SUGGESTED STORYTELLING

```
YOUR VISION
↓
SHARE YOUR IDEA
↓
REFINE THE DESIGN
↓
APPROVE YOUR PIECE
↓
WE CRAFT IT
↓
DELIVERED TO YOUR HOME
```

---

## 16. LIGHT + DARK MODE

The complete website must support both:

**LIGHT** and **DARK** themes.

Do not create two unrelated designs.

### DARK MODE TRANSLATION

Dark mode must be the same design system translated into:

```
Deep espresso
+
Warm ivory
+
Muted terracotta
+
Antique brass
```

### LIGHT MODE

```
Warm ivory
+
Espresso
+
Muted terracotta
+
Antique brass
```

### THEME SWITCHING MUST NOT CAUSE

- Broken contrast
- Unreadable text
- Invisible borders
- Broken buttons
- Broken images
- Inconsistent components

---

## 17. RESPONSIVE DESIGN

The same luxury design system must work on:

- Mobile (320px - 767px)
- Tablet (768px - 1023px)
- Desktop (1024px - 1439px)
- Large desktop (1440px+)

**Do not simply shrink desktop.**

Mobile must be intentionally designed.

### PAY SPECIAL ATTENTION TO

- Hero
- Header
- Product grid
- Product gallery
- Filters
- Cart
- Checkout
- Forms
- Custom design workflow

---

## 18. ANIMATION

Use subtle premium animation.

### GOOD

- Fade
- Image reveal
- Slight image zoom (scale: 1.05)
- Smooth hover
- Subtle slide
- Elegant page transition

### AVOID

- Bouncing
- Excessive parallax
- Flashy effects
- Excessive animation
- Slow animations that hurt ecommerce usability

**Animation should communicate quality, not technology.**

---

## 19. CREATE REUSABLE DESIGN COMPONENTS

Do not style every page independently.

### CREATE/REUSE SHARED COMPONENTS FOR

- Header
- Footer
- Buttons
- Typography
- Product Card
- Product Grid
- Section Heading
- Image Block
- Badge
- Form controls
- Inputs
- Selects
- Modal
- Drawer
- Toast
- Breadcrumb
- Pagination
- Filters
- Price display
- Empty states
- Loading states
- Error states

### CREATE SHARED DESIGN TOKENS/THEME VARIABLES

The goal is:

```
ONE DESIGN SYSTEM
→ MANY PAGES
```

---

## 20. IMPORTANT — DO NOT BREAK EXISTING WORK

The current Home Page and Product Page are already built.

### DO NOT

- Rebuild them from scratch
- Delete working functionality
- Replace existing components unnecessarily
- Change product logic
- Change API logic
- Change database logic
- Change routing unnecessarily
- Remove existing responsive behavior

**Only improve/refactor where required to establish global consistency.**

If an existing Home/Product design decision conflicts with the new global direction, preserve the existing implementation unless the conflict is clearly severe.

---

## 21. VISUAL VERIFICATION

After implementing the global design system:

Run the application locally.

### VERIFY VISUALLY

1. ✅ Home Page
2. ✅ Product Page
3. Category Page
4. Header
5. Footer
6. Cart
7. Authentication pages
8. Admin interface if currently available
9. Light theme
10. Dark theme
11. Mobile
12. Desktop

### CHECK

- Spacing
- Typography
- Colors
- Buttons
- Product cards
- Images
- Responsiveness
- Contrast
- Hover states
- Navigation
- Consistency

Fix visual inconsistencies found during testing.

---

## 22. FINAL GOAL

Every page must look as though it was designed by the **SAME luxury design team**.

The final visual identity should communicate:

```
QUIET LUXURY
+
INDIAN CRAFTSMANSHIP
+
MODERN EDITORIAL DESIGN
+
PREMIUM ECOMMERCE
```

**Do not copy Maia Homes, Chairish, Etsy, 1001 Knots or any other reference website.**

Use references only for inspiration and UX understanding.

**The final design must be an original LuxeCraft design system.**

---

## 23. EXECUTION RULE

1. First inspect the current Home Page and Product Page.
2. Then identify the existing design tokens and components.
3. Then establish/refactor the global design system.
4. Then apply it to the rest of the currently implemented website.

**Do not build future ecommerce functionality that has not yet been requested.**

This task is primarily a **GLOBAL UI/UX + DESIGN SYSTEM CONSISTENCY** task.

### AT THE END REPORT

1. What existing design system you found.
2. What global design system you established.
3. Which pages/components were updated.
4. What reusable components were created/refactored.
5. Light/dark theme status.
6. Responsive verification status.
7. Any issues that remain.

**Do not proceed to unrelated development work after completing this task.**

---

## CURRENT IMPLEMENTATION STATUS (Phase 9)

### ✅ COMPLETED

- Home Page with luxury theme
- Product Detail Page with luxury theme
- Tailwind config with luxury color palette
- Global CSS with luxury typography
- ProductCard component
- CategoryCard component
- Basic responsive design

### ⏳ PENDING

- Global Header/Navigation
- Global Footer
- Product Listing Page (needs luxury theme)
- Category Pages
- Cart Page
- Checkout Flow
- Authentication Pages
- Custom Design Pages
- Dark Mode Implementation
- Full Responsive Testing
- Reusable Component Library

---

## REFERENCE FILES

- **Design System:** `.ai/DESIGN_SYSTEM.md` (this file)
- **Tailwind Config:** `apps/storefront/tailwind.config.js`
- **Global CSS:** `apps/storefront/src/app/globals.css`
- **Home Page:** `apps/storefront/src/app/page.tsx`
- **Product Page:** `apps/storefront/src/app/products/[slug]/page.tsx`
- **Product Card:** `apps/storefront/src/components/ProductCard.tsx`
- **Category Card:** `apps/storefront/src/components/CategoryCard.tsx`

---

**END OF DESIGN SYSTEM DOCUMENTATION**
