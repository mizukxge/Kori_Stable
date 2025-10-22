import { PrismaClient, WebhookDeliveryStatus, NotificationType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface WebhookPayload {
  event: NotificationType;
  eventId: string;
  timestamp: string;
  data: any;
}

/**
 * Create webhook signature
 */
function createSignature(secret: string, payload: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Deliver webhook to endpoint
 */
export async function deliverWebhook(
  endpointId: string,
  eventType: NotificationType,
  eventId: string,
  data: any
): Promise<void> {
  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { id: endpointId },
  });

  if (!endpoint || !endpoint.isActive) {
    console.log(`[Webhook] Endpoint ${endpointId} not active, skipping`);
    return;
  }

  // Check if endpoint subscribes to this event
  if (endpoint.events.length > 0 && !endpoint.events.includes(eventType)) {
    console.log(`[Webhook] Endpoint ${endpointId} not subscribed to ${eventType}, skipping`);
    return;
  }

  // Create payload
  const payload: WebhookPayload = {
    event: eventType,
    eventId,
    timestamp: new Date().toISOString(),
    data,
  };

  // Create delivery record
  const delivery = await prisma.webhookDelivery.create({
    data: {
      endpointId,
      eventType,
      eventId,
      payload: payload as any,
      status: WebhookDeliveryStatus.PENDING,
      maxAttempts: endpoint.maxRetries,
    },
  });

  // Attempt delivery
  await attemptDelivery(delivery.id);
}

/**
 * Attempt to deliver a webhook
 */
export async function attemptDelivery(deliveryId: string): Promise<boolean> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { endpoint: true },
  });

  if (!delivery || !delivery.endpoint.isActive) {
    return false;
  }

  if (delivery.attempts >= delivery.maxAttempts) {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: WebhookDeliveryStatus.FAILED,
        failedAt: new Date(),
        error: 'Max retry attempts reached',
      },
    });
    return false;
  }

  // Update status to sending
  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: WebhookDeliveryStatus.SENDING,
      attempts: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  try {
    const payloadString = JSON.stringify(delivery.payload);
    const signature = delivery.endpoint.secret
      ? createSignature(delivery.endpoint.secret, payloadString)
      : '';

    // Prepare headers
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'Kori-Webhooks/1.0',
      'X-Webhook-Event': delivery.eventType,
      'X-Webhook-Delivery': deliveryId,
      ...(delivery.endpoint.headers as any || {}),
    };

    if (signature) {
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const startTime = Date.now();

    // Send webhook
    const response = await fetch(delivery.endpoint.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(delivery.endpoint.timeoutSeconds * 1000),
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    if (response.ok) {
      // Success
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: WebhookDeliveryStatus.SUCCEEDED,
          succeededAt: new Date(),
          responseStatus: response.status,
          responseBody: responseBody.substring(0, 1000), // Limit size
          responseTime,
        },
      });

      await prisma.webhookEndpoint.update({
        where: { id: delivery.endpointId },
        data: {
          lastSuccessAt: new Date(),
          consecutiveFailures: 0,
        },
      });

      console.log(`[Webhook] Delivered successfully to ${delivery.endpoint.url}`);
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    }
  } catch (error: any) {
    console.error(`[Webhook] Delivery failed:`, error.message);

    // Calculate next retry time
    const backoffSeconds = delivery.endpoint.retryBackoff * Math.pow(2, delivery.attempts - 1);
    const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: delivery.attempts >= delivery.maxAttempts 
          ? WebhookDeliveryStatus.FAILED 
          : WebhookDeliveryStatus.PENDING,
        error: error.message,
        nextRetryAt: delivery.attempts < delivery.maxAttempts ? nextRetryAt : null,
        failedAt: delivery.attempts >= delivery.maxAttempts ? new Date() : null,
      },
    });

    await prisma.webhookEndpoint.update({
      where: { id: delivery.endpointId },
      data: {
        lastFailureAt: new Date(),
        failureCount: { increment: 1 },
        consecutiveFailures: { increment: 1 },
      },
    });

    return false;
  }
}

/**
 * Retry failed webhook deliveries
 */
export async function retryFailedDeliveries(): Promise<void> {
  const pendingDeliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: WebhookDeliveryStatus.PENDING,
      nextRetryAt: { lte: new Date() },
      attempts: { lt: prisma.$queryRaw`max_attempts` as any },
    },
    take: 100,
  });

  console.log(`[Webhook] Retrying ${pendingDeliveries.length} failed deliveries`);

  for (const delivery of pendingDeliveries) {
    await attemptDelivery(delivery.id);
    // Small delay between retries
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}