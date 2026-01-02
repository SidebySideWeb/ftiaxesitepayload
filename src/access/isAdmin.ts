import type { PayloadRequest } from 'payload'

/**
 * Helper to check if a user is an admin
 * Ensures consistent admin role checking across all access control
 */
export function isAdmin(user?: PayloadRequest['user']): boolean {
  if (!user) return false
  
  // Check if user has 'admin' role
  // Handle both array and single value
  if (Array.isArray(user.roles)) {
    return user.roles.includes('admin')
  }
  
  return user.roles === 'admin'
}
