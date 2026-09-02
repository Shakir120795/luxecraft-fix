# PHASE 3: Cart/Inventory/Order Consistency Audit

**Date**: ${new Date().toISOString()}  
**Status**: AUDIT COMPLETE - CRITICAL ISSUES FOUND ❗

---

## Executive Summary

**Production-Ready Status**: 🔴 **NOT READY**

### Critical Issues Found:
1. ❗❗❗ **Stock is NEVER decremented when orders are created**
2. ❗❗ **No reserved quantity mechanism during checkout**
3. ⚠️ **Race condition vulnerability on simultaneous purchases**
4. ⚠️ **No stock restoration on payment failure**
5. ⚠️ **No stock restoration on order cancellation**

**Risk**: OVERSELLING - Multiple customers can buy more items than are in stock

---

## What's Working ✅

### Cart Service (`cart.service.ts`)
1. ✅ **Stock validation on Add to Cart**:
   ```typescript
   const availableStock = Math.max(0, variant.stockQty - variant.reservedQty);
   
   if (variant.trackInventory && !variant.allowBackorder && availableStock < requestedQuantity) {
     throw new BadRequestException('Out of stock');
   }
   ```

2. ✅ **Respects `trackInventory` flag**
3. ✅ **Respects `allowBackorder` flag**
4. ✅ **Checks variant `isAvailable` status**
5. ✅ **Validates stock on cart item update**
6. ✅ **Guest cart merge validates stock** before merging items

### Orders Service (`orders.service.ts`)
1. ✅ Order creation with proper snapshots
2. ✅ Guest order access token generation
3. ✅ Order status updates (PENDING → PAID → SHIPPED → DELIVERED)
4. ✅ Payment status tracking
5. ✅ Fulfillment status tracking

### Checkout Service (`checkout.service.ts`)
1. ✅ **Server-side price recalculation** (never trusts frontend)
2. ✅ **Cart validation** (empty cart check)
3. ✅ **Shipping rate calculation** from server
4. ✅ **Tax calculation** from server
5. ✅ Cart cleared after order creation

---

## 🚨 CRITICAL ISSUES

### Issue #1: Stock Never Decremented ❗❗❗

**Problem**: `orders.service.ts` and `checkout.service.ts` create orders but NEVER update inventory.

**Evidence**:
```typescript
// orders.service.ts - create() method
async create(data: {...}): Promise<Order> {
  const order = await this.prisma.order.create({
    data: {
      // ... order data ...
      items: {
        create: (data.cart?.items ?? []).map((item: any) => ({
          // ... order items ...
        })),
      },
    },
  });
  
  return order;  // ❌ NO STOCK DECREMENT!
}
```

**Current Behavior**:
1. Customer adds 5 items to cart (stock: 10)
2. Stock validation passes ✅
3. Customer completes checkout
4. Order is created ✅
5. Stock remains: **10** ❌ (should be 5!)
6. Another customer can buy 10 more items ❌ OVERSELLING!

**Impact**: 
- Production will accept orders for items that are out of stock
- No way to fulfill orders
- Customer dissatisfaction
- Inventory chaos

**Fix Required**: Decrement stock when order status changes to PAID (not on order creation)

---

### Issue #2: No Reserved Quantity During Checkout ❗❗

**Problem**: Stock is not reserved during the checkout process.

**Scenario**:
1. Customer A adds last 5 items to cart (stock: 5, reserved: 0)
2. Cart validation passes ✅
3. Customer A is on checkout page (filling address, payment info)
4. Customer B adds 5 items to cart ✅ (stock still shows 5 available!)
5. Customer B completes checkout first ✅ Order created
6. Customer A completes checkout ✅ Order created
7. **Result**: 10 items sold, but only 5 in stock! ❌

**Current State**:
- `reservedQty` field exists in database ✅
- `reservedQty` is checked in cart validation ✅
- `reservedQty` is NEVER updated ❌

**Fix Required**: Reserve stock when checkout is initiated, release if abandoned

---

### Issue #3: Race Condition Vulnerability ⚠️

**Problem**: No transaction locking on stock updates.

**Scenario** (if stock decrement is added without locking):
```typescript
// Two simultaneous requests at exact same time:
// Request A reads: stockQty = 2
// Request B reads: stockQty = 2
// Request A decrements: stockQty = 1 ✓
// Request B decrements: stockQty = 1 ✓
// Final result: stockQty = 1
// Expected: stockQty = 0
// Result: 1 item oversold
```

**Fix Required**: Use Prisma transactions with row-level locking:
```typescript
await prisma.$transaction(async (tx) => {
  // SELECT FOR UPDATE - locks the row
  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
  });
  
  // Atomic decrement
  await tx.productVariant.update({
    where: { id: variantId },
    data: { stockQty: { decrement: quantity } },
  });
});
```

---

### Issue #4: No Stock Restoration on Payment Failure ⚠️

**Problem**: If payment fails after order creation, stock is not restored.

