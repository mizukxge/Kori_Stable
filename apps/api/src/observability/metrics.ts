import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Lazy-load Prisma client to allow proper initialization at runtime
let prisma: any = null;

async function getPrismaClient() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

// Create a Registry
export const register = new Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'kori-api',
});

// Enable the collection of default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// === HTTP Metrics ===

/**
 * Counter for total HTTP requests
 */
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Histogram for HTTP request duration
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  registers: [register],
});

/**
 * Counter for HTTP errors
 */
export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
  registers: [register],
});

// === Business Metrics ===

/**
 * Gauge for total active clients
 */
export const activeClientsTotal = new Gauge({
  name: 'active_clients_total',
  help: 'Total number of active clients',
  registers: [register],
});

/**
 * Gauge for total invoices by status
 */
export const invoicesTotal = new Gauge({
  name: 'invoices_total',
  help: 'Total number of invoices',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Gauge for total revenue
 */
export const totalRevenue = new Gauge({
  name: 'total_revenue',
  help: 'Total revenue amount',
  labelNames: ['currency'],
  registers: [register],
});

/**
 * Gauge for total galleries
 */
export const galleriesTotal = new Gauge({
  name: 'galleries_total',
  help: 'Total number of galleries',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Gauge for total records (WORM archive)
 */
export const recordsTotal = new Gauge({
  name: 'records_total',
  help: 'Total number of archived records',
  labelNames: ['verification_status'],
  registers: [register],
});

/**
 * Gauge for accounting periods
 */
export const accountingPeriodsTotal = new Gauge({
  name: 'accounting_periods_total',
  help: 'Total number of accounting periods',
  labelNames: ['status'],
  registers: [register],
});

// === Authentication Metrics ===

/**
 * Counter for login attempts
 */
export const loginAttemptsTotal = new Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Gauge for active sessions
 */
export const activeSessionsTotal = new Gauge({
  name: 'active_sessions_total',
  help: 'Total number of active sessions',
  registers: [register],
});

// === Database Metrics ===

/**
 * Histogram for database query duration
 */
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

/**
 * Update business metrics from database
 */
export async function updateBusinessMetrics() {
  try {
    const db = await getPrismaClient();

    // Update client metrics
    const [activeClients, allClients] = await Promise.all([
      db.client.count({ where: { status: 'ACTIVE' } }),
      db.client.count(),
    ]);
    activeClientsTotal.set(activeClients);

    // Update invoice metrics by status
    const invoicesByStatus = await db.invoice.groupBy({
      by: ['status'],
      _count: true,
    });

    invoicesByStatus.forEach((item) => {
      invoicesTotal.set({ status: item.status }, item._count);
    });

    // Update total revenue (paid invoices)
    const paidInvoices = await db.invoice.findMany({
      where: { status: 'PAID' },
      select: { total: true, currency: true },
    });

    const revenueByCurrency = paidInvoices.reduce((acc, invoice) => {
      const curr = invoice.currency;
      if (!acc[curr]) acc[curr] = 0;
      acc[curr] += parseFloat(invoice.total.toString());
      return acc;
    }, {} as Record<string, number>);

    Object.entries(revenueByCurrency).forEach(([currency, amount]) => {
      totalRevenue.set({ currency }, Number(amount));
    });

    // Update gallery metrics
    const [activeGalleries, totalGalleriesCount] = await Promise.all([
      db.gallery.count({ where: { isActive: true } }),
      db.gallery.count(),
    ]);
    galleriesTotal.set({ status: 'active' }, activeGalleries);
    galleriesTotal.set({ status: 'total' }, totalGalleriesCount);

    // Update records metrics
    const recordsByStatus = await db.record.groupBy({
      by: ['verificationStatus'],
      where: { disposedAt: null },
      _count: true,
    });

    recordsByStatus.forEach((item) => {
      recordsTotal.set({ verification_status: item.verificationStatus }, item._count);
    });

    // Update accounting period metrics
    const periodsByStatus = await db.accountingPeriod.groupBy({
      by: ['status'],
      _count: true,
    });

    periodsByStatus.forEach((item) => {
      accountingPeriodsTotal.set({ status: item.status }, item._count);
    });

    // Update active sessions
    const activeSessions = await db.session.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    activeSessionsTotal.set(activeSessions);
  } catch (error) {
    console.error('Error updating business metrics:', error);
  }
}

/**
 * Get all metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  // Update business metrics before returning
  await updateBusinessMetrics();
  
  return register.metrics();
}

/**
 * Get metrics as JSON
 */
export async function getMetricsJSON() {
  await updateBusinessMetrics();
  
  return register.getMetricsAsJSON();
}