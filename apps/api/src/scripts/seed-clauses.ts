import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Clause Library
 *
 * Creates mandatory and optional contract clauses for the template designer
 */

const MANDATORY_CLAUSES = [
  {
    slug: 'liability-indemnity',
    title: 'Liability & Indemnity',
    bodyHtml: `
      <h3>Liability & Indemnity</h3>
      <p>The Photographer shall not be liable for any indirect, consequential, or special damages arising from the provision of photography services. The total liability of the Photographer shall not exceed the total fees paid under this contract.</p>
      <p>The Client agrees to indemnify and hold harmless the Photographer from any claims, demands, or causes of action arising from the Client's use of the photographs beyond the scope of this agreement.</p>
      <p><strong>Equipment Failure:</strong> While every effort is made to ensure reliability, the Photographer is not liable for equipment malfunction or failure that prevents completion of services, provided reasonable backup measures are in place.</p>
    `,
    tags: ['legal', 'mandatory', 'liability'],
    mandatory: true,
  },
  {
    slug: 'ip-usage-rights',
    title: 'Intellectual Property & Usage Rights',
    bodyHtml: `
      <h3>Intellectual Property & Usage Rights</h3>
      <p><strong>Copyright:</strong> All photographs remain the intellectual property and copyright of the Photographer. The Client is granted a non-exclusive license to use the photographs as specified in this agreement.</p>
      <p><strong>Permitted Use:</strong> Unless otherwise stated, the Client may use the photographs for personal, non-commercial purposes including social media, printing, and sharing with family and friends.</p>
      <p><strong>Attribution:</strong> The Client agrees to provide photo credit to {{photographer_name}} when publishing photographs online or in print where credits are typically given.</p>
      <p><strong>Prohibited Use:</strong> The Client may not sell, license, sublicense, or otherwise commercially exploit the photographs without express written permission from the Photographer.</p>
    `,
    tags: ['legal', 'mandatory', 'copyright', 'licensing'],
    mandatory: true,
  },
  {
    slug: 'payment-cancellation',
    title: 'Payment Terms & Cancellation Policy',
    bodyHtml: `
      <h3>Payment Terms</h3>
      <p><strong>Deposit:</strong> A non-refundable deposit of {{deposit_amount}} is required to secure the booking date. This deposit will be applied to the total contract amount.</p>
      <p><strong>Final Payment:</strong> The remaining balance of {{final_amount}} is due {{payment_due_date}}.</p>
      <p><strong>Late Payment:</strong> Invoices not paid within {{late_payment_days}} days of the due date will incur a late fee of {{late_fee_percentage}}% per month. The Photographer reserves the right to withhold delivery of photographs until all payments are received.</p>

      <h3>Cancellation Policy</h3>
      <p><strong>By Client:</strong></p>
      <ul>
        <li>More than {{cancellation_tier1_days}} days before: Deposit forfeited, no further charges</li>
        <li>{{cancellation_tier2_days}}-{{cancellation_tier1_days}} days before: {{cancellation_tier2_percent}}% of total fee charged</li>
        <li>Less than {{cancellation_tier2_days}} days before: {{cancellation_tier3_percent}}% of total fee charged</li>
      </ul>
      <p><strong>By Photographer:</strong> If the Photographer must cancel due to illness, emergency, or other unavoidable circumstances, all fees paid will be refunded in full. The Photographer will make reasonable efforts to provide a replacement photographer.</p>
    `,
    tags: ['legal', 'mandatory', 'payment', 'cancellation'],
    mandatory: true,
  },
  {
    slug: 'force-majeure',
    title: 'Force Majeure',
    bodyHtml: `
      <h3>Force Majeure</h3>
      <p>Neither party shall be liable for failure to perform obligations under this contract due to circumstances beyond their reasonable control, including but not limited to:</p>
      <ul>
        <li>Acts of God (natural disasters, severe weather, pandemics)</li>
        <li>War, terrorism, civil unrest, or government action</li>
        <li>Strikes or labor disputes</li>
        <li>Serious illness or injury</li>
        <li>Equipment theft or catastrophic failure despite reasonable precautions</li>
      </ul>
      <p>In the event of force majeure, the affected party shall notify the other party as soon as reasonably possible. Both parties agree to work in good faith to reschedule services or arrange an alternative solution. If rescheduling is not possible, a pro-rata refund will be issued for services not rendered.</p>
    `,
    tags: ['legal', 'mandatory', 'force-majeure'],
    mandatory: true,
  },
  {
    slug: 'governing-law-jurisdiction',
    title: 'Governing Law & Jurisdiction',
    bodyHtml: `
      <h3>Governing Law & Jurisdiction</h3>
      <p>This contract shall be governed by and construed in accordance with the laws of {{jurisdiction}}, without regard to its conflict of law provisions.</p>
      <p>Any disputes arising from this contract shall be resolved through:</p>
      <ol>
        <li><strong>Negotiation:</strong> The parties agree to first attempt to resolve disputes through good-faith negotiation.</li>
        <li><strong>Mediation:</strong> If negotiation fails, disputes will be submitted to mediation before a mutually agreed mediator.</li>
        <li><strong>Legal Action:</strong> If mediation is unsuccessful, either party may pursue legal action in the courts of {{jurisdiction}}.</li>
      </ol>
      <p><strong>Severability:</strong> If any provision of this contract is found to be unenforceable, the remaining provisions shall remain in full force and effect.</p>
    `,
    tags: ['legal', 'mandatory', 'jurisdiction'],
    mandatory: true,
  },
  {
    slug: 'data-protection-gdpr',
    title: 'Data Protection & Privacy (GDPR)',
    bodyHtml: `
      <h3>Data Protection & Privacy</h3>
      <p>The Photographer is committed to protecting the Client's personal data in accordance with the General Data Protection Regulation (GDPR) and applicable data protection laws.</p>

      <p><strong>Data Collected:</strong> The Photographer collects and processes the following personal data:</p>
      <ul>
        <li>Contact information (name, email, phone, address)</li>
        <li>Payment information</li>
        <li>Event details and preferences</li>
        <li>Photographs and videos containing the Client's likeness or property</li>
      </ul>

      <p><strong>Legal Basis:</strong> Data is processed on the basis of contractual necessity and legitimate business interest.</p>

      <p><strong>Data Retention:</strong> Personal data will be retained for {{data_retention_years}} years for legal and accounting purposes, after which it will be securely deleted.</p>

      <p><strong>Your Rights:</strong> You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data (subject to legal retention requirements)</li>
        <li>Object to processing or request restriction</li>
        <li>Data portability</li>
      </ul>

      <p>To exercise these rights, contact: {{data_controller_email}}</p>
    `,
    tags: ['legal', 'mandatory', 'gdpr', 'privacy', 'data-protection'],
    mandatory: true,
  },
];

