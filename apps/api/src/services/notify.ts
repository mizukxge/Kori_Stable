import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client';
import { sendNotificationEmail } from './email';
import { deliverWebhook } from './webhook';

const prisma = new PrismaClient();

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  category?: 'info' | 'success' | 'warning' | 'error';
  entityType?: string;
  entityId?: string;
  metadata?: any;
  actionUrl?: string;
  actionText?: string;
  priority?: NotificationPriority;
  expiresAt?: Date;
}

/**
 * Send a notification through all enabled channels
 * This is the main entry point for creating notifications
 */
export async function notify(data: NotificationData): Promise<void> {
  console.log(`[Notify] Sending ${data.type} notification to user ${data.userId}`);

  try {
    // Get user preferences
    const preferences = await getUserPreferences(data.userId, data.type);

    // 1. Create in-app notification (if enabled)
    let notificationId: string | null = null;
    if (preferences.inAppEnabled) {
      notificationId = await createInAppNotification(data);
    }

    // 2. Send email notification (if enabled)
    if (preferences.emailEnabled && !preferences.digestEnabled) {
      await sendEmailNotification(data);
    }

    // 3. Trigger webhooks (if enabled)
    if (preferences.webhookEnabled) {
      await triggerWebhooks(data, notificationId || data.entityId || '');
    }

    console.log(`[Notify] Successfully sent ${data.type} notification`);
  } catch (error) {
    console.error('[Notify] Failed to send notification:', error);
    throw error;
  }
}

/**
 * Get user notification preferences for a specific event type
 */
async function getUserPreferences(
  userId: string,
  eventType: NotificationType
): Promise<{
  emailEnabled: boolean;
  inAppEnabled: boolean;
  webhookEnabled: boolean;
  digestEnabled: boolean;
}> {
  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_eventType: {
        userId,
        eventType,
      },
    },
  });

  if (preference && !preference.enabled) {
    // User has disabled this notification type
    return {
      emailEnabled: false,
      inAppEnabled: false,
      webhookEnabled: false,
      digestEnabled: false,
    };
  }

  // Return preference or defaults
  return {
    emailEnabled: preference?.emailEnabled ?? true,
    inAppEnabled: preference?.inAppEnabled ?? true,
    webhookEnabled: preference?.webhookEnabled ?? false,
    digestEnabled: preference?.digestEnabled ?? false,
  };
}

/**
 * Create in-app notification
 */
async function createInAppNotification(data: NotificationData): Promise<string> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      category: data.category,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata || {},
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      priority: data.priority || NotificationPriority.NORMAL,
      expiresAt: data.expiresAt,
    },
  });

  console.log(`[Notify] Created in-app notification ${notification.id}`);
  return notification.id;
}

/**
 * Send email notification
 */
async function sendEmailNotification(data: NotificationData): Promise<void> {
  // Get user email
  const user = await prisma.adminUser.findUnique({
    where: { id: data.userId },
    select: { email: true, name: true },
  });

  if (!user) {
    console.warn(`[Notify] User ${data.userId} not found, skipping email`);
    return;
  }

  await sendNotificationEmail(
    user.email,
    data.title,
    data.message,
    data.actionUrl,
    data.actionText
  );

  console.log(`[Notify] Sent email to ${user.email}`);
}

/**
 * Trigger webhooks for this notification
 */
async function triggerWebhooks(data: NotificationData, eventId: string): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      userId: data.userId,
      isActive: true,
    },
  });

  const webhookPromises = endpoints.map((endpoint) =>
    deliverWebhook(endpoint.id, data.type, eventId, {
      type: data.type,
      title: data.title,
      message: data.message,
      category: data.category,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata,
      actionUrl: data.actionUrl,
      priority: data.priority,
    })
  );

  await Promise.allSettled(webhookPromises);
  console.log(`[Notify] Triggered ${endpoints.length} webhooks`);
}

