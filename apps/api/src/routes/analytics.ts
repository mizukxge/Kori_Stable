import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();

export async function analyticsRoutes(fastify: FastifyInstance) {
  /**
   * GET /admin/analytics
   * Get comprehensive site analytics
   */
  fastify.get('/admin/analytics', { preHandler: requireAdmin }, async (request, reply) => {
    try {
      // Fetch data from all major sections
      const [
        totalInquiries,
        newInquiriesToday,
        convertedInquiries,
        totalClients,
        newClientsThisMonth,
        totalProposals,
        proposalsPending,
        totalInvoices,
        totalRevenue,
        totalContracts,
        activeContracts,
        totalGalleries,
        totalAssets,
      ] = await Promise.all([
        // Inquiries
        prisma.inquiry.count(),
        prisma.inquiry.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.inquiry.count({
          where: { status: 'CONVERTED' },
        }),

        // Clients
        prisma.client.count(),
        prisma.client.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),

        // Proposals
        prisma.proposal.count(),
        prisma.proposal.count({
          where: { status: { in: ['DRAFT', 'SENT'] } },
        }),

        // Invoices & Revenue
        prisma.invoice.count(),
        prisma.invoice.aggregate({
          _sum: {
            total: true,
          },
        }),

        // Contracts
        prisma.contract.count(),
        prisma.contract.count({
          where: {
            status: { in: ['ACTIVE', 'SIGNED', 'COUNTERSIGNED'] },
          },
        }),

        // Galleries & Assets
        prisma.gallery.count(),
        prisma.asset.count(),
      ]);

      // Calculate conversion rate
      const conversionRate =
        totalInquiries > 0 ? Math.round((convertedInquiries / totalInquiries) * 100) : 0;

      // Get inquiry stats
      const inquiryStats = await prisma.inquiry.groupBy({
        by: ['status'],
        _count: true,
      });

      // Get top inquiry types
      const topInquiryTypes = await prisma.inquiry.groupBy({
        by: ['inquiryType'],
        _count: true,
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      // Get proposal status breakdown
      const proposalStats = await prisma.proposal.groupBy({
        by: ['status'],
        _count: true,
      });

      // Get client status breakdown
      const clientStats = await prisma.client.groupBy({
        by: ['status'],
        _count: true,
      });

      // Get contract status breakdown
      const contractStats = await prisma.contract.groupBy({
        by: ['status'],
        _count: true,
      });

      // Get recent activity
      const recentInquiries = await prisma.inquiry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          inquiryType: true,
          status: true,
          createdAt: true,
        },
      });

      const recentClients = await prisma.client.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      });

      const recentProposals = await prisma.proposal.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          client: {
            select: {
              name: true,
            },
          },
          createdAt: true,
        },
      });

      // Revenue breakdown by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          createdAt: true,
          total: true,
        },
      });

      // Group invoices by month
      const revenueByMonth = Object.entries(
        invoices.reduce((acc: Record<string, any>, inv) => {
          const monthKey = new Date(inv.createdAt).toISOString().split('T')[0].slice(0, 7); // YYYY-MM
          if (!acc[monthKey]) {
            acc[monthKey] = { date: monthKey, total: 0 };
          }
          acc[monthKey].total = Number((Number(acc[monthKey].total) + Number(inv.total)).toFixed(2));
          return acc;
        }, {})
      ).map(([_, value]) => value);

      return reply.send({
        success: true,
        data: {
          // Key Metrics
          metrics: {
            totalInquiries,
            newInquiriesToday,
            conversionRate,
            totalClients,
            newClientsThisMonth,
            totalProposals,
            proposalsPending,
            totalInvoices,
            totalRevenue: totalRevenue._sum.total || 0,
            totalContracts,
            activeContracts,
            totalGalleries,
            totalAssets,
          },

          // Status Breakdowns
          breakdown: {
            inquiries: inquiryStats.map((s) => ({
              status: s.status,
              count: s._count,
            })),
            proposals: proposalStats.map((s) => ({
              status: s.status,
              count: s._count,
            })),
            clients: clientStats.map((s) => ({
              status: s.status,
              count: s._count,
            })),
            contracts: contractStats.map((s) => ({
              status: s.status,
              count: s._count,
            })),
            topInquiryTypes: topInquiryTypes.map((t) => ({
              type: t.inquiryType,
              count: t._count,
            })),
          },

          // Recent Activity
          recent: {
            inquiries: recentInquiries,
            clients: recentClients,
            proposals: recentProposals,
          },

          // Financial Data
          revenue: {
            byMonth: revenueByMonth,
          },
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Analytics Error',
        message: 'Failed to load analytics data',
      });
    }
  });
}
