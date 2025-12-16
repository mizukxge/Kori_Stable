import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

// Wedding Photography Contract HTML Template
const weddingBodyHtml = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .contract-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
    .contract-header h1 { margin: 0 0 10px 0; font-size: 24px; font-weight: bold; }
    .contract-number { margin: 5px 0 0 0; font-size: 12px; color: #666; }
    section { margin-bottom: 30px; }
    h2 { font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    h3 { font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 10px; }
    .party { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 3px solid #007bff; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table tr { border-bottom: 1px solid #ddd; }
    table td { padding: 10px; }
    table td:first-child { font-weight: 500; width: 40%; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 8px 0; }
    .signature-section { margin-top: 40px; }
    .signature-line { display: inline-block; width: 200px; border-top: 1px solid #000; margin-top: 30px; }
    .signature-area { display: inline-block; margin-right: 40px; vertical-align: top; }
  </style>

  <div class="contract-header">
    <h1>Wedding Photography Service Agreement</h1>
    <p class="contract-number">Contract No: {{contract_number}}</p>
    <p style="font-size: 12px; margin: 10px 0 0 0;">Effective Date: {{effective_date}}</p>
  </div>

  <section class="parties">
    <h2>1. Parties to Agreement</h2>
    <p>This Wedding Photography Service Agreement ("Agreement") is entered into on {{effective_date}} between:</p>

    <div class="party">
      <p style="margin: 0 0 8px 0;"><strong>Photographer (Service Provider):</strong></p>
      {{photographer_name}}<br>
      {{studio_location}}<br>
      <strong>Email:</strong> {{data_controller_email}}<br>
      <strong>Portfolio/Website:</strong> {{photographer_handle}}
    </div>

    <div class="party">
      <p style="margin: 0 0 8px 0;"><strong>Client (Purchaser):</strong></p>
      {{client_name}}<br>
      <strong>Email:</strong> {{client_email}}<br>
      <strong>Phone:</strong> {{client_phone}}
    </div>
  </section>

  <section>
    <h2>2. Event Details & Scope</h2>
    <table>
      <tr>
        <td><strong>Event Type:</strong></td>
        <td>{{event_type}}</td>
      </tr>
      <tr>
        <td><strong>Wedding Date:</strong></td>
        <td>{{event_date}}</td>
      </tr>
      <tr>
        <td><strong>Ceremony Start Time:</strong></td>
        <td>{{event_time}}</td>
      </tr>
      <tr>
        <td><strong>Ceremony Venue:</strong></td>
        <td>{{venue_name}}<br>{{venue_address}}</td>
      </tr>
      <tr>
        <td><strong>Reception Venue:</strong></td>
        <td>{{reception_venue}}</td>
      </tr>
      <tr>
        <td><strong>Hours of Coverage:</strong></td>
        <td>{{coverage_hours}} hours starting at {{coverage_start}}</td>
      </tr>
    </table>
  </section>

  <section>
    <h2>3. Photographer's Services</h2>
    <p>The Photographer agrees to provide professional wedding photography services as detailed below:</p>

    <h3>3.1 Coverage Services</h3>
    <ul>
      <li>{{coverage_hours}} hours of continuous professional photography coverage</li>
      <li>Second Shooter Included: {{second_shooter}}</li>
      <li>Engagement Session: {{engagement_session}}</li>
      <li>Pre-wedding consultation and planning meeting</li>
      <li>Delivery of high-resolution digital image files</li>
    </ul>

    <h3>3.2 Deliverables</h3>
    <ul>
      <li>Approximately {{estimated_image_count}} professionally edited, high-resolution images (minimum)</li>
      <li>{{sneak_peek_count}} sneak peek images delivered within {{sneak_peek_days}} business days</li>
      <li>Complete gallery of edited images delivered within {{full_delivery_weeks}} weeks of the wedding</li>
      <li>Online password-protected gallery access for {{gallery_access_days}} days</li>
      <li>Digital files in high-resolution JPEG format (300 DPI)</li>
      <li>Unlimited personal print rights for Client use only</li>
    </ul>

    <h3>3.3 What is Not Included</h3>
    <ul>
      <li>Printed photo albums or bound products (available for additional fee)</li>
      <li>Additional photographers beyond second shooter</li>
      <li>Travel costs beyond {{studio_location}} area (mileage fee applies)</li>
      <li>Video coverage (contact photographer for separate videography quote)</li>
    </ul>
  </section>

  <section>
    <h2>4. Payment Terms & Conditions</h2>

    <h3>4.1 Fees & Deposit</h3>
    <table>
      <tr>
        <td><strong>Total Contract Amount:</strong></td>
        <td style="text-align: right;">{{total_amount}}</td>
      </tr>
      <tr>
        <td><strong>Non-Refundable Deposit (due upon signing):</strong></td>
        <td style="text-align: right;">{{deposit_amount}}</td>
      </tr>
      <tr>
        <td><strong>Final Balance (due {{payment_due_date}}):</strong></td>
        <td style="text-align: right;">{{final_amount}}</td>
      </tr>
    </table>

    <h3>4.2 Payment Methods</h3>
    <p>Payment accepted via bank transfer, credit/debit card, or as otherwise agreed in writing.</p>

    <h3>4.3 Late Payment Policy</h3>
    <p>If final payment is not received by {{payment_due_date}}, delivery of final edited images will be withheld until payment is received in full.</p>

    <h3>4.4 Cancellation Policy</h3>
    <ul>
      <li><strong>Cancellation 90+ days before wedding:</strong> Deposit fully refunded minus 10% administrative fee</li>
      <li><strong>Cancellation 30-89 days before wedding:</strong> 50% of deposit retained, remaining balance refunded</li>
      <li><strong>Cancellation less than 30 days before wedding:</strong> Deposit forfeited in full</li>
      <li><strong>Photographer cancellation:</strong> Full refund or alternative photographer provided</li>
    </ul>
  </section>

  <section>
    <h2>5. Copyright & Usage Rights</h2>
    <ul>
      <li>All images remain the copyright property of {{photographer_name}}</li>
      <li>Client receives non-exclusive personal use rights</li>
      <li>Client may not sell, license, or commercially use any images without written permission</li>
      <li>Photographer retains the right to display images in portfolio, website, and social media</li>
      <li>Images may not be altered, edited, or manipulated without photographer's permission</li>
    </ul>
  </section>

  <section>
    <h2>6. Liability & Limitations</h2>
    <p><strong>Weather & Unforeseen Circumstances:</strong> In case of severe weather preventing outdoor photography, images will be taken at alternative locations or rescheduled to an alternative date.</p>

    <p><strong>Equipment Failure:</strong> The Photographer maintains backup equipment. In the unlikely event of total equipment failure, the Photographer will use professional-grade alternative equipment or provide a pro-rated refund.</p>

    <p><strong>Image Delivery Guarantee:</strong> The Photographer guarantees delivery of a minimum of {{estimated_image_count}} edited images.</p>
  </section>

  <section class="signature-section">
    <h2>7. Agreement & Signatures</h2>
    <p>By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions of this Wedding Photography Service Agreement.</p>

    <div style="margin-top: 40px;">
      <div class="signature-area">
        <strong>Photographer Signature:</strong><br><br>
        <div class="signature-line"></div><br>
        {{photographer_name}}<br>
        <strong>Date:</strong> ____________________
      </div>

      <div class="signature-area" style="margin-left: 60px;">
        <strong>Client Signature:</strong><br><br>
        <div class="signature-line"></div><br>
        {{client_name}}<br>
        <strong>Date:</strong> ____________________
      </div>
    </div>
  </section>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666;">
    <p><strong>Governing Law:</strong> This agreement is governed by the laws of England and Wales.</p>
    <p style="margin-top: 20px; text-align: center; color: #999;">© {{photographer_name}} | Contract generated {{current_date}}</p>
  </div>
`;

// Portrait Photography Contract HTML Template
const portraitBodyHtml = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .contract-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
    .contract-header h1 { margin: 0 0 10px 0; font-size: 24px; font-weight: bold; }
    .contract-number { margin: 5px 0 0 0; font-size: 12px; color: #666; }
    section { margin-bottom: 30px; }
    h2 { font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    h3 { font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 10px; }
    .party { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 3px solid #007bff; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table tr { border-bottom: 1px solid #ddd; }
    table td { padding: 10px; }
    table td:first-child { font-weight: 500; width: 40%; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 8px 0; }
    .signature-section { margin-top: 40px; }
    .signature-line { display: inline-block; width: 200px; border-top: 1px solid #000; margin-top: 30px; }
    .signature-area { display: inline-block; margin-right: 40px; vertical-align: top; }
  </style>

  <div class="contract-header">
    <h1>Portrait Photography Session Agreement</h1>
    <p class="contract-number">Contract No: {{contract_number}}</p>
    <p style="font-size: 12px; margin: 10px 0 0 0;">Effective Date: {{effective_date}}</p>
  </div>

  <section class="parties">
    <h2>1. Parties to Agreement</h2>
    <p>This Portrait Photography Session Agreement ("Agreement") is entered into on {{effective_date}} between:</p>

    <div class="party">
      <p style="margin: 0 0 8px 0;"><strong>Photographer:</strong></p>
      {{photographer_name}}<br>
      <strong>Email:</strong> {{data_controller_email}}
    </div>

    <div class="party">
      <p style="margin: 0 0 8px 0;"><strong>Client:</strong></p>
      {{client_name}}<br>
      <strong>Email:</strong> {{client_email}}
    </div>
  </section>

  <section>
    <h2>2. Session Details & Scope</h2>
    <table>
      <tr>
        <td><strong>Session Type:</strong></td>
        <td>{{session_type}}</td>
      </tr>
      <tr>
        <td><strong>Scheduled Date:</strong></td>
        <td>{{session_date}} at {{session_time}}</td>
      </tr>
      <tr>
        <td><strong>Location:</strong></td>
        <td>{{session_location}}</td>
      </tr>
      <tr>
        <td><strong>Session Duration:</strong></td>
        <td>Up to {{session_duration}} hour(s)</td>
      </tr>
    </table>
  </section>

  <section>
    <h2>3. Package: {{package_name}}</h2>

    <h3>3.1 What's Included</h3>
    <ul>
      <li>Professional portrait session photography</li>
      <li>{{edited_images}} professionally retouched, high-resolution digital images</li>
      <li>Online private gallery for viewing and download</li>
      <li>Unlimited personal printing and use rights</li>
      <li>Digital delivery via secure online gallery</li>
    </ul>

    <h3>3.2 Delivery Timeline</h3>
    <p>Final edited images will be delivered within {{delivery_days}} business days of session date via online gallery link.</p>

    <h3>3.3 Image Rights & Usage</h3>
    <p>The Client receives a non-exclusive license to use the delivered digital images for personal, non-commercial purposes including:</p>
    <ul>
      <li>Personal and family use</li>
      <li>Social media sharing with proper credit to {{photographer_name}}</li>
      <li>Printing for personal display</li>
      <li>Sharing with immediate family and friends</li>
    </ul>
    <p><strong>The Client may NOT:</strong></p>
    <ul>
      <li>Use images for commercial purposes without written permission</li>
      <li>Sell, license, or distribute images to third parties</li>
      <li>Significantly alter or edit images</li>
      <li>Remove copyright information or metadata from files</li>
    </ul>
  </section>

  <section>
    <h2>4. Photographer Rights & Responsibilities</h2>

    <h3>4.1 Photographer Retains Copyright</h3>
    <p>All original images remain the exclusive property of {{photographer_name}}. The Photographer retains all copyright and intellectual property rights to the images.</p>

    <h3>4.2 Photographer Portfolio Usage</h3>
    <p>The Photographer may use the images in portfolio, website, social media promotion, and professional publications. The Client may request confidentiality in writing, in which case images will not be publicly shared without explicit Client approval.</p>

    <h3>4.3 Raw Files</h3>
    <p>Unedited/raw image files are not included in any standard package. Raw files available only upon separate negotiation and additional fee.</p>
  </section>

  <section>
    <h2>5. Investment & Payment Terms</h2>

    <h3>5.1 Fees</h3>
    <table>
      <tr>
        <td><strong>Session Fee:</strong></td>
        <td style="text-align: right;">{{session_fee}}</td>
      </tr>
      <tr>
        <td><strong>Package: {{package_name}}</strong></td>
        <td style="text-align: right;">Included</td>
      </tr>
      <tr style="background: #f0f0f0; font-weight: bold;">
        <td><strong>Total Due:</strong></td>
        <td style="text-align: right;">{{session_fee}}</td>
      </tr>
    </table>

    <h3>5.2 Payment Schedule</h3>
    <table>
      <tr>
        <td><strong>Deposit to secure booking:</strong></td>
        <td style="text-align: right;">{{deposit_amount}}</td>
      </tr>
      <tr>
        <td><strong>Final Balance due:</strong></td>
        <td style="text-align: right;">{{session_fee}} - {{deposit_amount}}</td>
      </tr>
      <tr>
        <td><strong>Payment due:</strong></td>
        <td style="text-align: right;">{{payment_due}}</td>
      </tr>
    </table>

    <h3>5.3 Late Payment & Rescheduling</h3>
    <p>Session is not confirmed until deposit is received. If balance remains unpaid at the time of the session, session may be rescheduled at {{photographer_name}}'s discretion.</p>
  </section>

  <section>
    <h2>6. Cancellation, Rescheduling & Limitations</h2>

    <h3>6.1 Client Cancellation</h3>
    <ul>
      <li><strong>More than 30 days before session:</strong> Deposit is fully refundable</li>
      <li><strong>15-30 days before session:</strong> 50% of deposit is refundable</li>
      <li><strong>Less than 15 days before session:</strong> Deposit is non-refundable, but may be applied to future session</li>
    </ul>

    <h3>6.2 Photographer Cancellation</h3>
    <p>{{photographer_name}} reserves the right to cancel due to illness, emergency, or unforeseen circumstances. Full refund or alternative photographer will be provided.</p>

    <h3>6.3 Inclement Weather & Rescheduling</h3>
    <p>If severe weather or unsafe conditions prevent the session, session may be rescheduled without penalty. Client must provide notice of rescheduling within 30 days of original session date.</p>

    <h3>6.4 Limited Liability</h3>
    <p>{{photographer_name}} is not responsible for client's failure to appear at scheduled session time, or loss of access to online gallery after the agreed expiration date.</p>
  </section>

  <section class="signature-section">
    <h2>7. Agreement & Signatures</h2>
    <p>By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions of this Portrait Photography Session Agreement.</p>

    <div style="margin-top: 40px;">
      <div class="signature-area">
        <strong>Photographer Signature:</strong><br><br>
        <div class="signature-line"></div><br>
        {{photographer_name}}<br>
        <strong>Date:</strong> ____________________
      </div>

      <div class="signature-area" style="margin-left: 60px;">
        <strong>Client Signature:</strong><br><br>
        <div class="signature-line"></div><br>
        {{client_name}}<br>
        <strong>Date:</strong> ____________________
      </div>
    </div>
  </section>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666;">
    <p><strong>Governing Law:</strong> This agreement is governed by the laws of England and Wales.</p>
    <p style="margin-top: 20px; text-align: center; color: #999;">© {{photographer_name}} | Contract generated {{current_date}}</p>
  </div>
`;

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin
  const superAdminPassword = await argon2.hash('SuperAdmin123!');
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@kori.dev' },
    update: { password: superAdminPassword },
    create: {
      email: 'admin@kori.dev',
      password: superAdminPassword,
      name: 'Super Admin',
    },
  });
  console.log('✅ Created Super Admin:', superAdmin.email);

  // Create Regular Admin
  const adminPassword = await argon2.hash('Admin123!');
  const admin = await prisma.adminUser.upsert({
    where: { email: 'manager@kori.dev' },
    update: { password: adminPassword },
    create: {
      email: 'manager@kori.dev',
      password: adminPassword,
      name: 'Admin Manager',
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // Create Regular User
  const userPassword = await argon2.hash('User123!');
  const user = await prisma.adminUser.upsert({
    where: { email: 'user@kori.dev' },
    update: { password: userPassword },
    create: {
      email: 'user@kori.dev',
      password: userPassword,
      name: 'Regular User',
    },
  });
  console.log('✅ Created User:', user.email);

  // Create Production Admin User
  const prodAdminPassword = await argon2.hash('#Admin:123');
  const prodAdmin = await prisma.adminUser.upsert({
    where: { email: 'michael@shotbymizu.co.uk' },
    update: { password: prodAdminPassword },
    create: {
      email: 'michael@shotbymizu.co.uk',
      password: prodAdminPassword,
      name: 'Michael Admin',
    },
  });
  console.log('✅ Created Production Admin:', prodAdmin.email);

  // Create Sample Clients
  const client1 = await prisma.client.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0100',
      company: 'Acme Corporation',
      status: 'ACTIVE',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'US',
      source: 'referral',
      preferredContactMethod: 'email',
      tags: ['premium', 'enterprise'],
      notes: 'VIP client - priority support',
    },
  });
  console.log('✅ Created Client:', client1.name);

  const client2 = await prisma.client.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0200',
      company: 'Tech Innovations Inc',
      status: 'ACTIVE',
      address: '456 Market Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      source: 'website',
      preferredContactMethod: 'both',
      tags: ['startup'],
      notes: 'Early adopter customer',
    },
  });
  console.log('✅ Created Client:', client2.name);

  const client3 = await prisma.client.upsert({
    where: { email: 'bob.wilson@example.com' },
    update: {},
    create: {
      name: 'Bob Wilson',
      email: 'bob.wilson@example.com',
      phone: '+1-555-0300',
      status: 'PENDING',
      address: '789 Oak Avenue',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'US',
      source: 'direct',
      preferredContactMethod: 'phone',
      tags: ['new'],
      notes: 'Onboarding in progress',
    },
  });
  console.log('✅ Created Client:', client3.name);

  // Create Contract Templates
  console.log('\n📄 Creating Contract Templates...');

  const weddingTemplate = await prisma.contractTemplate.upsert({
    where: { name: 'Wedding Photography Contract' },
    update: {
      bodyHtml: weddingBodyHtml,
    },
    create: {
      name: 'Wedding Photography Contract',
      description: 'Comprehensive wedding photography contract with coverage, deliverables, and payment terms',
      type: 'SERVICE_AGREEMENT',
      eventType: 'WEDDING',
      mandatoryClauseIds: [],
      isActive: true,
      isPublished: true,
      version: 1,
      createdBy: superAdmin.id,
      bodyHtml: weddingBodyHtml,
      variablesSchema: {
        sections: [
          {
            title: 'Event Details',
            fields: [
              { name: 'event_date', type: 'date', label: 'Wedding Date', required: true },
              { name: 'event_time', type: 'text', label: 'Ceremony Start Time', required: true, mask: '##:## AM/PM' },
              { name: 'venue_name', type: 'text', label: 'Venue Name', required: true },
              { name: 'venue_address', type: 'text', label: 'Venue Address', required: true },
              { name: 'reception_venue', type: 'text', label: 'Reception Venue (if different)', required: false },
              { name: 'event_type', type: 'select', label: 'Event Type', required: true, options: ['Wedding', 'Elopement', 'Vow Renewal'] },
            ],
          },
          {
            title: 'Coverage & Services',
            fields: [
              { name: 'coverage_hours', type: 'number', label: 'Hours of Coverage', required: true, min: 1, max: 16 },
              { name: 'coverage_start', type: 'text', label: 'Coverage Start Time', required: true },
              { name: 'second_shooter', type: 'select', label: 'Second Shooter', required: true, options: ['Yes', 'No'] },
              { name: 'engagement_session', type: 'select', label: 'Engagement Session Included', required: true, options: ['Yes', 'No'] },
            ],
          },
          {
            title: 'Deliverables',
            fields: [
              { name: 'estimated_image_count', type: 'number', label: 'Estimated Edited Images', required: true, default: 500 },
              { name: 'sneak_peek_count', type: 'number', label: 'Sneak Peek Images', required: true, default: 20 },
              { name: 'sneak_peek_days', type: 'number', label: 'Sneak Peek Delivery (days)', required: true, default: 3 },
              { name: 'full_delivery_weeks', type: 'number', label: 'Full Gallery Delivery (weeks)', required: true, default: 8 },
              { name: 'gallery_access_days', type: 'number', label: 'Gallery Access Duration (days)', required: true, default: 90 },
            ],
          },
          {
            title: 'Payment Terms',
            fields: [
              { name: 'total_amount', type: 'currency', label: 'Total Contract Amount', required: true },
              { name: 'deposit_amount', type: 'currency', label: 'Deposit Amount', required: true },
              { name: 'deposit_due_date', type: 'date', label: 'Deposit Due Date', required: true },
              { name: 'second_payment', type: 'currency', label: 'Second Payment Amount', required: false },
              { name: 'second_payment_date', type: 'date', label: 'Second Payment Due Date', required: false },
              { name: 'final_amount', type: 'currency', label: 'Final Balance', required: true },
              { name: 'payment_due_date', type: 'text', label: 'Final Payment Due', required: true, default: '30 days before the wedding' },
            ],
          },
          {
            title: 'Photographer Information',
            fields: [
              { name: 'photographer_name', type: 'text', label: 'Photographer Name', required: true },
              { name: 'photographer_handle', type: 'text', label: 'Social Media Handle', required: false, default: '@mizustudio' },
              { name: 'studio_location', type: 'text', label: 'Studio Location', required: true },
            ],
          },
        ],
      },
    },
  });
  console.log('✅ Created Wedding Template');

  const portraitTemplate = await prisma.contractTemplate.upsert({
    where: { name: 'Portrait Session Contract' },
    update: {
      bodyHtml: portraitBodyHtml,
    },
    create: {
      name: 'Portrait Session Contract',
      description: 'Standard portrait photography session agreement for individuals and families',
      type: 'SERVICE_AGREEMENT',
      eventType: 'PORTRAIT',
      mandatoryClauseIds: [],
      isActive: true,
      isPublished: true,
      version: 1,
      createdBy: superAdmin.id,
      bodyHtml: portraitBodyHtml,
      variablesSchema: {
        sections: [
          {
            title: 'Session Details',
            fields: [
              { name: 'session_type', type: 'select', label: 'Session Type', required: true, options: ['Family Portrait', 'Individual Portrait', 'Maternity', 'Newborn', 'Senior Portrait', 'Headshot'] },
              { name: 'session_date', type: 'date', label: 'Session Date', required: true },
              { name: 'session_time', type: 'text', label: 'Session Time', required: true },
              { name: 'session_location', type: 'text', label: 'Location', required: true },
              { name: 'session_duration', type: 'number', label: 'Session Duration (hours)', required: true, default: 1 },
            ],
          },
          {
            title: 'Package & Deliverables',
            fields: [
              { name: 'package_name', type: 'text', label: 'Package Name', required: true },
              { name: 'edited_images', type: 'number', label: 'Edited Images Included', required: true },
              { name: 'delivery_days', type: 'number', label: 'Delivery Timeline (days)', required: true, default: 14 },
              { name: 'prints_included', type: 'select', label: 'Prints Included', required: false, options: ['None', '5x7 (10 prints)', '8x10 (5 prints)', 'Custom'] },
            ],
          },
          {
            title: 'Payment',
            fields: [
              { name: 'session_fee', type: 'currency', label: 'Session Fee', required: true },
              { name: 'deposit_amount', type: 'currency', label: 'Deposit Amount', required: true },
              { name: 'payment_due', type: 'text', label: 'Final Payment Due', required: true, default: 'Upon delivery' },
            ],
          },
          {
            title: 'Photographer Information',
            fields: [
              { name: 'photographer_name', type: 'text', label: 'Photographer Name', required: true },
              { name: 'photographer_handle', type: 'text', label: 'Social Media Handle', required: false },
              { name: 'data_controller_email', type: 'email', label: 'Contact Email', required: true },
            ],
          },
        ],
      },
    },
  });
  console.log('✅ Created Portrait Template');

  // Create Sample Contracts with various statuses
  console.log('\n📝 Creating Sample Contracts...');

  // Helper function to generate contract numbers
  const generateContractNumber = (index: number) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `KORI-${year}${month}-${String(index).padStart(4, '0')}`;
  };

  // Helper function to get date offset
  const getDateOffset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  // Contract 1: SIGNED (Wedding - John Doe)
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(1) },
    update: {},
    create: {
      contractNumber: generateContractNumber(1),
      title: 'Wedding Photography - John & Sarah',
      clientId: client1.id,
      templateId: weddingTemplate.id,
      status: 'SIGNED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-06-15',
        venue_name: 'Grand Ballroom Hotel',
        total_amount: '5000',
        deposit_amount: '1500',
      },
      signByAt: getDateOffset(180),
      sentAt: getDateOffset(-30),
      viewedAt: getDateOffset(-28),
      signedAt: getDateOffset(-25),
    },
  });
  console.log('✅ Created Contract 1: SIGNED');

  // Contract 2: VIEWED (Wedding - Jane Smith)
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(2) },
    update: {},
    create: {
      contractNumber: generateContractNumber(2),
      title: 'Wedding Photography - Jane & Michael',
      clientId: client2.id,
      templateId: weddingTemplate.id,
      status: 'VIEWED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-07-20',
        venue_name: 'Sunset Beach Resort',
        total_amount: '4500',
        deposit_amount: '1350',
      },
      signByAt: getDateOffset(150),
      sentAt: getDateOffset(-5),
      viewedAt: getDateOffset(-3),
      magicLinkToken: `${Math.random().toString(36).substring(2, 15)}`,
      magicLinkExpiresAt: getDateOffset(150),
    },
  });
  console.log('✅ Created Contract 2: VIEWED');

  // Contract 3: SENT (Portrait - Bob Wilson)
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(3) },
    update: {},
    create: {
      contractNumber: generateContractNumber(3),
      title: 'Corporate Portrait Session - Wilson Inc',
      clientId: client3.id,
      templateId: portraitTemplate.id,
      status: 'SENT',
      createdBy: admin.id,
      bodyHtml: '<h1>Portrait Session Contract</h1><p>Sample contract content...</p>',
      variables: {
        session_date: '2025-05-10',
        session_location: 'Studio Downtown',
      },
      signByAt: getDateOffset(60),
      sentAt: getDateOffset(-2),
      magicLinkToken: `${Math.random().toString(36).substring(2, 15)}`,
      magicLinkExpiresAt: getDateOffset(60),
    },
  });
  console.log('✅ Created Contract 3: SENT');

  // Contract 4: DRAFT
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(4) },
    update: {},
    create: {
      contractNumber: generateContractNumber(4),
      title: 'Wedding Photography - Thompson Wedding',
      clientId: client1.id,
      templateId: weddingTemplate.id,
      status: 'DRAFT',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Draft contract content...</p>',
      variables: {
        event_date: '2025-08-15',
        venue_name: 'Mountain View Lodge',
        total_amount: '6000',
        deposit_amount: '2000',
      },
      signByAt: getDateOffset(120),
    },
  });
  console.log('✅ Created Contract 4: DRAFT');

  // Contract 5: SIGNED (Wedding - Different client)
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(5) },
    update: {},
    create: {
      contractNumber: generateContractNumber(5),
      title: 'Wedding Photography - Anderson Wedding',
      clientId: client2.id,
      templateId: weddingTemplate.id,
      status: 'SIGNED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-09-01',
        venue_name: 'Historic Garden Estate',
        total_amount: '5500',
        deposit_amount: '1650',
      },
      signByAt: getDateOffset(200),
      sentAt: getDateOffset(-45),
      viewedAt: getDateOffset(-40),
      signedAt: getDateOffset(-35),
    },
  });
  console.log('✅ Created Contract 5: SIGNED');

  // Contract 6: VOIDED (using VOIDED status instead of DECLINED)
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(6) },
    update: {},
    create: {
      contractNumber: generateContractNumber(6),
      title: 'Portrait Session - Martinez Family',
      clientId: client3.id,
      templateId: portraitTemplate.id,
      status: 'VOIDED',
      createdBy: admin.id,
      bodyHtml: '<h1>Portrait Session Contract</h1><p>Sample contract content...</p>',
      variables: {
        session_date: '2025-04-20',
        session_location: 'City Park',
      },
      signByAt: getDateOffset(-10),
      sentAt: getDateOffset(-20),
      viewedAt: getDateOffset(-18),
      voidedAt: getDateOffset(-15),
      voidedReason: 'Client chose different photographer',
    },
  });
  console.log('✅ Created Contract 6: VOIDED');

  // Contract 7: EXPIRED
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(7) },
    update: {},
    create: {
      contractNumber: generateContractNumber(7),
      title: 'Wedding Photography - Davis Wedding',
      clientId: client1.id,
      templateId: weddingTemplate.id,
      status: 'EXPIRED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-05-01',
        venue_name: 'Riverside Chapel',
        total_amount: '4800',
        deposit_amount: '1440',
      },
      signByAt: getDateOffset(-5),
      sentAt: getDateOffset(-35),
      viewedAt: getDateOffset(-30),
      magicLinkToken: `${Math.random().toString(36).substring(2, 15)}`,
      magicLinkExpiresAt: getDateOffset(-5),
    },
  });
  console.log('✅ Created Contract 7: EXPIRED');

  // Contract 8: SENT (Recent)
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(8) },
    update: {},
    create: {
      contractNumber: generateContractNumber(8),
      title: 'Wedding Photography - Garcia Wedding',
      clientId: client2.id,
      templateId: weddingTemplate.id,
      status: 'SENT',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-10-12',
        venue_name: 'Coastal Resort',
        total_amount: '5200',
        deposit_amount: '1560',
      },
      signByAt: getDateOffset(90),
      sentAt: getDateOffset(-1),
      magicLinkToken: `${Math.random().toString(36).substring(2, 15)}`,
      magicLinkExpiresAt: getDateOffset(90),
    },
  });
  console.log('✅ Created Contract 8: SENT');

  // Contract 9: DRAFT
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(9) },
    update: {},
    create: {
      contractNumber: generateContractNumber(9),
      title: 'Portrait Session - Lee Family',
      clientId: client3.id,
      templateId: portraitTemplate.id,
      status: 'DRAFT',
      createdBy: admin.id,
      bodyHtml: '<h1>Portrait Session Contract</h1><p>Draft contract content...</p>',
      variables: {
        session_date: '2025-06-05',
        session_location: 'Urban Studio',
      },
      signByAt: getDateOffset(100),
    },
  });
  console.log('✅ Created Contract 9: DRAFT');

  // Contract 10: SIGNED (Recent)
  await prisma.contract.upsert({
    where: { contractNumber: generateContractNumber(10) },
    update: {},
    create: {
      contractNumber: generateContractNumber(10),
      title: 'Wedding Photography - Chen Wedding',
      clientId: client1.id,
      templateId: weddingTemplate.id,
      status: 'SIGNED',
      createdBy: superAdmin.id,
      bodyHtml: '<h1>Wedding Photography Contract</h1><p>Sample contract content...</p>',
      variables: {
        event_date: '2025-11-20',
        venue_name: 'Grand Cathedral',
        total_amount: '6500',
        deposit_amount: '2000',
      },
      signByAt: getDateOffset(220),
      sentAt: getDateOffset(-2),
      viewedAt: getDateOffset(-1),
      signedAt: new Date(),
    },
  });
  console.log('✅ Created Contract 10: SIGNED');

  console.log('\n📊 Contract Summary:');
  console.log('  - Total: 10 contracts');
  console.log('  - SIGNED: 3 contracts');
  console.log('  - VIEWED: 1 contract');
  console.log('  - SENT: 2 contracts');
  console.log('  - DRAFT: 2 contracts');
  console.log('  - VOIDED: 1 contract');
  console.log('  - EXPIRED: 1 contract');

  // ============================================
  // PHASE 3: ENVELOPE SEEDING (Multi-Signature)
  // ============================================
  console.log('\n📬 Creating Multi-Signature Envelopes...');

  // Create a sample PDF file path (would be real in production)
  const generateMagicToken = () =>
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Envelope 1: Sequential signing with 3 signers
  const envelope1 = await prisma.envelope.create({
    data: {
      name: 'Wedding Photography Agreement - Smith Wedding',
      description: 'Multi-party contract requiring signatures from bride, groom, and photographer',
      createdById: superAdmin.id,
      status: 'PENDING',
      signingWorkflow: 'SEQUENTIAL',
      expiresAt: getDateOffset(60),
      sentAt: new Date(),
    },
  });
  console.log('✅ Created Envelope 1 (PENDING, Sequential):', envelope1.id);

  // Create document for envelope
  const document1 = await prisma.document.create({
    data: {
      envelopeId: envelope1.id,
      name: 'Wedding Photography Contract',
      fileName: 'wedding-contract.pdf',
      filePath: '/uploads/documents/wedding-contract-abc123.pdf',
      fileHash: 'sha256_abc123def456',
      fileSize: 245600,
    },
  });
  console.log('✅ Created Document 1:', document1.id);

  // Create signers for sequential workflow
  const signer1 = await prisma.signer.create({
    data: {
      envelopeId: envelope1.id,
      name: 'Sarah Smith',
      email: 'sarah.smith@example.com',
      role: 'BRIDE',
      sequenceNumber: 1, // Must sign first
      status: 'PENDING',
      magicLinkToken: generateMagicToken(),
      magicLinkExpiresAt: getDateOffset(60),
    },
  });
  console.log('✅ Created Signer 1 (sequence 1):', signer1.email);

  const signer2 = await prisma.signer.create({
    data: {
      envelopeId: envelope1.id,
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'GROOM',
      sequenceNumber: 2, // Signs after bride
      status: 'PENDING',
      magicLinkToken: generateMagicToken(),
      magicLinkExpiresAt: getDateOffset(60),
    },
  });
  console.log('✅ Created Signer 2 (sequence 2):', signer2.email);

  const signer3 = await prisma.signer.create({
    data: {
      envelopeId: envelope1.id,
      name: 'Alice Johnson',
      email: 'alice@kori.dev',
      role: 'PHOTOGRAPHER',
      sequenceNumber: 3, // Signs last
      status: 'PENDING',
      magicLinkToken: generateMagicToken(),
      magicLinkExpiresAt: getDateOffset(60),
    },
  });
  console.log('✅ Created Signer 3 (sequence 3):', signer3.email);

  // Create signature records (initially empty)
  await prisma.signature.create({
    data: {
      envelopeId: envelope1.id,
      signerId: signer1.id,
      status: 'PENDING',
    },
  });

  await prisma.signature.create({
    data: {
      envelopeId: envelope1.id,
      signerId: signer2.id,
      status: 'PENDING',
    },
  });

  await prisma.signature.create({
    data: {
      envelopeId: envelope1.id,
      signerId: signer3.id,
      status: 'PENDING',
    },
  });
  console.log('✅ Created 3 Signature records (PENDING)');

  // Create audit logs for envelope
  await prisma.envelopeAuditLog.create({
    data: {
      envelopeId: envelope1.id,
      action: 'ENVELOPE_CREATED',
      actorId: superAdmin.id,
      metadata: {
        name: envelope1.name,
        workflow: 'SEQUENTIAL',
        signerCount: 3,
      },
    },
  });

  await prisma.envelopeAuditLog.create({
    data: {
      envelopeId: envelope1.id,
      action: 'ENVELOPE_SENT',
      actorId: superAdmin.id,
      metadata: {
        sentAt: new Date().toISOString(),
        recipients: [signer1.email, signer2.email, signer3.email],
      },
    },
  });
  console.log('✅ Created Envelope Audit Logs');

  console.log('\n📊 Envelope Summary:');
  console.log('  - Total Envelopes: 1');
  console.log('  - Total Signers: 3 (sequential order)');
  console.log('  - Workflow: Sequential (A→B→C)');
  console.log('  - Status: PENDING');

  // Create Audit Log entries
  await prisma.auditLog.create({
    data: {
      action: 'SEED',
      entityType: 'Database',
      userId: superAdmin.id,
      metadata: {
        message: 'Initial database seed completed with contracts and envelopes',
        timestamp: new Date().toISOString(),
        envelopes: 1,
        signers: 3,
      },
    },
  });
  console.log('\n✅ Created Audit Log entry');

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });