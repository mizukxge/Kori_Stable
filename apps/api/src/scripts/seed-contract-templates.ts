import { PrismaClient, DocumentType, EventType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Contract Templates
 *
 * Creates starter contract templates for common photography scenarios
 */

async function main() {
  console.log('🌱 Seeding Contract Templates...\n');

  // Get the first admin user to assign as creator
  const adminUser = await prisma.adminUser.findFirst();

  if (!adminUser) {
    throw new Error('No admin user found. Please run main seed script first (pnpm db:seed).');
  }

  // Get mandatory clause IDs for templates
  const mandatoryClauses = await prisma.clause.findMany({
    where: { mandatory: true },
    select: { id: true },
  });

  const mandatoryClauseIds = mandatoryClauses.map((c) => c.id);

  console.log(`📌 Found ${mandatoryClauseIds.length} mandatory clauses to include in all templates\n`);

  // Template 1: Wedding Photography Contract
  console.log('💒 Creating Wedding Photography Contract Template...');
  const weddingTemplate = await prisma.contractTemplate.upsert({
    where: { name: 'Wedding Photography Contract' },
    update: {},
    create: {
      name: 'Wedding Photography Contract',
      description: 'Comprehensive wedding photography contract with coverage, deliverables, and payment terms',
      type: DocumentType.SERVICE_AGREEMENT,
      eventType: EventType.WEDDING,
      mandatoryClauseIds,
      isActive: true,
      isPublished: true,
      version: 1,
      createdBy: adminUser.id,

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
          {
            title: 'Legal & Compliance',
            fields: [
              { name: 'jurisdiction', type: 'text', label: 'Governing Jurisdiction', required: true, default: 'England and Wales' },
              { name: 'data_retention_years', type: 'number', label: 'Data Retention Period (years)', required: true, default: 6 },
              { name: 'data_controller_email', type: 'email', label: 'Data Controller Email', required: true },
            ],
          },
        ],
      },

      bodyHtml: `
        <div class="contract-header">
          <h1>Wedding Photography Service Agreement</h1>
          <p class="contract-number">Contract No: {{contract_number}}</p>
        </div>

        <section class="parties">
          <h2>1. Parties</h2>
          <p>This Service Agreement ("Agreement") is entered into on {{effective_date}} between:</p>

          <div class="party">
            <strong>Photographer:</strong><br>
            {{photographer_name}}<br>
            {{studio_location}}<br>
            Email: {{data_controller_email}}
          </div>

          <div class="party">
            <strong>Client:</strong><br>
            {{client_name}}<br>
            {{client_email}}<br>
            {{client_phone}}
          </div>
        </section>

        <section class="event-details">
          <h2>2. Event Details</h2>
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
              <td><strong>Ceremony Time:</strong></td>
              <td>{{event_time}}</td>
            </tr>
            <tr>
              <td><strong>Venue:</strong></td>
              <td>{{venue_name}}<br>{{venue_address}}</td>
            </tr>
            {{#if reception_venue}}
            <tr>
              <td><strong>Reception Venue:</strong></td>
              <td>{{reception_venue}}</td>
            </tr>
            {{/if}}
          </table>
        </section>

        <section class="services">
          <h2>3. Services & Coverage</h2>
          <p>The Photographer agrees to provide the following photography services:</p>
          <ul>
            <li><strong>Coverage Hours:</strong> {{coverage_hours}} hours starting at {{coverage_start}}</li>
            <li><strong>Second Shooter:</strong> {{second_shooter}}</li>
            <li><strong>Engagement Session:</strong> {{engagement_session}}</li>
          </ul>

          <h3>3.1 Deliverables</h3>
          <ul>
            <li>Approximately {{estimated_image_count}} professionally edited high-resolution images</li>
            <li>{{sneak_peek_count}} sneak peek images delivered within {{sneak_peek_days}} business days</li>
            <li>Full gallery delivered within {{full_delivery_weeks}} weeks of the wedding date</li>
            <li>Online gallery access for {{gallery_access_days}} days</li>
            <li>Unlimited personal print rights</li>
          </ul>
        </section>

        <section class="payment">
          <h2>4. Payment Terms</h2>
          <table>
            <tr>
              <td><strong>Total Contract Amount:</strong></td>
              <td>{{total_amount}}</td>
            </tr>
            <tr>
              <td><strong>Non-Refundable Deposit:</strong></td>
              <td>{{deposit_amount}} due {{deposit_due_date}}</td>
            </tr>
            {{#if second_payment}}
            <tr>
              <td><strong>Second Payment:</strong></td>
              <td>{{second_payment}} due {{second_payment_date}}</td>
            </tr>
            {{/if}}
            <tr>
              <td><strong>Final Balance:</strong></td>
              <td>{{final_amount}} due {{payment_due_date}}</td>
            </tr>
          </table>

          <p><strong>Payment Methods:</strong> Bank transfer, credit/debit card, or as otherwise agreed in writing.</p>
          <p><strong>Late Payment:</strong> Final image delivery will be withheld until all payments are received in full.</p>
        </section>

        <section class="signature">
          <h2>5. Agreement & Signature</h2>
          <p>By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions of this contract, including all clauses incorporated herein.</p>
        </section>
      `,
    },
  });
  console.log(`  ✅ Created: ${weddingTemplate.name}\n`);

  // Template 2: Brand/Editorial Photography Contract
  console.log('📸 Creating Brand/Editorial Photography Contract Template...');
  const brandTemplate = await prisma.contractTemplate.upsert({
    where: { name: 'Brand & Editorial Photography Contract' },
    update: {},
    create: {
      name: 'Brand & Editorial Photography Contract',
      description: 'Commercial brand and editorial photography with usage rights and licensing terms',
      type: DocumentType.LICENSE_AGREEMENT,
      eventType: EventType.BRAND_EDITORIAL,
      mandatoryClauseIds,
      isActive: true,
      isPublished: true,
      version: 1,
      createdBy: adminUser.id,

      variablesSchema: {
        sections: [
          {
            title: 'Project Details',
            fields: [
              { name: 'project_name', type: 'text', label: 'Project Name', required: true },
              { name: 'project_description', type: 'textarea', label: 'Project Description', required: true },
              { name: 'shoot_date', type: 'date', label: 'Shoot Date', required: true },
              { name: 'shoot_location', type: 'text', label: 'Shoot Location', required: true },
              { name: 'shoot_duration', type: 'number', label: 'Shoot Duration (hours)', required: true },
            ],
          },
          {
            title: 'Usage & Licensing',
            fields: [
              { name: 'usage_term', type: 'select', label: 'License Duration', required: true, options: ['1 Year', '2 Years', '3 Years', 'Perpetual'] },
              { name: 'usage_territory', type: 'select', label: 'Geographic Territory', required: true, options: ['UK Only', 'Europe', 'Worldwide'] },
              { name: 'usage_media', type: 'multiselect', label: 'Permitted Media', required: true, options: ['Website', 'Social Media', 'Print Advertising', 'Email Marketing', 'Packaging', 'Editorial'] },
              { name: 'exclusivity', type: 'select', label: 'Exclusivity', required: true, options: ['Non-Exclusive', 'Category Exclusive', 'Fully Exclusive'] },
              { name: 'buyout', type: 'select', label: 'Copyright Buyout', required: false, options: ['No', 'Yes'] },
            ],
          },
          {
            title: 'Deliverables',
            fields: [
              { name: 'image_count', type: 'number', label: 'Minimum Edited Images', required: true },
              { name: 'delivery_format', type: 'text', label: 'Delivery Format', required: true, default: 'High-res JPEG (300 DPI)' },
              { name: 'delivery_weeks', type: 'number', label: 'Delivery Timeline (weeks)', required: true, default: 2 },
            ],
          },
          {
            title: 'Payment Terms',
            fields: [
              { name: 'creative_fee', type: 'currency', label: 'Creative Fee', required: true },
              { name: 'licensing_fee', type: 'currency', label: 'Licensing Fee', required: true },
              { name: 'total_amount', type: 'currency', label: 'Total Amount', required: true },
              { name: 'deposit_percent', type: 'number', label: 'Deposit Percentage', required: true, default: 50 },
              { name: 'payment_terms', type: 'text', label: 'Payment Terms', required: true, default: 'NET 30' },
            ],
          },
          {
            title: 'Photographer Information',
            fields: [
              { name: 'photographer_name', type: 'text', label: 'Photographer Name', required: true },
              { name: 'data_controller_email', type: 'email', label: 'Contact Email', required: true },
            ],
          },
          {
            title: 'Legal',
            fields: [
              { name: 'jurisdiction', type: 'text', label: 'Governing Jurisdiction', required: true, default: 'England and Wales' },
              { name: 'data_retention_years', type: 'number', label: 'Data Retention (years)', required: true, default: 6 },
            ],
          },
        ],
      },

      bodyHtml: `
        <div class="contract-header">
          <h1>Brand & Editorial Photography License Agreement</h1>
          <p class="contract-number">Contract No: {{contract_number}}</p>
        </div>

        <section class="parties">
          <h2>1. Parties</h2>
          <p>This License Agreement is entered into on {{effective_date}} between:</p>

          <div class="party">
            <strong>Photographer/Licensor:</strong><br>
            {{photographer_name}}<br>
            Email: {{data_controller_email}}
          </div>

          <div class="party">
            <strong>Client/Licensee:</strong><br>
            {{client_name}}<br>
            {{client_email}}<br>
            {{client_phone}}
          </div>
        </section>

        <section class="project">
          <h2>2. Project Scope</h2>
          <p><strong>Project Name:</strong> {{project_name}}</p>
          <p><strong>Description:</strong> {{project_description}}</p>
          <p><strong>Shoot Date:</strong> {{shoot_date}}</p>
          <p><strong>Location:</strong> {{shoot_location}}</p>
          <p><strong>Duration:</strong> {{shoot_duration}} hours</p>
        </section>

        <section class="licensing">
          <h2>3. License Grant & Usage Rights</h2>
          <p>The Photographer grants the Client a {{exclusivity}} license to use the photographs subject to the following terms:</p>
          <ul>
            <li><strong>Duration:</strong> {{usage_term}} from the date of delivery</li>
            <li><strong>Territory:</strong> {{usage_territory}}</li>
            <li><strong>Permitted Media:</strong> {{usage_media}}</li>
            <li><strong>Exclusivity:</strong> {{exclusivity}}</li>
            {{#if buyout}}
            <li><strong>Copyright Buyout:</strong> Full copyright transfer upon final payment</li>
            {{/if}}
          </ul>

          <h3>3.1 Usage Restrictions</h3>
          <p>Unless a copyright buyout has been purchased, the Client may not:</p>
          <ul>
            <li>Transfer, sell, or sublicense the images to third parties</li>
            <li>Use the images beyond the scope of permitted media and territory</li>
            <li>Modify the images in a way that misrepresents the Photographer's work</li>
            <li>Remove copyright notices or metadata</li>
          </ul>
        </section>

        <section class="deliverables">
          <h2>4. Deliverables</h2>
          <p>The Photographer will deliver:</p>
          <ul>
            <li>Minimum {{image_count}} professionally edited images</li>
            <li>Format: {{delivery_format}}</li>
            <li>Delivery timeline: {{delivery_weeks}} weeks from shoot date</li>
            <li>Via secure online gallery with download access</li>
          </ul>
        </section>

        <section class="payment">
          <h2>5. Fees & Payment</h2>
          <table>
            <tr>
              <td><strong>Creative Fee:</strong></td>
              <td>{{creative_fee}}</td>
            </tr>
            <tr>
              <td><strong>Licensing Fee:</strong></td>
              <td>{{licensing_fee}}</td>
            </tr>
            <tr>
              <td><strong>Total Amount:</strong></td>
              <td>{{total_amount}}</td>
            </tr>
            <tr>
              <td><strong>Deposit ({{deposit_percent}}%):</strong></td>
              <td>Due upon contract signing</td>
            </tr>
            <tr>
              <td><strong>Final Payment:</strong></td>
              <td>{{payment_terms}} from invoice date</td>
            </tr>
          </table>
        </section>

        <section class="signature">
          <h2>6. Agreement & Signature</h2>
          <p>By signing below, both parties acknowledge and agree to all terms of this license agreement.</p>
        </section>
      `,
    },
  });
  console.log(`  ✅ Created: ${brandTemplate.name}\n`);

  // Template 3: Portrait Session Agreement
  console.log('👤 Creating Portrait Session Agreement Template...');
  const portraitTemplate = await prisma.contractTemplate.upsert({
    where: { name: 'Portrait Session Agreement' },
    update: {},
    create: {
      name: 'Portrait Session Agreement',
      description: 'Standard portrait photography session agreement for individuals and families',
      type: DocumentType.SERVICE_AGREEMENT,
      eventType: EventType.PORTRAIT,
      mandatoryClauseIds,
      isActive: true,
      isPublished: true,
      version: 1,
      createdBy: adminUser.id,

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
          {
            title: 'Legal',
            fields: [
              { name: 'jurisdiction', type: 'text', label: 'Jurisdiction', required: true, default: 'England and Wales' },
              { name: 'data_retention_years', type: 'number', label: 'Data Retention (years)', required: true, default: 6 },
            ],
          },
        ],
      },

      bodyHtml: `
        <div class="contract-header">
          <h1>Portrait Photography Session Agreement</h1>
          <p class="contract-number">Contract No: {{contract_number}}</p>
        </div>

        <section class="parties">
          <h2>1. Parties</h2>
          <div class="party">
            <strong>Photographer:</strong> {{photographer_name}}<br>
            <strong>Client:</strong> {{client_name}}<br>
            <strong>Email:</strong> {{client_email}}
          </div>
        </section>

        <section class="session">
          <h2>2. Session Details</h2>
          <table>
            <tr><td><strong>Type:</strong></td><td>{{session_type}}</td></tr>
            <tr><td><strong>Date:</strong></td><td>{{session_date}} at {{session_time}}</td></tr>
            <tr><td><strong>Location:</strong></td><td>{{session_location}}</td></tr>
            <tr><td><strong>Duration:</strong></td><td>Up to {{session_duration}} hour(s)</td></tr>
          </table>
        </section>

        <section class="package">
          <h2>3. Package: {{package_name}}</h2>
          <ul>
            <li>{{edited_images}} professionally edited high-resolution digital images</li>
            <li>Delivery within {{delivery_days}} business days</li>
            <li>Online gallery for image selection and download</li>
            {{#if prints_included}}
            <li>{{prints_included}}</li>
            {{/if}}
            <li>Unlimited personal print rights</li>
          </ul>
        </section>

        <section class="payment">
          <h2>4. Investment</h2>
          <table>
            <tr><td><strong>Session Fee:</strong></td><td>{{session_fee}}</td></tr>
            <tr><td><strong>Deposit:</strong></td><td>{{deposit_amount}} (secures booking)</td></tr>
            <tr><td><strong>Balance:</strong></td><td>{{payment_due}}</td></tr>
          </table>
        </section>

        <section class="signature">
          <h2>5. Agreement</h2>
          <p>By signing below, both parties agree to the terms of this portrait session agreement.</p>
        </section>
      `,
    },
  });
  console.log(`  ✅ Created: ${portraitTemplate.name}\n`);

  // Template 4: Event Photography Contract
  console.log('🎉 Creating Event Photography Contract Template...');
  const eventTemplate = await prisma.contractTemplate.upsert({
    where: { name: 'Event Photography Contract' },
    update: {},
    create: {
      name: 'Event Photography Contract',
      description: 'Corporate and social event photography coverage agreement',
      type: DocumentType.SERVICE_AGREEMENT,
      eventType: EventType.EVENT,
      mandatoryClauseIds,
      isActive: true,
      isPublished: true,
      version: 1,
      createdBy: adminUser.id,

      variablesSchema: {
        sections: [
          {
            title: 'Event Information',
            fields: [
              { name: 'event_name', type: 'text', label: 'Event Name', required: true },
              { name: 'event_type', type: 'select', label: 'Event Type', required: true, options: ['Corporate Event', 'Conference', 'Gala', 'Private Party', 'Product Launch', 'Other'] },
              { name: 'event_date', type: 'date', label: 'Event Date', required: true },
              { name: 'event_venue', type: 'text', label: 'Venue', required: true },
              { name: 'coverage_hours', type: 'number', label: 'Coverage Hours', required: true },
            ],
          },
          {
            title: 'Deliverables',
            fields: [
              { name: 'deliverable_type', type: 'select', label: 'Deliverable Type', required: true, options: ['Edited Images Only', 'Edited + Same-Day Highlights', 'Full Event Coverage'] },
              { name: 'image_count', type: 'number', label: 'Approx. Image Count', required: true },
              { name: 'delivery_timeline', type: 'text', label: 'Delivery Timeline', required: true, default: '7 business days' },
            ],
          },
          {
            title: 'Payment',
            fields: [
              { name: 'total_fee', type: 'currency', label: 'Total Fee', required: true },
              { name: 'deposit_amount', type: 'currency', label: 'Deposit', required: true },
              { name: 'payment_terms', type: 'text', label: 'Payment Terms', required: true, default: 'NET 30' },
            ],
          },
          {
            title: 'Photographer',
            fields: [
              { name: 'photographer_name', type: 'text', label: 'Photographer Name', required: true },
              { name: 'data_controller_email', type: 'email', label: 'Email', required: true },
            ],
          },
          {
            title: 'Legal',
            fields: [
              { name: 'jurisdiction', type: 'text', label: 'Jurisdiction', required: true, default: 'England and Wales' },
              { name: 'data_retention_years', type: 'number', label: 'Data Retention (years)', required: true, default: 6 },
            ],
          },
        ],
      },

      bodyHtml: `
        <div class="contract-header">
          <h1>Event Photography Service Agreement</h1>
          <p class="contract-number">Contract No: {{contract_number}}</p>
        </div>

        <section class="parties">
          <h2>1. Parties</h2>
          <p><strong>Photographer:</strong> {{photographer_name}}</p>
          <p><strong>Client:</strong> {{client_name}}</p>
        </section>

        <section class="event">
          <h2>2. Event Details</h2>
          <p><strong>Event:</strong> {{event_name}} ({{event_type}})</p>
          <p><strong>Date:</strong> {{event_date}}</p>
          <p><strong>Venue:</strong> {{event_venue}}</p>
          <p><strong>Coverage:</strong> {{coverage_hours}} hours</p>
        </section>

        <section class="deliverables">
          <h2>3. Deliverables</h2>
          <ul>
            <li>{{deliverable_type}}</li>
            <li>Approximately {{image_count}} edited images</li>
            <li>Delivered within {{delivery_timeline}}</li>
          </ul>
        </section>

        <section class="payment">
          <h2>4. Fees</h2>
          <p><strong>Total:</strong> {{total_fee}}</p>
          <p><strong>Deposit:</strong> {{deposit_amount}}</p>
          <p><strong>Terms:</strong> {{payment_terms}}</p>
        </section>
      `,
    },
  });
  console.log(`  ✅ Created: ${eventTemplate.name}\n`);

  const templateCount = await prisma.contractTemplate.count();
  console.log(`🎉 Contract Templates Seeded Successfully!`);
  console.log(`   📊 Total Templates: ${templateCount}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding contract templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
