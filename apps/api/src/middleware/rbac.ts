import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache for permission checks (in-memory, could be Redis in production)
const permissionCache = new Map<string, { hasPermission: boolean; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// PERMISSION CHECKER
// ============================================

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permissionName: string,
  resourceId?: string
): Promise<boolean> {
  // Check cache first
  const cacheKey = `${userId}:${permissionName}:${resourceId || 'global'}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.hasPermission;
  }

  try {
    // Get user's roles
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Check if user has the permission through any role
    let hasAccess = false;

    for (const userRole of userRoles) {
      const rolePermissions = userRole.role.permissions;
      
      for (const rp of rolePermissions) {
        if (rp.permission.name === permissionName && rp.permission.isActive) {
          // Check if scope matches (if specified)
          if (resourceId && userRole.scope) {
            // Scope format: "resource:id" e.g., "client:abc123"
            const [scopeResource, scopeId] = userRole.scope.split(':');
            if (scopeId === resourceId) {
              hasAccess = true;
              break;
            }
          } else if (!userRole.scope) {
            // No scope restriction
            hasAccess = true;
            break;
          }
        }
      }
      
      if (hasAccess) break;
    }

    // Apply policy rules if permission found
    if (hasAccess) {
      const permission = await prisma.permission.findFirst({
        where: { name: permissionName },
        include: {
          policyRules: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
        },
      });

      if (permission && permission.policyRules.length > 0) {
        // Evaluate policy rules
        hasAccess = await evaluatePolicyRules(
          permission.policyRules,
          userId,
          resourceId
        );
      }
    }

    // Cache result
    permissionCache.set(cacheKey, {
      hasPermission: hasAccess,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return hasAccess;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissions: string[],
  resourceId?: string
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(userId, permission, resourceId)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissions: string[],
  resourceId?: string
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(userId, permission, resourceId))) {
      return false;
    }
  }
  return true;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  
  for (const userRole of userRoles) {
    for (const rp of userRole.role.permissions) {
      if (rp.permission.isActive) {
        permissions.add(rp.permission.name);
      }
    }
  }

  return Array.from(permissions);
}

// ============================================
// POLICY RULE EVALUATION
// ============================================

/**
 * Evaluate policy rules against a resource
 */
async function evaluatePolicyRules(
  rules: any[],
  userId: string,
  resourceId?: string
): Promise<boolean> {
  // Rules are sorted by priority (highest first)
  for (const rule of rules) {
    const result = await evaluateRule(rule, userId, resourceId);
    
    if (result !== null) {
      // Rule matched, return its effect
      return rule.effect === 'ALLOW';
    }
  }

  // No rules matched, default to deny
  return false;
}

/**
 * Evaluate a single policy rule
 * Returns true if ALLOW, false if DENY, null if rule doesn't match
 */
async function evaluateRule(
  rule: any,
  userId: string,
  resourceId?: string
): Promise<boolean | null> {
  const conditions = rule.conditions as any;

  // Handle different condition types
  if (conditions.field && conditions.operator && conditions.value !== undefined) {
    // Single condition
    return await evaluateCondition(conditions, userId, resourceId);
  } else if (conditions.AND) {
    // AND conditions - all must be true
    for (const condition of conditions.AND) {
      const result = await evaluateCondition(condition, userId, resourceId);
      if (!result) return null; // Condition not met
    }
    return true; // All conditions met
  } else if (conditions.OR) {
    // OR conditions - at least one must be true
    for (const condition of conditions.OR) {
      const result = await evaluateCondition(condition, userId, resourceId);
      if (result) return true; // At least one condition met
    }
    return null; // No conditions met
  }

  return null;
}

/**
 * Evaluate a single condition
 */
async function evaluateCondition(
  condition: any,
  userId: string,
  resourceId?: string
): Promise<boolean> {
  const { field, operator, value } = condition;

  // Special variable substitution
  let compareValue = value;
  if (value === '$userId') {
    compareValue = userId;
  } else if (value === '$resourceId') {
    compareValue = resourceId;
  }

  // Get the actual field value from the resource
  // This is simplified - in production, you'd fetch the resource from DB
  let fieldValue = null;
  
  // For now, just handle basic cases
  if (field === 'userId' || field === 'ownerId') {
    fieldValue = userId;
  } else if (field === 'resourceId') {
    fieldValue = resourceId;
  }

  // Evaluate operator
  switch (operator) {
    case 'equals':
      return fieldValue === compareValue;
    case 'notEquals':
      return fieldValue !== compareValue;
    case 'in':
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case 'notIn':
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case 'contains':
      return typeof fieldValue === 'string' && fieldValue.includes(compareValue);
    case 'startsWith':
      return typeof fieldValue === 'string' && fieldValue.startsWith(compareValue);
    case 'endsWith':
      return typeof fieldValue === 'string' && fieldValue.endsWith(compareValue);
    default:
      return false;
  }
}

// ============================================
// FASTIFY MIDDLEWARE
// ============================================

/**
 * Middleware to require specific permission
 */
export function requirePermission(permissionName: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const allowed = await hasPermission(userId, permissionName);

    if (!allowed) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: `Missing required permission: ${permissionName}` 
      });
    }
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const allowed = await hasAnyPermission(userId, permissions);

    if (!allowed) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: `Missing required permissions: ${permissions.join(', ')}` 
      });
    }
  };
}

/**
 * Middleware to require all specified permissions
 */
export function requireAllPermissions(permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const allowed = await hasAllPermissions(userId, permissions);

    if (!allowed) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: `Missing required permissions: ${permissions.join(', ')}` 
      });
    }
  };
}

/**
 * Middleware to require specific role
 */
export function requireRole(roleName: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: { name: roleName },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!userRole) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: `Missing required role: ${roleName}` 
      });
    }
  };
}

/**
 * Middleware to require role level
 */
export function requireRoleLevel(minLevel: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).user?.id;

    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: true,
      },
    });

    const hasRequiredLevel = userRoles.some(ur => ur.role.level >= minLevel);

    if (!hasRequiredLevel) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: `Insufficient role level. Required: ${minLevel}` 
      });
    }
  };
}

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Clear permission cache for a user
 */
export function clearUserCache(userId: string) {
  const keysToDelete: string[] = [];
  
  permissionCache.forEach((_, key) => {
    if (key.startsWith(`${userId}:`)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => permissionCache.delete(key));
}

/**
 * Clear all permission cache
 */
export function clearAllCache() {
  permissionCache.clear();
}

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  permissionCache.forEach((value, key) => {
    if (value.expiresAt <= now) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => permissionCache.delete(key));
}, 10 * 60 * 1000);