import { FastifyRequest } from 'fastify';

// Lazy-load Prisma client to allow proper initialization at runtime
let prisma: any = null;

async function getPrismaClient() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

export interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  clientId?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enhanced audit logging service
 */
export class AuditService {
  /**
   * Create an audit log entry
   */
  static async log(data: AuditLogData) {
    try {
      const db = await getPrismaClient();
      await db.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          clientId: data.clientId,
          changes: data.changes,
          metadata: data.metadata,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Create audit log from Fastify request
   */
  static async logFromRequest(
    request: FastifyRequest,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: any
  ) {
    await this.log({
      action,
      entityType,
      entityId,
      userId: request.user?.userId,
      metadata,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  /**
   * Log entity creation
   */
  static async logCreate(
    request: FastifyRequest,
    entityType: string,
    entityId: string,
    data?: any
  ) {
    await this.logFromRequest(request, 'CREATE', entityType, entityId, {
      created: data,
    });
  }

  /**
   * Log entity update
   */
  static async logUpdate(
    request: FastifyRequest,
    entityType: string,
    entityId: string,
    changes?: any
  ) {
    await this.logFromRequest(request, 'UPDATE', entityType, entityId, {
      changes,
    });
  }

  /**
   * Log entity deletion
   */
  static async logDelete(
    request: FastifyRequest,
    entityType: string,
    entityId: string
  ) {
    await this.logFromRequest(request, 'DELETE', entityType, entityId);
  }

  /**
   * Log access to sensitive data
   */
  static async logAccess(
    request: FastifyRequest,
    entityType: string,
    entityId: string
  ) {
    await this.logFromRequest(request, 'ACCESS', entityType, entityId);
  }

  /**
   * Log export/download
   */
  static async logExport(
    request: FastifyRequest,
    entityType: string,
    entityId: string,
    exportType?: string
  ) {
    await this.logFromRequest(request, 'EXPORT', entityType, entityId, {
      exportType,
    });
  }

  /**
   * Get recent audit logs
   */
  static async getRecentLogs(limit = 100) {
    const db = await getPrismaClient();
    return db.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs for specific entity
   */
  static async getEntityLogs(entityType: string, entityId: string) {
    const db = await getPrismaClient();
    return db.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs for specific user
   */
  static async getUserLogs(userId: string, limit = 100) {
    const db = await getPrismaClient();
    return db.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get audit log statistics
   */
  static async getStats(startDate?: Date, endDate?: Date) {
    const db = await getPrismaClient();
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, byAction, byEntity] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      db.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byAction: byAction.reduce((acc, item) => {
        acc[item.action] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byEntity: byEntity.reduce((acc, item) => {
        acc[item.entityType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}