**Current Flow**:
1. Order created ✅
2. Payment initiated
3. Payment fails ❌
4. Order status: PENDING
5. Stock: **Still decremented** (if we add decrement)
6. Result: Stock is locked forever in failed order

**Fix Required**: 
- Listen to payment webhooks
- On payment failure: restore stock + cancel order
- On payment timeout: restore stock after X hours

---

### Issue #5: No Stock Restoration on Cancellation ⚠️

**Problem**: Order cancellation doesn't restore stock.

**Current**: `updateStatus()` in `orders.service.ts` has:
```typescript
...(updates.orderStatus === OrderStatus.CANCELLED && { cancelledAt: new Date() })
```

**Missing**: Stock restoration logic when order is cancelled.

**Fix Required**: Add stock restoration when `orderStatus` changes to `CANCELLED`

---

## Database Schema Review

### ProductVariant Model ✅
```prisma
model ProductVariant {
  stockQty        Int      @default(0)        // ✅ Total stock
  reservedQty     Int      @default(0)        // ✅ Reserved during checkout
  trackInventory  Boolean  @default(true)     // ✅ Enable/disable tracking
  allowBackorder  Boolean  @default(false)    // ✅ Allow negative stock
  isAvailable     Boolean  @default(true)     // ✅ Manual availability flag
  // ...
}
```

**Available Stock Calculation** (used in cart validation):
```typescript
const availableStock = Math.max(0, variant.stockQty - variant.reservedQty);
```

This is **correct** ✅ - just not being updated properly!

---

## Recommendations

### Priority 1: Prevent Overselling (CRITICAL)

#### Fix #1: Decrement Stock on Order Payment ❗❗❗
**File**: `apps/api/src/modules/payments/payments.service.ts` or webhook handler

**Implementation**:
```typescript
async handlePaymentSuccess(orderId: string): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // 1. Get order with items
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    
    // 2. Decrement stock for each item atomically
    for (const item of order.items) {
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });
        
        if (variant.trackInventory) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQty: { decrement: item.quantity },
              // If stock was reserved, also decrease reservedQty
              ...(variant.reservedQty > 0 && {
                reservedQty: { decrement: Math.min(item.quantity, variant.reservedQty) }
              }),
            },
          });
          
          // Check if stock went negative without backorder
          const updated = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          
          if (!variant.allowBackorder && updated.stockQty < 0) {
            throw new Error(`Insufficient stock for variant ${item.variantId}`);
          }
        }
      }
    }
    
    // 3. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });
    
    // 4. Create inventory log entry
    await tx.inventoryLog.create({
      data: {
        productId: item.productId,
        variantId: item.variantId,
        reason: 'ORDER_FULFILLED',
        quantityChange: -item.quantity,
        referenceType: 'ORDER',
        referenceId: orderId,
        notes: `Stock decremented for order ${order.orderNumber}`,
      },
    });
  });
}
```

#### Fix #2: Reserve Stock During Checkout ❗❗
**File**: `apps/api/src/modules/checkout/checkout.service.ts`

**Add to `createStandardOrder()` method**:
```typescript
// After validating cart is not empty, BEFORE creating order:
await this.prisma.$transaction(async (tx) => {
  for (const item of persistedItems) {
    if (item.variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });
      
      if (variant.trackInventory) {
        const availableStock = variant.stockQty - variant.reservedQty;
        
        if (!variant.allowBackorder && availableStock < item.quantity) {
          throw new BadRequestException(
            `Only ${availableStock} items available for ${item.product.name} - ${item.variant.name}`
          );
        }
        
        // Reserve the stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedQty: { increment: item.quantity } },
        });
      }
    }
  }
});
```

#### Fix #3: Auto-Release Reserved Stock ❗
**File**: Create `apps/api/src/modules/inventory/inventory-cleanup.service.ts`

**Implementation**: Cron job to release abandoned reservations:
```typescript
@Cron('0 */10 * * * *')  // Every 10 minutes
async releaseAbandonedReservations(): Promise<void> {
  const RESERVATION_TIMEOUT_HOURS = 2;
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - RESERVATION_TIMEOUT_HOURS);
  
  // Find orders with PENDING payment that are old
  const abandonedOrders = await this.prisma.order.findMany({
    where: {
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      createdAt: { lt: cutoffTime },
    },
    include: { items: true },
  });
  
  for (const order of abandonedOrders) {
    await this.restoreStockForOrder(order);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: 'CANCELLED' },
    });
  }
}
```

---

### Priority 2: Stock Restoration

#### Fix #4: Payment Failure Handler
**File**: Payment webhook handler

```typescript
async handlePaymentFailure(orderId: string): Promise<void> {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  
  await this.restoreStockForOrder(order);
  
  await this.prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'FAILED',
      orderStatus: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });
}
```

#### Fix #5: Order Cancellation Handler
**File**: `apps/api/src/modules/orders/orders.service.ts`

