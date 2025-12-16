import { createTransport, Transporter, SendMailOptions } from 'nodemailer';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Email provider types
export type EmailProvider = 'smtp' | 'resend' | 'ses' | 'stub';

// Email configuration
export interface EmailConfig {
  provider: EmailProvider;
  from: {
    name: string;
    email: string;
  };
  // SMTP config
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  // Resend config
  resend?: {
    apiKey: string;
  };
  // SES config
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

// Email message
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

// Email send result
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Mask email address for logging (privacy)
 * Example: john.doe@example.com -> j***@e***.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const maskedLocal = local.length > 2
    ? local[0] + '***'
    : '***';
  
  const [domainName, tld] = domain.split('.');
  const maskedDomain = domainName.length > 2
    ? domainName[0] + '***'
    : '***';

  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

/**
 * Email Service
 * Supports multiple providers: SMTP, Resend, SES, Stub (for testing)
 */
export class EmailService {
  private config: EmailConfig;
  private transporter?: Transporter;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(config: EmailConfig) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize email provider
   */
  private initialize() {
    switch (this.config.provider) {
      case 'smtp':
        if (!this.config.smtp) {
          throw new Error('SMTP configuration is required');
        }
        this.transporter = createTransport({
          host: this.config.smtp.host,
          port: this.config.smtp.port,
          secure: this.config.smtp.secure,
          auth: {
            user: this.config.smtp.auth.user,
            pass: this.config.smtp.auth.pass,
          },
        });
        break;

      case 'resend':
        // TODO: Implement Resend provider
        throw new Error('Resend provider not yet implemented');

      case 'ses':
        // TODO: Implement SES provider
        throw new Error('SES provider not yet implemented');

      case 'stub':
        // Stub provider for testing (logs emails instead of sending)
        console.log('Email service initialized with STUB provider (no emails will be sent)');
        break;

      default:
        throw new Error(`Unknown email provider: ${this.config.provider}`);
    }
  }

  /**
   * Send an email
   */
  async send(message: EmailMessage, retries = 3): Promise<EmailSendResult> {
    const startTime = Date.now();

    try {
      // Stub provider - just log the email
      if (this.config.provider === 'stub') {
        console.log('\n=== EMAIL (STUB) ===');
        console.log(`From: ${this.config.from.name} <${this.config.from.email}>`);
        console.log(`To: ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`);
        if (message.cc) console.log(`CC: ${Array.isArray(message.cc) ? message.cc.join(', ') : message.cc}`);
        if (message.bcc) console.log(`BCC: ${Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc}`);
        console.log(`Subject: ${message.subject}`);
        if (message.text) console.log(`\nText:\n${message.text}`);
        if (message.html) console.log(`\nHTML:\n${message.html.substring(0, 200)}...`);
        console.log('==================\n');

        return {
          success: true,
          messageId: `stub-${Date.now()}`,
        };
      }

      // SMTP provider
      if (this.config.provider === 'smtp' && this.transporter) {
        const mailOptions: SendMailOptions = {
          from: `${this.config.from.name} <${this.config.from.email}>`,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          cc: message.cc,
          bcc: message.bcc,
          replyTo: message.replyTo,
          attachments: message.attachments,
        };

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const info = await this.transporter.sendMail(mailOptions);
            
            const duration = Date.now() - startTime;
            console.log(`Email sent successfully in ${duration}ms (attempt ${attempt}/${retries})`);
            console.log(`  To: ${maskEmail(Array.isArray(message.to) ? message.to[0] : message.to)}`);
            console.log(`  Message ID: ${info.messageId}`);

            return {
              success: true,
              messageId: info.messageId,
            };
          } catch (error) {
            lastError = error as Error;
            console.error(`Email send failed (attempt ${attempt}/${retries}):`, error);

            if (attempt < retries) {
              // Wait before retry (exponential backoff)
              const waitTime = Math.pow(2, attempt) * 1000;
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }

        return {
          success: false,
          error: lastError?.message || 'Failed to send email after retries',
        };
      }

      throw new Error(`Provider ${this.config.provider} not configured`);
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load and compile template
   */
  private loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    const templatePath = join(__dirname, '..', '..', 'templates', `${templateName}.hbs`);
    
    try {
      const templateSource = readFileSync(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateSource);
      this.compiledTemplates.set(templateName, compiled);
      return compiled;
    } catch (error) {
      throw new Error(`Failed to load template "${templateName}": ${error}`);
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(templateName: string, variables: Record<string, any>): string {
    const template = this.loadTemplate(templateName);
    return template(variables);
  }

  /**
   * Send templated email
   */
  async sendTemplate(
    templateName: string,
    to: string | string[],
    subject: string,
    variables: Record<string, any>
  ): Promise<EmailSendResult> {
    const html = this.renderTemplate(templateName, variables);

    return this.send({
      to,
      subject,
      html,
    });
  }

  /**
   * Verify email provider connection
   */
  async verify(): Promise<boolean> {
    if (this.config.provider === 'stub') {
      return true;
    }

    if (this.config.provider === 'smtp' && this.transporter) {
      try {
        await this.transporter.verify();
        console.log('SMTP connection verified successfully');
        return true;
      } catch (error) {
        console.error('SMTP verification failed:', error);
        return false;
      }
    }

    return false;
  }
}

/**
 * Create email service instance from environment variables
 */
export function createEmailService(): EmailService {
  const provider = (process.env.EMAIL_PROVIDER || 'stub') as EmailProvider;

  const config: EmailConfig = {
    provider,
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Kori',
      email: process.env.EMAIL_FROM_ADDRESS || 'noreply@kori.dev',
    },
  };

  // Configure SMTP if selected
  if (provider === 'smtp') {
    config.smtp = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };
  }

  // Configure Resend if selected
  if (provider === 'resend') {
    config.resend = {
      apiKey: process.env.RESEND_API_KEY || '',
    };
  }

  // Configure SES if selected
  if (provider === 'ses') {
    config.ses = {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    };
  }

  return new EmailService(config);
}

// Export singleton instance
export const emailService = createEmailService();