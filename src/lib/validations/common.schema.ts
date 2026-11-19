import { z } from 'zod';

// ============================================================================
// SHARED ENUMS
// ============================================================================

export const AccountStatusEnum = z.enum(['active', 'inactive']);
export type AccountStatus = z.infer<typeof AccountStatusEnum>;

export const EmploymentStatusEnum = z.enum(['active', 'inactive']);
export type EmploymentStatus = z.infer<typeof EmploymentStatusEnum>;

export const OrderStatusEnum = z.enum(['pending', 'in_progress', 'paid', 'cancelled']);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const InventoryActivityTypeEnum = z.enum([
  'addition',
  'manual_usage',
  'reservation',
  'release',
  'consumption',
  'transfer_out',
  'transfer_in',
]);
export type InventoryActivityType = z.infer<typeof InventoryActivityTypeEnum>;

export const ModuleNameEnum = z.enum(['users', 'orders', 'employees', 'inventory']);
export type ModuleName = z.infer<typeof ModuleNameEnum>;

export const PaymentMethodEnum = z.enum(['cash', 'bank_transfer', 'instapay', 'check', 'other']);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
