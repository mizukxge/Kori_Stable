import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get admin user (required for createdBy)
    const adminUser = await prisma.adminUser.findFirst();
    if (!adminUser) {
      console.error('❌ No admin user found. Please run the seed script first.');
      process.exit(1);
    }

    // Get or create a client
    let client = await prisma.client.findFirst();

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: 'Sarah & James Wilson',
          email: 'sarah.wilson@example.com',
          phone: '+44 7700 900123',
          address: '123 High Street, London, SW1A 1AA',
          notes: 'Wedding Photography Client'
        }
      });
      console.log('✅ Created client:', client.name);
    } else {
      console.log('✅ Using existing client:', client.name);
    }

    // Create an invoice with payment options
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        title: 'Wedding Photography Invoice',
        description: 'Professional wedding photography services including full-day coverage, premium album, and digital gallery.',
        clientId: client.id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'SENT',
        currency: 'GBP',
        paymentType: 'CARD',
        items: {
          create: [
            {
              description: 'Wedding Photography Package - Full Day Coverage',
              quantity: 1,
              unitPrice: 2500.00,
              amount: 2500.00,
              position: 0
            },
            {
              description: 'Premium Photo Album (50 pages)',
              quantity: 1,
              unitPrice: 450.00,
              amount: 450.00,
              position: 1
            },
            {
              description: 'Digital Gallery with Download Rights',
              quantity: 1,
              unitPrice: 300.00,
              amount: 300.00,
              position: 2
            }
          ]
        },
        subtotal: 3250.00,
        taxRate: 20.0,
        taxAmount: 650.00,
        total: 3900.00,
        amountDue: 3900.00,
        notes: 'Thank you for choosing us for your special day! Payment is due within 30 days. We accept bank transfers, PayPal, Apple Pay, Google Pay, and credit cards via Stripe.',
        createdBy: adminUser.id
      },
      include: {
        client: true,
        items: true
      }
    });

    console.log('\n✅ Created invoice successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Invoice Number: ${invoice.invoiceNumber}`);
    console.log(`Client: ${invoice.client.name}`);
    console.log(`Total: £${invoice.total.toFixed(2)} ${invoice.currency}`);
    console.log(`Status: ${invoice.status}`);
    console.log(`Items: ${invoice.items.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n🔗 View invoice at: http://localhost:3000/admin/invoices/${invoice.id}`);
    console.log(`\n💳 Payment page: http://localhost:3000/payment/${invoice.id}`);
    console.log('\nInvoice ID:', invoice.id);

  } catch (error: any) {
    console.error('❌ Error creating invoice:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