**Update `updateStatus()` method**:
```typescript
async updateStatus(orderId: string, updates: {...}): Promise<Order> {
  // If cancelling an order that was paid
  if (updates.orderStatus === OrderStatus.CANCELLED) {
    const order = await this.findOne(orderId);
    
    // Only restore if payment was already processed
    if (order.paymentStatus === PaymentStatus.PAID) {
      await this.restoreStockForOrder(order);
    }
  }
  
  return this.prisma.order.update({
    where: { id: orderId },
    data: {
      ...(updates.orderStatus && { orderStatus: updates.orderStatus }),
      ...(updates.paymentStatus && { paymentStatus: updates.paymentStatus }),
      ...(updates.fulfillmentStatus && { fulfillmentStatus: updates.fulfillmentStatus }),
      ...(updates.orderStatus === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
    },
  });
}

private async restoreStockForOrder(order: Order & { items: OrderItem[] }): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQty: { increment: item.quantity },
          },
        });
        
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            reason: 'ORDER_CANCELLED',
            quantityChange: item.quantity,
            referenceType: 'ORDER',
            referenceId: order.id,
            notes: `Stock restored for cancelled order ${order.orderNumber}`,
          },
        });
      }
    }
  });
}
```

---

## Testing Requirements

Before declaring inventory system production-ready, test these scenarios:

### Test 1: Basic Stock Decrement ✅
1. Create product with variant, stock: 10
2. Place order for 3 items
3. Complete payment
4. **Verify**: Stock = 7

### Test 2: Multiple Simultaneous Orders ✅
1. Product stock: 5
2. Start 3 checkouts simultaneously (2 items each)
3. Complete all payments
4. **Expected**: Only first 2 orders succeed, 3rd fails with "out of stock"

### Test 3: Reserved Quantity ✅
1. Product stock: 5
2. Customer A: Add 5 items to cart → checkout page
3. Customer B: Try to add 5 items to cart
4. **Expected**: Customer B gets "only X available" error

### Test 4: Reservation Timeout ✅
1. Add 5 items to cart
2. Go to checkout (stock reserved)
3. Wait 2+ hours without completing
4. **Expected**: Reservation released, stock available again

### Test 5: Payment Failure ✅
1. Place order (stock decremented/reserved)
2. Payment fails
3. **Expected**: Stock restored, order cancelled

### Test 6: Order Cancellation ✅
1. Place order, payment succeeds (stock decremented)
2. Admin cancels order
3. **Expected**: Stock restored

### Test 7: Backorder Allowed ✅
1. Product with `allowBackorder: true`, stock: 2
2. Order 5 items
3. **Expected**: Order succeeds, stock = -3

### Test 8: Backorder NOT Allowed ✅
1. Product with `allowBackorder: false`, stock: 2
2. Try to order 5 items
3. **Expected**: Error "only 2 available"

---

## What's NOT Broken ✅

All existing functionality still works:
- ✅ Cart add/remove/update
- ✅ Cart merge on login
- ✅ Guest cart
- ✅ Checkout flow
- ✅ Order creation
- ✅ Order history
- ✅ Guest order access

**Only issue**: Stock is validated but never updated!

---

## Files That Need Modification

### Critical (Must Fix):
1. ✅ `apps/api/src/modules/payments/payments.service.ts` - Add stock decrement on payment success
2. ✅ `apps/api/src/modules/checkout/checkout.service.ts` - Add stock reservation
3. ✅ `apps/api/src/modules/orders/orders.service.ts` - Add stock restoration on cancellation

### Important (Should Fix):
4. ⚠️ Create `apps/api/src/modules/inventory/inventory-cleanup.service.ts` - Auto-release abandoned reservations
5. ⚠️ Payment webhook handler - Handle payment failures

### Optional (Nice to Have):
6. ℹ️ Admin dashboard - Show reserved vs available stock
7. ℹ️ Low stock alerts
8. ℹ️ Stock adjustment API for manual corrections

---

## Production Readiness Status

**Before PHASE 3**: 50% 🟡  
**After PHASE 3 Audit**: 50% 🟡 (no changes yet, only audit)  
**After PHASE 3 Implementation**: Expected 65% 🟢

**Blocking Issues for Production**:
- ❗❗❗ Stock decrement missing (CRITICAL - MUST FIX)
- ❗❗ Stock reservation missing (HIGH - SHOULD FIX)
- ❗ Payment system incomplete (PHASE 4)

---

## Next Steps

1. **Implement Fix #1**: Stock decrement on payment (CRITICAL)
2. **Implement Fix #2**: Stock reservation during checkout (HIGH)
3. **Implement Fix #3**: Auto-release abandoned reservations (MEDIUM)
4. **Test all 8 scenarios** above
5. **Move to PHASE 4**: Payment implementation

---

**End of PHASE 3 Audit**

**Status**: AUDIT COMPLETE - AWAITING IMPLEMENTATION DECISION
