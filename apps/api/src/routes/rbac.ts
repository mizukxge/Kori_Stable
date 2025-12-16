import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  getUserPermissions,
  clearUserCache
} from '../middleware/rbac';

const prisma = new PrismaClient();

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  level: z.number().int().min(0).max(100).default(0),
  isDefault: z.boolean().default(false),
});

const createPermissionSchema = z.object({
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  isDangerous: z.boolean().default(false),
});

// Note: Schema definitions kept for potential future use in API routes
const _assignRoleSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
  scope: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

const _assignPermissionSchema = z.object({
  roleId: z.string().cuid(),
  permissionId: z.string().cuid(),
});

const createPolicyRuleSchema = z.object({
  name: z.string().min(1).max(100),
  permissionId: z.string().cuid(),
  conditions: z.record(z.any()),
  effect: z.enum(['ALLOW', 'DENY']).default('ALLOW'),
  priority: z.number().int().default(0),
  description: z.string().max(500).optional(),
});

export default async function rbacRoutes(fastify: FastifyInstance) {
  // ============================================
  // ROLE MANAGEMENT
  // ============================================

  /**
   * GET /api/rbac/roles
   * List all roles
   */
  fastify.get('/roles', async (request, reply) => {
    try {
      const roles = await prisma.systemRole.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { userRoles: true },
          },
        },
        orderBy: { level: 'desc' },
      });

      return reply.send(roles);
    } catch (error) {
      request.log.error(error, 'Error fetching roles');
      return reply.code(500).send({ error: 'Failed to fetch roles' });
    }
  });

  /**
   * GET /api/rbac/roles/:roleId
   * Get role details
   */
  fastify.get<{ Params: { roleId: string } }>(
    '/roles/:roleId',
    async (request, reply) => {
      try {
        const { roleId } = request.params;

        const role = await prisma.systemRole.findUnique({
          where: { id: roleId },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            userRoles: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        });

        if (!role) {
          return reply.code(404).send({ error: 'Role not found' });
        }

        return reply.send(role);
      } catch (error) {
        request.log.error(error, 'Error fetching role');
        return reply.code(500).send({ error: 'Failed to fetch role' });
      }
    }
  );

  /**
   * POST /api/rbac/roles
   * Create a new role
   */
  fastify.post<{ Body: any }>('/roles', async (request, reply) => {
    try {
      const data = createRoleSchema.parse(request.body);
      const userId = (request as any).user?.id;

      // Check if role name already exists
      const existing = await prisma.systemRole.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        return reply.code(400).send({ error: 'Role name already exists' });
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.systemRole.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const role = await prisma.systemRole.create({
        data: {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          level: data.level,
          isDefault: data.isDefault,
          isActive: true,
        },
      });

      return reply.code(201).send(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid role data', details: error.issues });
      }
      request.log.error(error, 'Error creating role');
      return reply.code(500).send({ error: 'Failed to create role' });
    }
  });

  /**
   * PATCH /api/rbac/roles/:roleId
   * Update a role
   */
  fastify.patch<{ Params: { roleId: string }; Body: any }>(
    '/roles/:roleId',
    async (request, reply) => {
      try {
        const { roleId } = request.params;
        const data = createRoleSchema.partial().parse(request.body);

        // Check if role is system role
        const existing = await prisma.systemRole.findUnique({
          where: { id: roleId },
        });

        if (!existing) {
          return reply.code(404).send({ error: 'Role not found' });
        }

        if (existing.isSystem) {
          return reply.code(403).send({ error: 'Cannot modify system roles' });
        }

        // If setting as default, unset other defaults
        if (data.isDefault) {
          await prisma.systemRole.updateMany({
            where: { isDefault: true, id: { not: roleId } },
            data: { isDefault: false },
          });
        }

        const role = await prisma.systemRole.update({
          where: { id: roleId },
          data: {
            displayName: data.displayName,
            description: data.description,
            level: data.level,
            isDefault: data.isDefault,
          },
        });

        // Clear cache for users with this role
        const userRoles = await prisma.userRole.findMany({
          where: { roleId },
          select: { userId: true },
        });
        
        userRoles.forEach(ur => clearUserCache(ur.userId));

        return reply.send(role);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid role data', details: error.issues });
        }
        request.log.error(error, 'Error updating role');
        return reply.code(500).send({ error: 'Failed to update role' });
      }
    }
  );

  /**
   * DELETE /api/rbac/roles/:roleId
   * Delete a role
   */
  fastify.delete<{ Params: { roleId: string } }>(
    '/roles/:roleId',
    async (request, reply) => {
      try {
        const { roleId } = request.params;

        const role = await prisma.systemRole.findUnique({
          where: { id: roleId },
          include: { _count: { select: { userRoles: true } } },
        });

        if (!role) {
          return reply.code(404).send({ error: 'Role not found' });
        }

        if (role.isSystem) {
          return reply.code(403).send({ error: 'Cannot delete system roles' });
        }

        if (role._count.userRoles > 0) {
          return reply.code(400).send({ 
            error: 'Cannot delete role with assigned users',
            userCount: role._count.userRoles,
          });
        }

        await prisma.systemRole.delete({
          where: { id: roleId },
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, 'Error deleting role');
        return reply.code(500).send({ error: 'Failed to delete role' });
      }
    }
  );

  // ============================================
  // PERMISSION MANAGEMENT
  // ============================================

  /**
   * GET /api/rbac/permissions
   * List all permissions
   */
  fastify.get('/permissions', async (request, reply) => {
    try {
      const permissions = await prisma.permission.findMany({
        include: {
          _count: {
            select: { rolePermissions: true },
          },
        },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });

      return reply.send(permissions);
    } catch (error) {
      request.log.error(error, 'Error fetching permissions');
      return reply.code(500).send({ error: 'Failed to fetch permissions' });
    }
  });

  /**
   * POST /api/rbac/permissions
   * Create a new permission
   */
  fastify.post<{ Body: any }>('/permissions', async (request, reply) => {
    try {
      const data = createPermissionSchema.parse(request.body);

      const name = `${data.resource}:${data.action}`;

      // Check if permission already exists
      const existing = await prisma.permission.findUnique({
        where: { name },
      });

      if (existing) {
        return reply.code(400).send({ error: 'Permission already exists' });
      }

      const permission = await prisma.permission.create({
        data: {
          resource: data.resource,
          action: data.action,
          name,
          displayName: data.displayName,
          description: data.description,
          category: data.category,
          isDangerous: data.isDangerous,
          isSystem: false,
        },
      });

      return reply.code(201).send(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid permission data', details: error.issues });
      }
      request.log.error(error, 'Error creating permission');
      return reply.code(500).send({ error: 'Failed to create permission' });
    }
  });

  /**
   * DELETE /api/rbac/permissions/:permissionId
   * Delete a permission
   */
  fastify.delete<{ Params: { permissionId: string } }>(
    '/permissions/:permissionId',
    async (request, reply) => {
      try {
        const { permissionId } = request.params;

        const permission = await prisma.permission.findUnique({
          where: { id: permissionId },
        });

        if (!permission) {
          return reply.code(404).send({ error: 'Permission not found' });
        }

        if (permission.isSystem) {
          return reply.code(403).send({ error: 'Cannot delete system permissions' });
        }

        await prisma.permission.delete({
          where: { id: permissionId },
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, 'Error deleting permission');
        return reply.code(500).send({ error: 'Failed to delete permission' });
      }
    }
  );

  // ============================================
  // ROLE-PERMISSION ASSIGNMENT
  // ============================================

  /**
   * POST /api/rbac/roles/:roleId/permissions
   * Assign permission to role
   */
  fastify.post<{ Params: { roleId: string }; Body: any }>(
    '/roles/:roleId/permissions',
    async (request, reply) => {
      try {
        const { roleId } = request.params;
        const { permissionId } = z.object({ permissionId: z.string().cuid() }).parse(request.body);
        const userId = (request as any).user?.id;

        // Check if already assigned
        const existing = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
        });

        if (existing) {
          return reply.code(400).send({ error: 'Permission already assigned to role' });
        }

        const rolePermission = await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
            grantedBy: userId,
          },
          include: {
            permission: true,
          },
        });

        // Clear cache for users with this role
        const userRoles = await prisma.userRole.findMany({
          where: { roleId },
          select: { userId: true },
        });
        
        userRoles.forEach(ur => clearUserCache(ur.userId));

        return reply.code(201).send(rolePermission);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid data', details: error.issues });
        }
        request.log.error(error, 'Error assigning permission');
        return reply.code(500).send({ error: 'Failed to assign permission' });
      }
    }
  );

  /**
   * DELETE /api/rbac/roles/:roleId/permissions/:permissionId
   * Remove permission from role
   */
  fastify.delete<{ Params: { roleId: string; permissionId: string } }>(
    '/roles/:roleId/permissions/:permissionId',
    async (request, reply) => {
      try {
        const { roleId, permissionId } = request.params;

        await prisma.rolePermission.delete({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
        });

        // Clear cache for users with this role
        const userRoles = await prisma.userRole.findMany({
          where: { roleId },
          select: { userId: true },
        });
        
        userRoles.forEach(ur => clearUserCache(ur.userId));

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, 'Error removing permission');
        return reply.code(500).send({ error: 'Failed to remove permission' });
      }
    }
  );

  // ============================================
  // USER-ROLE ASSIGNMENT
  // ============================================

  /**
   * GET /api/rbac/users/:userId/roles
   * Get user's roles
   */
  fastify.get<{ Params: { userId: string } }>(
    '/users/:userId/roles',
    async (request, reply) => {
      try {
        const { userId } = request.params;

        const userRoles = await prisma.userRole.findMany({
          where: { userId },
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

        return reply.send(userRoles);
      } catch (error) {
        request.log.error(error, 'Error fetching user roles');
        return reply.code(500).send({ error: 'Failed to fetch user roles' });
      }
    }
  );

  /**
   * GET /api/rbac/users/:userId/permissions
   * Get user's effective permissions
   */
  fastify.get<{ Params: { userId: string } }>(
    '/users/:userId/permissions',
    async (request, reply) => {
      try {
        const { userId } = request.params;

        const permissions = await getUserPermissions(userId);

        return reply.send({ permissions });
      } catch (error) {
        request.log.error(error, 'Error fetching user permissions');
        return reply.code(500).send({ error: 'Failed to fetch user permissions' });
      }
    }
  );

  /**
   * POST /api/rbac/users/:userId/roles
   * Assign role to user
   */
  fastify.post<{ Params: { userId: string }; Body: any }>(
    '/users/:userId/roles',
    async (request, reply) => {
      try {
        const { userId } = request.params;
        const data = z.object({
          roleId: z.string().cuid(),
          scope: z.string().optional(),
          expiresAt: z.string().datetime().optional(),
        }).parse(request.body);
        const assignedBy = (request as any).user?.id;

        // Check if already assigned with same scope
        const existing = await prisma.userRole.findFirst({
          where: {
            userId,
            roleId: data.roleId,
            scope: data.scope || null,
          },
        });

        if (existing) {
          return reply.code(400).send({ error: 'Role already assigned to user with this scope' });
        }

        const userRole = await prisma.userRole.create({
          data: {
            userId,
            roleId: data.roleId,
            scope: data.scope,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            assignedBy,
          },
          include: {
            role: true,
          },
        });

        // Clear user's permission cache
        clearUserCache(userId);

        return reply.code(201).send(userRole);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid data', details: error.issues });
        }
        request.log.error(error, 'Error assigning role');
        return reply.code(500).send({ error: 'Failed to assign role' });
      }
    }
  );

  /**
   * DELETE /api/rbac/users/:userId/roles/:userRoleId
   * Remove role from user
   */
  fastify.delete<{ Params: { userId: string; userRoleId: string } }>(
    '/users/:userId/roles/:userRoleId',
    async (request, reply) => {
      try {
        const { userId, userRoleId } = request.params;

        await prisma.userRole.delete({
          where: {
            id: userRoleId,
            userId, // Ensure user owns this role
          },
        });

        // Clear user's permission cache
        clearUserCache(userId);

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, 'Error removing role');
        return reply.code(500).send({ error: 'Failed to remove role' });
      }
    }
  );

  // ============================================
  // POLICY RULES
  // ============================================

  /**
   * GET /api/rbac/policies
   * List all policy rules
   */
  fastify.get('/policies', async (request, reply) => {
    try {
      const policies = await prisma.policyRule.findMany({
        include: {
          permission: true,
        },
        orderBy: { priority: 'desc' },
      });

      return reply.send(policies);
    } catch (error) {
      request.log.error(error, 'Error fetching policies');
      return reply.code(500).send({ error: 'Failed to fetch policies' });
    }
  });

  /**
   * POST /api/rbac/policies
   * Create a policy rule
   */
  fastify.post<{ Body: any }>('/policies', async (request, reply) => {
    try {
      const data = createPolicyRuleSchema.parse(request.body);

      const policy = await prisma.policyRule.create({
        data: {
          name: data.name,
          permissionId: data.permissionId,
          conditions: data.conditions as any,
          effect: data.effect,
          priority: data.priority,
          description: data.description,
        },
        include: {
          permission: true,
        },
      });

      return reply.code(201).send(policy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid policy data', details: error.issues });
      }
      request.log.error(error, 'Error creating policy');
      return reply.code(500).send({ error: 'Failed to create policy' });
    }
  });

  /**
   * PATCH /api/rbac/policies/:policyId
   * Update a policy rule
   */
  fastify.patch<{ Params: { policyId: string }; Body: any }>(
    '/policies/:policyId',
    async (request, reply) => {
      try {
        const { policyId } = request.params;
        const data = createPolicyRuleSchema.partial().parse(request.body);

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.permissionId !== undefined) updateData.permissionId = data.permissionId;
        if (data.conditions !== undefined) updateData.conditions = data.conditions;
        if (data.effect !== undefined) updateData.effect = data.effect;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.description !== undefined) updateData.description = data.description;

        const policy = await prisma.policyRule.update({
          where: { id: policyId },
          data: updateData,
          include: {
            permission: true,
          },
        });

        return reply.send(policy);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid policy data', details: error.issues });
        }
        request.log.error(error, 'Error updating policy');
        return reply.code(500).send({ error: 'Failed to update policy' });
      }
    }
  );

  /**
   * DELETE /api/rbac/policies/:policyId
   * Delete a policy rule
   */
  fastify.delete<{ Params: { policyId: string } }>(
    '/policies/:policyId',
    async (request, reply) => {
      try {
        const { policyId } = request.params;

        await prisma.policyRule.delete({
          where: { id: policyId },
        });

        return reply.code(204).send();
      } catch (error) {
        request.log.error(error, 'Error deleting policy');
        return reply.code(500).send({ error: 'Failed to delete policy' });
      }
    }
  );
}