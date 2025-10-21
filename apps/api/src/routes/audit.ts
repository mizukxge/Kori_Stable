import { FastifyInstance } from 'fastify';
import { AuditService } from '../observability/audit.js';
import { requireAdmin } from '../middleware/auth.js';

export async function auditRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/audit
   * Get recent audit logs
   */
  fastify.get('/admin/audit', async (request, reply) => {
    try {
      const query = request.query as any;
      const limit = query.limit ? parseInt(query.limit) : 100;

      const logs = await AuditService.getRecentLogs(limit);

      return reply.status(200).send({
        success: true,
        data: logs,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching audit logs');
      throw error;
    }
  });

  /**
   * GET /admin/audit/entity/:type/:id
   * Get audit logs for specific entity
   */
  fastify.get('/admin/audit/entity/:type/:id', async (request, reply) => {
    try {
      const { type, id } = request.params as { type: string; id: string };

      const logs = await AuditService.getEntityLogs(type, id);

      return reply.status(200).send({
        success: true,
        data: logs,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching entity audit logs');
      throw error;
    }
  });

  /**
   * GET /admin/audit/user/:id
   * Get audit logs for specific user
   */
  fastify.get('/admin/audit/user/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const query = request.query as any;
      const limit = query.limit ? parseInt(query.limit) : 100;

      const logs = await AuditService.getUserLogs(id, limit);

      return reply.status(200).send({
        success: true,
        data: logs,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching user audit logs');
      throw error;
    }
  });

  /**
   * GET /admin/audit/stats
   * Get audit log statistics
   */
  fastify.get('/admin/audit/stats', async (request, reply) => {
    try {
      const query = request.query as any;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (query.startDate) {
        startDate = new Date(query.startDate);
      }
      if (query.endDate) {
        endDate = new Date(query.endDate);
      }

      const stats = await AuditService.getStats(startDate, endDate);

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching audit stats');
      throw error;
    }
  });
}