import Handlebars from 'handlebars';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Document generation options
export interface DocGenOptions {
  template: string; // Template name (without extension)
  data: Record<string, any>; // Template variables
  outputPath?: string; // Output file path (optional)
  watermark?: {
    text: string;
    opacity?: number;
  };
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

// Document generation result
export interface DocGenResult {
  success: boolean;
  filePath?: string;
  hash?: string; // SHA256 hash of the PDF content
  error?: string;
}

/**
 * Document Generation Service
 * Handles HTML template rendering and PDF generation
 */
export class DocGenService {
  private templatesDir: string;
  private outputDir: string;
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.templatesDir = join(__dirname, '..', '..', 'doc_templates');
    this.outputDir = join(__dirname, '..', '..', 'rendered');

    // Ensure directories exist
    if (!existsSync(this.templatesDir)) {
      mkdirSync(this.templatesDir, { recursive: true });
    }
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Register Handlebars helpers
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers() {
    // Format currency
    Handlebars.registerHelper('currency', function(currency: string, value: number) {
      // Handle case where currency might be undefined
      const currencyCode = currency || 'GBP';
      const numValue = typeof value === 'number' ? value : parseFloat(value);

      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currencyCode,
      }).format(numValue);
    });

    // Format date
    Handlebars.registerHelper('date', function(value: Date | string, format = 'long') {
      const date = typeof value === 'string' ? new Date(value) : value;

      if (format === 'short') {
        return new Intl.DateTimeFormat('en-US').format(date);
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    });

    // Multiply helper
    Handlebars.registerHelper('multiply', function(a: number, b: number) {
      return a * b;
    });

    // Add helper
    Handlebars.registerHelper('add', function(a: number, b: number) {
      return a + b;
    });

    // Equals helper
    Handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });
  }

  /**
   * Load and compile template
   */
  private loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    const templatePath = join(this.templatesDir, `${templateName}.html`);

    if (!existsSync(templatePath)) {
      throw new Error(`Template "${templateName}" not found at ${templatePath}`);
    }

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
   * Render HTML from template
   */
  renderHTML(templateName: string, data: Record<string, any>): string {
    const template = this.loadTemplate(templateName);
    return template(data);
  }

  /**
   * Generate PDF from HTML (using PDFKit for now, Puppeteer in future)
   */
  async generatePDF(options: DocGenOptions): Promise<DocGenResult> {
    try {
      // Render HTML
      const html = this.renderHTML(options.template, options.data);

      // For now, we'll use a simple approach
      // In production, you'd use Puppeteer or similar for HTML to PDF
      // This is a placeholder implementation

      // Create a simple PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

      const { width, height } = page.getSize();
      const fontSize = 12;

      // Embed font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Add metadata
      if (options.metadata) {
        if (options.metadata.title) pdfDoc.setTitle(options.metadata.title);
        if (options.metadata.author) pdfDoc.setAuthor(options.metadata.author);
        if (options.metadata.subject) pdfDoc.setSubject(options.metadata.subject);
        if (options.metadata.keywords) pdfDoc.setKeywords(options.metadata.keywords);
      }

      // Add watermark if requested
      if (options.watermark) {
        const watermarkOpacity = options.watermark.opacity || 0.3;

        page.drawText(options.watermark.text, {
          x: width / 2 - 100,
          y: height / 2,
          size: 60,
          font: boldFont,
          color: rgb(0.7, 0.7, 0.7),
          opacity: watermarkOpacity,
          rotate: { angle: 45, type: 'degrees' as any },
        });
      }

      // Add simple content (placeholder - in production use proper HTML rendering)
      page.drawText('Document Generated by Kori', {
        x: 50,
        y: height - 50,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(`Template: ${options.template}`, {
        x: 50,
        y: height - 80,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText(`Generated: ${new Date().toLocaleString()}`, {
        x: 50,
        y: height - 100,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Add data preview (first few fields)
      let yPosition = height - 140;
      page.drawText('Data:', {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 25;
      const dataEntries = Object.entries(options.data).slice(0, 10);
      for (const [key, value] of dataEntries) {
        const text = `${key}: ${String(value).substring(0, 50)}`;
        page.drawText(text, {
          x: 60,
          y: yPosition,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;

        if (yPosition < 100) break;
      }

      // Add footer
      page.drawText('This is a placeholder PDF. Production version will render full HTML.', {
        x: 50,
        y: 50,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Serialize PDF to bytes
      const pdfBytes = await pdfDoc.save();

      // Calculate hash
      const hash = createHash('sha256').update(pdfBytes).digest('hex');

      // Determine output path
      const outputPath = options.outputPath || join(
        this.outputDir,
        `${options.template}-${Date.now()}.pdf`
      );

      // Write to file
      writeFileSync(outputPath, pdfBytes);

      console.log(`PDF generated: ${outputPath}`);
      console.log(`SHA256: ${hash}`);

      return {
        success: true,
        filePath: outputPath,
        hash,
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate PDF/A (archival format)
   */
  async generatePDFA(options: DocGenOptions): Promise<DocGenResult> {
    // For now, use the same method
    // In production, you'd add PDF/A compliance settings
    const result = await this.generatePDF(options);

    if (result.success) {
      console.log('Note: PDF/A compliance not yet fully implemented');
    }

    return result;
  }

  /**
   * List available templates
   */
  listTemplates(): string[] {
    if (!existsSync(this.templatesDir)) {
      return [];
    }

    const files = readdirSync(this.templatesDir);
    return files
      .filter((file: string) => file.endsWith('.html'))
      .map((file: string) => file.replace('.html', ''));
  }

  /**
   * Verify document hash
   */
  verifyDocument(filePath: string, expectedHash: string): boolean {
    try {
      const fileContent = readFileSync(filePath);
      const actualHash = createHash('sha256').update(fileContent).digest('hex');
      return actualHash === expectedHash;
    } catch (error) {
      console.error('Document verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const docGenService = new DocGenService();
