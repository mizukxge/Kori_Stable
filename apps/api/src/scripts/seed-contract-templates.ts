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
          .date-line { display: inline-block; width: 150px; margin-top: 30px; }
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
            {{#if reception_venue}}
            <tr>
              <td><strong>Reception Venue:</strong></td>
              <td>{{reception_venue}}</td>
            </tr>
            {{/if}}
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
            {{#if second_payment}}
            <tr style="background: #f0f0f0;">
              <td><strong>Second Payment (due {{second_payment_date}}):</strong></td>
              <td style="text-align: right;">{{second_payment}}</td>
            </tr>
            {{/if}}
            <tr>
              <td><strong>Final Balance (due {{payment_due_date}}):</strong></td>
              <td style="text-align: right;">{{final_amount}}</td>
            </tr>
          </table>

          <h3>4.2 Payment Methods</h3>
          <p>Payment accepted via bank transfer, credit/debit card, or as otherwise agreed in writing.</p>

          <h3>4.3 Late Payment Policy</h3>
          <p>If final payment is not received by {{payment_due_date}}, delivery of final edited images will be withheld until payment is received in full. A late fee of £{{late_fee_amount | default '50'}} per week may be applied for payments exceeding 30 days overdue.</p>

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
            <li>Photographer retains the right to display images in portfolio, website, and social media (with watermark if requested)</li>
            <li>Images may not be altered, edited, or manipulated without photographer's permission</li>
          </ul>
        </section>

        <section>
          <h2>6. Liability & Limitations</h2>
          <p><strong>Weather & Unforeseen Circumstances:</strong> In case of severe weather preventing outdoor photography, images will be taken at alternative locations or rescheduled to an alternative date.</p>

          <p><strong>Equipment Failure:</strong> The Photographer maintains backup equipment. In the unlikely event of total equipment failure, the Photographer will use professional-grade alternative equipment or provide a pro-rated refund.</p>

          <p><strong>Image Delivery Guarantee:</strong> The Photographer guarantees delivery of a minimum of {{estimated_image_count | minus '50'}} edited images. If fewer are delivered, a pro-rated refund will be provided.</p>
        </section>

        <section class="signature-section">
          <h2>7. Agreement & Signatures</h2>
          <p>By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions of this Wedding Photography Service Agreement, including all incorporated clauses and conditions.</p>

          <div style="margin-top: 40px;">
            <div class="signature-area">
              <strong>Photographer Signature:</strong><br><br>
              <div class="signature-line"></div><br>
              {{photographer_name}}<br>
              <strong>Date:</strong> <span class="date-line" style="border-bottom: 1px solid #000; padding-bottom: 5px;"></span>
            </div>

            <div class="signature-area" style="margin-left: 60px;">
              <strong>Client Signature:</strong><br><br>
              <div class="signature-line"></div><br>
              {{client_name}}<br>
              <strong>Date:</strong> <span class="date-line" style="border-bottom: 1px solid #000; padding-bottom: 5px;"></span>
            </div>
          </div>
        </section>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666;">
          <p><strong>Governing Law:</strong> This agreement is governed by the laws of {{jurisdiction}}.</p>
          <p><strong>Entire Agreement:</strong> This agreement constitutes the entire agreement between the parties and supersedes all prior negotiations and understandings.</p>
          <p style="margin-top: 20px; text-align: center; color: #999;">© {{photographer_name}} | Contract generated {{current_date}}</p>
        </div>
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
          <h1>Brand & Editorial Photography License Agreement</h1>
          <p class="contract-number">Contract No: {{contract_number}}</p>
          <p style="font-size: 12px; margin: 10px 0 0 0;">Effective Date: {{effective_date}}</p>
        </div>

        <section class="parties">
          <h2>1. Parties to Agreement</h2>
          <p>This Brand & Editorial Photography License Agreement ("Agreement") is entered into on {{effective_date}} between:</p>

          <div class="party">
            <p style="margin: 0 0 8px 0;"><strong>Photographer/Licensor:</strong></p>
            {{photographer_name}}<br>
            <strong>Email:</strong> {{data_controller_email}}
          </div>

          <div class="party">
            <p style="margin: 0 0 8px 0;"><strong>Client/Licensee:</strong></p>
            {{client_name}}<br>
            <strong>Email:</strong> {{client_email}}<br>
            <strong>Phone:</strong> {{client_phone}}
          </div>
        </section>

        <section>
          <h2>2. Project Scope</h2>
          <table>
            <tr>
              <td><strong>Project Name:</strong></td>
              <td>{{project_name}}</td>
            </tr>
            <tr>
              <td><strong>Description:</strong></td>
              <td>{{project_description}}</td>
            </tr>
            <tr>
              <td><strong>Shoot Date:</strong></td>
              <td>{{shoot_date}}</td>
            </tr>
            <tr>
              <td><strong>Shoot Location:</strong></td>
              <td>{{shoot_location}}</td>
            </tr>
            <tr>
              <td><strong>Duration:</strong></td>
              <td>{{shoot_duration}} hours</td>
            </tr>
          </table>
        </section>

        <section>
          <h2>3. License Grant & Usage Rights</h2>
          <p>The Photographer grants the Client a {{exclusivity}} license to use the photographs as follows:</p>

          <h3>3.1 License Terms</h3>
          <ul>
            <li><strong>Duration:</strong> {{usage_term}} from the date of delivery</li>
            <li><strong>Territory:</strong> {{usage_territory}}</li>
            <li><strong>Permitted Media:</strong> {{usage_media}}</li>
            <li><strong>Exclusivity Status:</strong> {{exclusivity}}</li>
            {{#if buyout}}
            <li><strong>Copyright Buyout:</strong> Full copyright transfer to Client upon receipt of final payment</li>
            {{/if}}
          </ul>

          <h3>3.2 Usage Restrictions</h3>
          <p>{{#unless buyout}}Unless a copyright buyout has been purchased, {{/unless}}the Client shall:</p>
          <ul>
            <li>Not transfer, sell, sublicense, or assign usage rights to any third party</li>
            <li>Not use images beyond the scope of permitted media, territory, and time period specified herein</li>
            <li>Not modify, edit, or manipulate the images in a manner that misrepresents the Photographer's original work</li>
            <li>Not remove or obscure copyright notices, watermarks, or metadata</li>
            <li>Not use images in any defamatory, illegal, or otherwise objectionable manner</li>
            <li>Provide attribution to {{photographer_name}} when required</li>
          </ul>

          <h3>3.3 Photographer's Rights</h3>
          <ul>
            <li>Photographer retains all copyright and intellectual property rights to the original images</li>
            <li>Photographer retains the right to display images in portfolio, website, social media, and exhibitions (subject to Client confidentiality requests in writing)</li>
            <li>Photographer may use images for self-promotion and marketing purposes</li>
          </ul>
        </section>

        <section>
          <h2>4. Deliverables & Timeline</h2>
          <ul>
            <li>Minimum {{image_count}} professionally edited, high-resolution images</li>
            <li>Format: {{delivery_format}}</li>
            <li>Delivery timeline: {{delivery_weeks}} weeks from shoot date via secure online gallery</li>
            <li>Client receives private gallery with unlimited download access during the license term</li>
            <li>Raw/unedited files not included unless separately negotiated</li>
          </ul>
        </section>

        <section>
          <h2>5. Fees & Payment Terms</h2>

          <h3>5.1 Fee Schedule</h3>
          <table>
            <tr>
              <td><strong>Creative/Shoot Fee:</strong></td>
              <td style="text-align: right;">{{creative_fee}}</td>
            </tr>
            <tr>
              <td><strong>Licensing Fee ({{usage_term}}, {{usage_territory}}):</strong></td>
              <td style="text-align: right;">{{licensing_fee}}</td>
            </tr>
            <tr style="background: #f0f0f0; font-weight: bold;">
              <td><strong>Total Agreement Amount:</strong></td>
              <td style="text-align: right;">{{total_amount}}</td>
            </tr>
          </table>

          <h3>5.2 Payment Schedule</h3>
          <table>
            <tr>
              <td><strong>Deposit ({{deposit_percent}}%) - Due upon signing:</strong></td>
              <td style="text-align: right;">{{creative_fee | percent: deposit_percent}}</td>
            </tr>
            <tr>
              <td><strong>Final Payment - {{payment_terms}}:</strong></td>
              <td style="text-align: right;">Balance due</td>
            </tr>
          </table>

          <h3>5.3 Late Payment</h3>
          <p>Invoices are due {{payment_terms}} from invoice date. Late payments will accrue interest at 1.5% per month or the maximum rate allowed by law, whichever is less.</p>
        </section>

        <section>
          <h2>6. License Renewal & Extensions</h2>
          <p>Upon expiration of the license term ({{usage_term}}), all usage rights terminate. Client may negotiate renewal of usage rights at current market rates.</p>
        </section>

        <section class="signature-section">
          <h2>7. Agreement & Signatures</h2>
          <p>By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions of this Brand & Editorial Photography License Agreement.</p>

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
          <p style="text-align: center; color: #999;">© {{photographer_name}} | Contract generated {{current_date}}</p>
        </div>
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