const OPTIONAL_CLAUSES = [
  {
    slug: 'portfolio-usage',
    title: 'Portfolio & Marketing Usage',
    bodyHtml: `
      <h3>Portfolio & Marketing Usage</h3>
      <p>The Client grants the Photographer permission to use photographs from this session for:</p>
      <ul>
        <li>Portfolio display on the Photographer's website and in printed portfolios</li>
        <li>Social media marketing (Instagram, Facebook, Pinterest, etc.)</li>
        <li>Blog posts and promotional materials</li>
        <li>Submissions to publications, competitions, and industry awards</li>
        <li>Educational workshops and presentations</li>
      </ul>
      <p>The Client may request that certain images be excluded from public marketing use by notifying the Photographer in writing within {{portfolio_opt_out_days}} days of delivery.</p>
    `,
    tags: ['optional', 'marketing', 'portfolio'],
    mandatory: false,
  },
  {
    slug: 'social-media-usage',
    title: 'Social Media Guidelines',
    bodyHtml: `
      <h3>Social Media Guidelines</h3>
      <p><strong>Photographer's Usage:</strong> The Photographer may share up to {{social_share_count}} images from the session on social media platforms with photo credit.</p>
      <p><strong>Client's Usage:</strong> The Client is encouraged to share photographs on personal social media accounts with credit to {{photographer_handle}}.</p>
      <p><strong>Third-Party Sharing:</strong> If third parties (wedding guests, vendors, etc.) request to use images, they must obtain permission from the Photographer and provide appropriate credit.</p>
      <p><strong>Embargo Period:</strong> The Client agrees not to share images publicly until {{embargo_date}} to allow the Photographer first-share privileges.</p>
    `,
    tags: ['optional', 'social-media', 'marketing'],
    mandatory: false,
  },
  {
    slug: 'reschedule-policy',
    title: 'Rescheduling Policy',
    bodyHtml: `
      <h3>Rescheduling Policy</h3>
      <p>The Client may reschedule the session under the following terms:</p>
      <ul>
        <li><strong>First Reschedule ({{reschedule_tier1_days}}+ days notice):</strong> No fee, subject to photographer availability</li>
        <li><strong>Second Reschedule ({{reschedule_tier2_days}}+ days notice):</strong> {{reschedule_fee}} rescheduling fee</li>
        <li><strong>Short Notice (less than {{reschedule_tier2_days}} days):</strong> {{short_notice_reschedule_fee}} fee and subject to availability</li>
      </ul>
      <p>Rescheduling is subject to the Photographer's availability. If a mutually agreeable date cannot be found within {{reschedule_window_months}} months, the contract may be terminated and the deposit forfeited.</p>
    `,
    tags: ['optional', 'rescheduling', 'flexibility'],
    mandatory: false,
  },
  {
    slug: 'weather-contingency',
    title: 'Weather Contingency (Outdoor Sessions)',
    bodyHtml: `
      <h3>Weather Contingency</h3>
      <p>For outdoor photography sessions, weather conditions may affect scheduling:</p>
      <p><strong>Unfavorable Weather:</strong> If weather conditions (heavy rain, snow, extreme cold/heat, dangerous wind) make outdoor photography unsafe or impractical, the Photographer reserves the right to:</p>
      <ul>
        <li>Postpone the session to the next available date (no additional fee)</li>
        <li>Move to an indoor backup location if available</li>
        <li>Proceed if the Client insists, acknowledging that results may be compromised</li>
      </ul>
      <p><strong>Rain Backup Date:</strong> For weddings and critical events, the Photographer will have backup plans for inclement weather. A complimentary backup date of {{backup_date}} is held for rescheduling due to extreme weather (subject to {{weather_notice_hours}} hours notice).</p>
    `,
    tags: ['optional', 'weather', 'outdoor', 'contingency'],
    mandatory: false,
  },
  {
    slug: 'equipment-failure',
    title: 'Equipment Failure & Backup Protocol',
    bodyHtml: `
      <h3>Equipment Failure & Backup Protocol</h3>
      <p>The Photographer maintains professional-grade equipment and follows industry best practices for reliability:</p>
      <ul>
        <li>All camera bodies have immediate backup replacements on-site</li>
        <li>Critical lenses and lighting equipment are duplicated</li>
        <li>Memory cards are backed up in real-time or immediately after the session</li>
        <li>All equipment is regularly serviced and tested</li>
      </ul>
      <p><strong>Equipment Failure Clause:</strong> In the unlikely event that equipment failure results in complete loss of images despite backup protocols, liability is limited to a full refund of fees paid. The Photographer is not liable for consequential damages arising from equipment malfunction.</p>
    `,
    tags: ['optional', 'equipment', 'backup', 'reliability'],
    mandatory: false,
  },
  {
    slug: 'copyright-transfer',
    title: 'Copyright Transfer (Buyout)',
    bodyHtml: `
      <h3>Copyright Transfer</h3>
      <p><strong>Full Copyright Transfer:</strong> Upon receipt of full payment, the Photographer transfers all copyright and intellectual property rights to the Client for the photographs delivered under this contract.</p>
      <p>The Client shall have the exclusive right to reproduce, distribute, display, license, and create derivative works from the photographs without restriction.</p>
      <p><strong>Photographer Retention:</strong> The Photographer retains the right to keep copies of the photographs for archival purposes but agrees not to use them for any commercial or marketing purposes without the Client's express written consent.</p>
      <p><strong>Consideration:</strong> This copyright transfer is granted in consideration of the additional buyout fee of {{copyright_buyout_fee}}, payable in addition to the standard session fee.</p>
      <p><em>Note: This clause is mutually exclusive with standard usage rights and portfolio clauses.</em></p>
    `,
    tags: ['optional', 'copyright', 'buyout', 'exclusive'],
    mandatory: false,
  },
  {
    slug: 'exclusive-photographer',
    title: 'Exclusive Photographer Agreement',
    bodyHtml: `
      <h3>Exclusive Photographer Agreement</h3>
      <p>The Client agrees that the Photographer is the exclusive professional photographer for this event. The Client agrees to:</p>
      <ul>
        <li>Inform all guests that the Photographer has exclusive rights to capture professional images</li>
        <li>Request that guests refrain from interfering with the Photographer's work (e.g., standing in aisles during ceremony, blocking shots)</li>
        <li>Ensure that no other professional photographers or videographers are hired without prior written consent</li>
      </ul>
      <p><strong>Unplugged Ceremony Option:</strong> The Client may request an "unplugged ceremony" where guests are asked to put away devices during the ceremony to allow unobstructed professional photography.</p>
      <p>The Photographer will work respectfully with other vendors (videographers, coordinators) to ensure all parties can perform their duties effectively.</p>
    `,
    tags: ['optional', 'exclusive', 'wedding', 'event'],
    mandatory: false,
  },
  {
    slug: 'image-delivery-timeline',
    title: 'Image Delivery Timeline',
    bodyHtml: `
      <h3>Image Delivery Timeline</h3>
      <p><strong>Sneak Peek:</strong> A selection of {{sneak_peek_count}} edited images will be delivered within {{sneak_peek_days}} business days for social media sharing and immediate enjoyment.</p>
      <p><strong>Full Gallery Delivery:</strong> The complete gallery of edited images will be delivered within {{full_delivery_weeks}} weeks of the event date.</p>
      <p><strong>Delivery Method:</strong> Images will be delivered via a password-protected online gallery accessible for {{gallery_access_days}} days. Clients are responsible for downloading images within this timeframe. Extended access is available for an additional fee of {{extended_access_fee}}.</p>
      <p><strong>Rush Delivery:</strong> Expedited delivery in {{rush_delivery_days}} business days is available for an additional fee of {{rush_fee}}. This must be requested at the time of booking.</p>
      <p><strong>Delays:</strong> The Photographer will make every effort to meet delivery timelines. Delays due to illness, equipment failure, or force majeure events may extend delivery times. Clients will be notified promptly of any anticipated delays.</p>
    `,
    tags: ['optional', 'delivery', 'timeline', 'gallery'],
    mandatory: false,
  },
  {
    slug: 'editing-style',
    title: 'Editing Style & Retouching',
    bodyHtml: `
      <h3>Editing Style & Retouching</h3>
      <p><strong>Photographer's Artistic Style:</strong> All delivered images are edited in the Photographer's signature style, which includes color correction, exposure adjustment, cropping, and creative enhancements as appropriate. The Client has viewed the Photographer's portfolio and agrees to the established editing aesthetic.</p>
      <p><strong>Basic Retouching Included:</strong> Light skin retouching (blemish removal, minor skin smoothing) is included for all close-up portraits at the Photographer's discretion.</p>
      <p><strong>Advanced Retouching:</strong> Extensive retouching requests (body reshaping, background removal, compositing, etc.) are available at {{retouching_hourly_rate}}/hour with a minimum charge of {{retouching_minimum}}.</p>
      <p><strong>Raw Files:</strong> Unedited RAW files are not included. RAW file access is available for an additional fee of {{raw_files_fee}}. RAW files require specialized software and knowledge to process.</p>
      <p><strong>Filter/Preset Requests:</strong> The Photographer reserves the right to decline requests for third-party filters, presets, or editing styles that do not align with the Photographer's brand and artistic vision.</p>
    `,
    tags: ['optional', 'editing', 'retouching', 'style'],
    mandatory: false,
  },
  {
    slug: 'second-shooter',
    title: 'Second Shooter / Assistant',
    bodyHtml: `
      <h3>Second Shooter / Assistant</h3>
      <p><strong>Second Shooter Included:</strong> For events longer than {{second_shooter_hours}} hours or as specified in this contract, a professional second shooter will be provided to ensure comprehensive coverage.</p>
      <p><strong>Second Shooter Responsibilities:</strong></p>
      <ul>
        <li>Capture alternative angles and candid moments</li>
        <li>Cover simultaneous events (e.g., bride and groom preparation)</li>
        <li>Provide backup coverage in case of primary photographer emergency</li>
      </ul>
      <p><strong>Image Ownership:</strong> All images captured by the second shooter become the property of the lead Photographer and are subject to the same editing and delivery process. The second shooter's images will be seamlessly integrated into the final gallery.</p>
      <p><strong>Copyright:</strong> Images captured by the second shooter are works-for-hire and all rights transfer to the lead Photographer.</p>
    `,
    tags: ['optional', 'second-shooter', 'coverage', 'team'],
    mandatory: false,
  },
  {
    slug: 'raw-file-policy',
    title: 'RAW File Policy',
    bodyHtml: `
      <h3>RAW File Policy</h3>
      <p><strong>Standard Delivery:</strong> This contract includes delivery of professionally edited, high-resolution JPEG images only. RAW files are considered the Photographer's working files and are not part of standard deliverables.</p>
      <p><strong>RAW File Purchase:</strong> RAW files may be purchased for an additional fee of {{raw_files_fee}}. This fee includes:</p>
      <ul>
        <li>Delivery of all RAW files from the session (unedited)</li>
        <li>A non-exclusive license to edit and use the RAW files</li>
        <li>Basic instruction guide for working with RAW files</li>
      </ul>
      <p><strong>Important Disclaimers:</strong></p>
      <ul>
        <li>RAW files require specialized software (Adobe Lightroom, Photoshop, Capture One, etc.)</li>
        <li>RAW files are unedited and will not match the quality of professionally edited images</li>
        <li>The Photographer provides no support for editing RAW files</li>
        <li>Copyright and usage terms in this contract still apply to all derivative works</li>
      </ul>
      <p>RAW file delivery does not include refunds or discounts on professional editing services.</p>
    `,
    tags: ['optional', 'raw-files', 'technical'],
    mandatory: false,
  },
  {
    slug: 'print-rights',
    title: 'Print Rights & Physical Products',
    bodyHtml: `
      <h3>Print Rights & Physical Products</h3>
      <p><strong>Print Release:</strong> The Client is granted unlimited personal print rights for all delivered images. This includes:</p>
      <ul>
        <li>Professional printing through any lab or service</li>
        <li>Personal printing at home or retail locations</li>
        <li>Canvas, metal, acrylic, and other print mediums</li>
        <li>Photo books, albums, and wall displays</li>
      </ul>
      <p><strong>Photographer Print Services:</strong> The Photographer offers professional print services including:</p>
      <ul>
        <li>Fine art prints on archival paper</li>
        <li>Canvas wraps and framed prints</li>
        <li>Custom-designed albums and photo books</li>
        <li>Specialty products (metal prints, acrylic blocks, etc.)</li>
      </ul>
      <p>Print orders through the Photographer include color correction and quality assurance. A print catalog with pricing is available upon request.</p>
      <p><strong>Commercial Print Restriction:</strong> Images may not be used for commercial product sales, stock photography, or licensed printing without express written permission and appropriate licensing fees.</p>
    `,
    tags: ['optional', 'print-rights', 'products', 'licensing'],
    mandatory: false,
  },
  {
    slug: 'travel-accommodation',
    title: 'Travel & Accommodation',
    bodyHtml: `
      <h3>Travel & Accommodation</h3>
      <p><strong>Local Coverage:</strong> Photography services within {{local_radius}} miles of {{studio_location}} are included in the contract price.</p>
      <p><strong>Travel Fees:</strong> For events beyond the local coverage area:</p>
      <ul>
        <li>{{mileage_rate}} per mile for travel between {{local_radius}}-{{extended_radius}} miles</li>
        <li>Day rate of {{travel_day_rate}} for destinations beyond {{extended_radius}} miles</li>
        <li>Reimbursement for tolls, parking, and other travel expenses</li>
      </ul>
      <p><strong>Accommodation:</strong> For events requiring overnight stays:</p>
      <ul>
        <li>Client provides hotel accommodation for the Photographer and second shooter (if applicable) at a minimum {{hotel_star_rating}}-star hotel within {{hotel_distance}} miles of the venue</li>
        <li>Check-in available no later than {{hotel_checkin_time}} on the day before the event</li>
        <li>Alternative: Client may provide reimbursement of up to {{hotel_reimbursement_max}} per night per person</li>
      </ul>
      <p><strong>Meals:</strong> For full-day events ({{full_day_hours}}+ hours), the Client agrees to provide vendor meals for the photography team or a meal allowance of {{meal_allowance}} per person.</p>
    `,
    tags: ['optional', 'travel', 'accommodation', 'expenses'],
    mandatory: false,
  },
  {
    slug: 'model-release-integration',
    title: 'Model Release Integration',
    bodyHtml: `
      <h3>Model Release Integration</h3>
      <p>By signing this contract, the Client grants permission for the Photographer to use photographs containing the Client's likeness or property for the purposes outlined in the "Portfolio & Marketing Usage" clause.</p>
      <p><strong>Scope of Release:</strong></p>
      <ul>
        <li>The Photographer may use the Client's name, likeness, and biographical information in connection with the photographs</li>
        <li>Usage is limited to non-commercial purposes (portfolio, marketing, education) unless otherwise agreed in writing</li>
        <li>The Client waives any right to royalties or compensation for such use</li>
        <li>This release extends to the Photographer's heirs, assigns, and licensees</li>
      </ul>
      <p><strong>Opt-Out:</strong> The Client may opt out of model release provisions by notifying the Photographer in writing. Opt-out may result in additional fees or contract adjustments.</p>
      <p><strong>Minors:</strong> For sessions including minors, the Client warrants that they have legal authority to grant these rights on behalf of all minors depicted.</p>
    `,
    tags: ['optional', 'model-release', 'consent', 'marketing'],
    mandatory: false,
  },
  {
    slug: 'image-count-disclaimer',
    title: 'Image Count & Selection Disclaimer',
    bodyHtml: `
      <h3>Image Count & Selection</h3>
      <p><strong>Estimated Image Count:</strong> The Client can expect to receive approximately {{estimated_image_count}} professionally edited images from this session/event. This is an estimate, not a guarantee, as the actual count depends on:</p>
      <ul>
        <li>Actual duration of the event</li>
        <li>Variety of moments and scenes</li>
        <li>Lighting conditions and image quality</li>
        <li>Client cooperation and guest behavior</li>
      </ul>
      <p><strong>Photographer's Selection:</strong> The Photographer will select and edit the best images from the session. The Photographer's judgment as a professional is final regarding which images are suitable for editing and delivery. Images that are out of focus, poorly lit, unflattering, or technically flawed will not be delivered.</p>
      <p><strong>Outtakes:</strong> The Client may request to review outtakes (unedited, rejected images) for an additional fee of {{outtake_review_fee}}. Outtakes are delivered unedited, as-is, and the Photographer cannot guarantee their quality or suitability.</p>
      <p><strong>Backup Retention:</strong> The Photographer retains backups of all session files for {{backup_retention_months}} months after delivery. After this period, backups may be deleted and cannot be recovered.</p>
    `,
    tags: ['optional', 'image-count', 'selection', 'expectations'],
    mandatory: false,
  },
  {
    slug: 'creative-control',
    title: 'Creative Control & Direction',
    bodyHtml: `
      <h3>Creative Control & Direction</h3>
      <p><strong>Photographer's Artistic Vision:</strong> The Client has selected the Photographer based on their portfolio and artistic style. The Photographer retains full creative control over:</p>
      <ul>
        <li>Composition, framing, and camera angles</li>
        <li>Lighting setup and techniques</li>
        <li>Posing and direction</li>
        <li>Post-processing and editing style</li>
      </ul>
      <p><strong>Client Input:</strong> The Client is encouraged to share preferences, must-have shots, and inspiration prior to the session. The Photographer will incorporate these requests where possible while maintaining artistic integrity.</p>
      <p><strong>Shot Lists:</strong> The Client may provide a shot list of desired photos (family groupings, detail shots, specific moments). The Photographer will make reasonable efforts to capture all requested shots, but cannot guarantee every item on the list due to time constraints, cooperation of subjects, or unforeseen circumstances.</p>
      <p><strong>Final Edits:</strong> The Photographer's editing decisions are final. Requests for re-editing images in a different style will incur additional fees of {{reedit_fee}} per image with a minimum of {{reedit_minimum}}.</p>
    `,
    tags: ['optional', 'creative-control', 'artistic', 'direction'],
    mandatory: false,
  },
  {
    slug: 'vendor-collaboration',
    title: 'Vendor Collaboration & Coordination',
    bodyHtml: `
      <h3>Vendor Collaboration</h3>
      <p><strong>Cooperative Environment:</strong> The Photographer will work collaboratively with all event vendors (videographers, coordinators, florists, etc.) to ensure the event runs smoothly.</p>
      <p><strong>Videographer Coordination:</strong></p>
      <ul>
        <li>The Photographer and videographer will coordinate to avoid interfering with each other's work</li>
        <li>During key moments (ceremony, first dance, etc.), both vendors will have equal access unless otherwise specified</li>
        <li>The Photographer is not responsible for delays or interference caused by other vendors</li>
      </ul>
      <p><strong>Timeline Coordination:</strong> The Photographer recommends sharing the photography timeline with the event coordinator and other key vendors to ensure adequate time for all desired shots.</p>
      <p><strong>Vendor Meals:</strong> If the event includes vendor meals, the photography team should be seated together in a location with clear sight lines to the event space to capture spontaneous moments.</p>
      <p><strong>Preferred Vendor List:</strong> The Photographer may provide a list of recommended vendors (coordinators, florists, venues) who are experienced in working with photographers and understand lighting, timing, and photography needs.</p>
    `,
    tags: ['optional', 'vendor', 'collaboration', 'coordination'],
    mandatory: false,
  },
  {
    slug: 'timeline-planning',
    title: 'Timeline Planning & Consultation',
    bodyHtml: `
      <h3>Timeline Planning & Consultation</h3>
      <p><strong>Complimentary Timeline Consultation:</strong> The Photographer will provide a complimentary pre-event consultation (up to {{timeline_consult_hours}} hour) to assist with:</p>
      <ul>
        <li>Creating a photography timeline for the event</li>
        <li>Identifying optimal lighting times (golden hour, sunset, etc.)</li>
        <li>Recommending time allocations for different photo segments</li>
        <li>Suggesting locations and backdrops</li>
      </ul>
      <p><strong>Timeline Adherence:</strong> The Photographer will make every effort to adhere to the agreed-upon timeline. However, delays caused by the event (late arrivals, ceremony delays, weather, etc.) may affect the schedule. The Photographer cannot be held responsible for missed shots due to timeline deviations beyond the Photographer's control.</p>
      <p><strong>Buffer Time:</strong> The Photographer recommends building {{buffer_time_minutes}} minutes of buffer time into the schedule for unexpected delays.</p>
      <p><strong>Extended Coverage:</strong> If the event runs longer than contracted hours, overtime is available at {{overtime_rate}}/hour (minimum {{overtime_minimum}} hour increments) subject to the Photographer's availability. Overtime must be requested and approved before exceeding contracted hours.</p>
    `,
    tags: ['optional', 'timeline', 'planning', 'consultation'],
    mandatory: false,
  },
  {
    slug: 'copyright-infringement',
    title: 'Copyright Infringement & Enforcement',
    bodyHtml: `
      <h3>Copyright Infringement Protection</h3>
      <p><strong>Watermark Removal:</strong> Clients and third parties may not remove, obscure, or alter copyright watermarks, metadata, or attribution from images without express written permission.</p>
      <p><strong>Unauthorized Use:</strong> The Client agrees not to authorize third parties to use the photographs in ways that exceed the Client's granted license (e.g., commercial use if only personal use is licensed).</p>
      <p><strong>Enforcement:</strong> The Photographer reserves the right to take legal action to enforce copyright protections, including:</p>
      <ul>
        <li>DMCA takedown notices for unauthorized online use</li>
        <li>Cease and desist letters</li>
        <li>Legal proceedings for willful infringement</li>
      </ul>
      <p><strong>Damages:</strong> Willful copyright infringement may result in statutory damages of up to {{copyright_damages}} per infringed image, plus attorneys' fees and costs.</p>
      <p><strong>Good Faith Resolution:</strong> Before pursuing legal action, the Photographer will attempt to resolve copyright disputes through direct communication and good faith negotiation.</p>
    `,
    tags: ['optional', 'copyright', 'enforcement', 'legal'],
    mandatory: false,
  },
  {
    slug: 'archive-backup-policy',
    title: 'Archive & Backup Policy',
    bodyHtml: `
      <h3>Archive & Backup Policy</h3>
      <p><strong>Backup Retention:</strong> The Photographer maintains secure backups of all session files for {{backup_retention_months}} months following final delivery.</p>
      <p><strong>Extended Archive:</strong> Clients may purchase extended archival storage for an additional fee:</p>
      <ul>
        <li>{{archive_1year_fee}} for 1 additional year</li>
        <li>{{archive_3year_fee}} for 3 additional years</li>
        <li>{{archive_lifetime_fee}} for lifetime archival</li>
      </ul>
      <p><strong>Archive Access:</strong> Archived images can be re-delivered for a fee of {{archive_access_fee}} plus any applicable storage fees.</p>
      <p><strong>No Liability After Retention:</strong> After the backup retention period (or extended archive period, if purchased), the Photographer bears no responsibility for recovering lost or damaged images. Clients are responsible for maintaining their own backups of downloaded images.</p>
      <p><strong>Disaster Recovery:</strong> While the Photographer maintains redundant backup systems, in the event of catastrophic data loss (fire, flood, simultaneous hardware failure), liability is limited to a full refund of fees paid.</p>
    `,
    tags: ['optional', 'backup', 'archive', 'storage'],
    mandatory: false,
  },
];

async function main() {
  console.log('🌱 Seeding Clause Library...\n');

  // Seed Mandatory Clauses
  console.log('📋 Creating Mandatory Clauses...');
  for (const clause of MANDATORY_CLAUSES) {
    const created = await prisma.clause.upsert({
      where: { slug: clause.slug },
      update: clause,
      create: clause,
    });
    console.log(`  ✅ ${created.title} (${created.slug})`);
  }

  console.log('\n📋 Creating Optional Clauses...');
  for (const clause of OPTIONAL_CLAUSES) {
    const created = await prisma.clause.upsert({
      where: { slug: clause.slug },
      update: clause,
      create: clause,
    });
    console.log(`  ✅ ${created.title} (${created.slug})`);
  }

  const totalClauses = await prisma.clause.count();
  const mandatoryCount = await prisma.clause.count({ where: { mandatory: true } });
  const optionalCount = await prisma.clause.count({ where: { mandatory: false } });

  console.log('\n🎉 Clause Library Seeded Successfully!');
  console.log(`   📊 Total Clauses: ${totalClauses}`);
  console.log(`   🔒 Mandatory: ${mandatoryCount}`);
  console.log(`   📝 Optional: ${optionalCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding clauses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
