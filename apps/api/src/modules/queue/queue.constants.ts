/**
 * BullMQ queue names.
 * All queue names are defined here to avoid magic strings.
 */
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  INVENTORY: 'inventory',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