// ============================================
// CONVENIENCE FUNCTIONS FOR COMMON EVENTS
// ============================================

/**
 * Notify when invoice is paid
 */
export async function notifyInvoicePaid(
  userId: string,
  invoiceNumber: string,
  amount: number,
  clientName: string
): Promise<void> {
  await notify({
    userId,
    type: NotificationType.INVOICE_PAID,
    title: 'Invoice Paid',
    message: `Invoice ${invoiceNumber} has been paid by ${clientName}. Amount: $${amount.toFixed(2)}`,
    category: 'success',
    entityType: 'invoice',
    entityId: invoiceNumber,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Notify when invoice is overdue
 */
export async function notifyInvoiceOverdue(
  userId: string,
  invoiceNumber: string,
  daysOverdue: number,
  clientName: string
): Promise<void> {
  await notify({
    userId,
    type: NotificationType.INVOICE_OVERDUE,
    title: 'Invoice Overdue',
    message: `Invoice ${invoiceNumber} for ${clientName} is ${daysOverdue} days overdue.`,
    category: 'warning',
    entityType: 'invoice',
    entityId: invoiceNumber,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Notify when proposal is accepted
 */
export async function notifyProposalAccepted(
  userId: string,
  proposalNumber: string,
  clientName: string
): Promise<void> {
  await notify({
    userId,
    type: NotificationType.PROPOSAL_ACCEPTED,
    title: 'Proposal Accepted!',
    message: `${clientName} has accepted proposal ${proposalNumber}.`,
    category: 'success',
    entityType: 'proposal',
    entityId: proposalNumber,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Notify when gallery is viewed
 */
export async function notifyGalleryViewed(
  userId: string,
  galleryName: string,
  viewerName?: string
): Promise<void> {
  await notify({
    userId,
    type: NotificationType.GALLERY_VIEWED,
    title: 'Gallery Viewed',
    message: `${viewerName || 'Someone'} viewed gallery "${galleryName}".`,
    category: 'info',
    entityType: 'gallery',
    priority: NotificationPriority.NORMAL,
  });
}

/**
 * Notify when proof selection is made
 */
export async function notifyProofSelection(
  userId: string,
  galleryName: string,
  selectionsCount: number,
  clientName?: string
): Promise<void> {
  await notify({
    userId,
    type: NotificationType.PROOF_SELECTION_MADE,
    title: 'Proof Selections Made',
    message: `${clientName || 'A client'} made ${selectionsCount} selections in gallery "${galleryName}".`,
    category: 'info',
    entityType: 'gallery',
    priority: NotificationPriority.NORMAL,
  });
}

/**
 * Notify when asset processing is complete
 */
export async function notifyAssetProcessed(
  userId: string,
  filename: string,
  success: boolean
): Promise<void> {
  await notify({
    userId,
    type: success ? NotificationType.ASSET_PROCESSED : NotificationType.ASSET_FAILED,
    title: success ? 'Asset Processed' : 'Asset Processing Failed',
    message: success
      ? `${filename} has been successfully processed.`
      : `Failed to process ${filename}.`,
    category: success ? 'success' : 'error',
    entityType: 'asset',
    priority: success ? NotificationPriority.NORMAL : NotificationPriority.HIGH,
  });
}

/**
 * Notify when payment is received
 */
export async function notifyPaymentReceived(
  userId: string,
  paymentNumber: string,
  amount: number,
  clientName: string
): Promise<void> {
  await notify({
    userId,
    type: NotificationType.PAYMENT_RECEIVED,
    title: 'Payment Received',
    message: `Received payment ${paymentNumber} of $${amount.toFixed(2)} from ${clientName}.`,
    category: 'success',
    entityType: 'payment',
    entityId: paymentNumber,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Notify when contract is signed
 */
export async function notifyContractSigned(
  userId: string,
  contractNumber: string,
  clientName: string
): Promise<void> {
  await notify({
    userId,
    type: NotificationType.CONTRACT_SIGNED,
    title: 'Contract Signed',
    message: `${clientName} has signed contract ${contractNumber}.`,
    category: 'success',
    entityType: 'contract',
    entityId: contractNumber,
    priority: NotificationPriority.HIGH,
  });
}

/**
 * Notify about system maintenance
 */
export async function notifySystemMaintenance(
  userId: string,
  scheduledTime: Date,
  duration: string
): Promise<void> {
  await notify({
    userId,
    type: NotificationType.SYSTEM_MAINTENANCE,
    title: 'Scheduled Maintenance',
    message: `System maintenance scheduled for ${scheduledTime.toLocaleString()}. Expected duration: ${duration}.`,
    category: 'warning',
    priority: NotificationPriority.HIGH,
  });
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Notify multiple users
 */
export async function notifyMultiple(
  userIds: string[],
  data: Omit<NotificationData, 'userId'>
): Promise<void> {
  const promises = userIds.map((userId) =>
    notify({ ...data, userId }).catch((error) => {
      console.error(`[Notify] Failed to notify user ${userId}:`, error);
    })
  );

  await Promise.allSettled(promises);
  console.log(`[Notify] Notified ${userIds.length} users`);
}

/**
 * Notify all admins
 */
export async function notifyAllAdmins(
  data: Omit<NotificationData, 'userId'>
): Promise<void> {
  const admins = await prisma.adminUser.findMany({
    select: { id: true },
  });

  await notifyMultiple(
    admins.map((a) => a.id),
    data
  );
}

// ============================================
// CLI TEST FUNCTION
// ============================================

/**
 * Test notification function (for CLI)
 */
export async function testNotification(eventType: string): Promise<void> {
  console.log(`\n🧪 Testing notification: ${eventType}\n`);

  // Get first admin user for testing
  const user = await prisma.adminUser.findFirst();

  if (!user) {
    console.error('❌ No admin user found. Create a user first.');
    process.exit(1);
  }

  console.log(`📧 Sending test notification to: ${user.email}`);

  const testData: Record<string, NotificationData> = {
    'proposal.accepted': {
      userId: user.id,
      type: NotificationType.PROPOSAL_ACCEPTED,
      title: 'Test: Proposal Accepted',
      message: 'This is a test notification for proposal acceptance.',
      category: 'success',
      priority: NotificationPriority.HIGH,
      actionUrl: 'https://example.com/proposals/123',
      actionText: 'View Proposal',
    },
    'invoice.paid': {
      userId: user.id,
      type: NotificationType.INVOICE_PAID,
      title: 'Test: Invoice Paid',
      message: 'Test invoice INV-2025-001 has been paid. Amount: $1,500.00',
      category: 'success',
      priority: NotificationPriority.HIGH,
    },
    'gallery.viewed': {
      userId: user.id,
      type: NotificationType.GALLERY_VIEWED,
      title: 'Test: Gallery Viewed',
      message: 'Test Client viewed your gallery "Wedding Photos 2025".',
      category: 'info',
      priority: NotificationPriority.NORMAL,
    },
  };

  const data = testData[eventType] || testData['proposal.accepted'];

  try {
    await notify(data);
    console.log('\n✅ Test notification sent successfully!');
    console.log('\nCheck:');
    console.log('  • Database for in-app notification');
    console.log('  • Email inbox for email notification');
    console.log('  • Webhook endpoints (if configured)');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const testFlag = args.indexOf('--test');

  if (testFlag !== -1) {
    const eventType = args[testFlag + 1] || 'proposal.accepted';
    testNotification(eventType)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage: tsx notify.ts --test [event-type]');
    console.log('\nAvailable test events:');
    console.log('  • proposal.accepted');
    console.log('  • invoice.paid');
    console.log('  • gallery.viewed');
    process.exit(0);
  }
}