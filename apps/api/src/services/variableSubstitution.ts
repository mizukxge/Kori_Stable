/**
 * Variable Substitution Service
 * Handles replacement of template variables like {{client.name}}, {{date}}, etc.
 */

export interface VariableContext {
  client?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
  proposal?: {
    amount?: string | number;
    subtotal?: string | number;
    tax?: string | number;
    total?: string | number;
    number?: string;
  };
  date?: {
    today?: string; // YYYY-MM-DD
    tomorrow?: string;
    nextWeek?: string;
    custom?: string;
  };
  business?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  [key: string]: any;
}

export interface Variable {
  name: string;
  placeholder: string; // e.g., {{client.name}}
  description: string;
  category: 'client' | 'proposal' | 'date' | 'business' | 'custom';
  example: string;
}

// Predefined variables available for substitution
export const AVAILABLE_VARIABLES: Variable[] = [
  // Client variables
  {
    name: 'client.name',
    placeholder: '{{client.name}}',
    description: 'Client full name',
    category: 'client',
    example: 'John Smith',
  },
  {
    name: 'client.email',
    placeholder: '{{client.email}}',
    description: 'Client email address',
    category: 'client',
    example: 'john@example.com',
  },
  {
    name: 'client.phone',
    placeholder: '{{client.phone}}',
    description: 'Client phone number',
    category: 'client',
    example: '+44 123 456 7890',
  },
  {
    name: 'client.company',
    placeholder: '{{client.company}}',
    description: 'Client company name',
    category: 'client',
    example: 'ABC Corporation',
  },
  {
    name: 'client.address',
    placeholder: '{{client.address}}',
    description: 'Client address',
    category: 'client',
    example: '123 Main Street, London',
  },

  // Proposal variables
  {
    name: 'proposal.number',
    placeholder: '{{proposal.number}}',
    description: 'Proposal reference number',
    category: 'proposal',
    example: 'PROP-2025-001',
  },
  {
    name: 'proposal.subtotal',
    placeholder: '{{proposal.subtotal}}',
    description: 'Proposal subtotal amount',
    category: 'proposal',
    example: '£1,500.00',
  },
  {
    name: 'proposal.tax',
    placeholder: '{{proposal.tax}}',
    description: 'Proposal tax amount',
    category: 'proposal',
    example: '£300.00',
  },
  {
    name: 'proposal.total',
    placeholder: '{{proposal.total}}',
    description: 'Proposal total amount (subtotal + tax)',
    category: 'proposal',
    example: '£1,800.00',
  },

  // Date variables
  {
    name: 'date.today',
    placeholder: '{{date.today}}',
    description: 'Today\'s date',
    category: 'date',
    example: '7 November 2025',
  },
  {
    name: 'date.tomorrow',
    placeholder: '{{date.tomorrow}}',
    description: 'Tomorrow\'s date',
    category: 'date',
    example: '8 November 2025',
  },
  {
    name: 'date.nextWeek',
    placeholder: '{{date.nextWeek}}',
    description: 'One week from today',
    category: 'date',
    example: '14 November 2025',
  },

  // Business variables
  {
    name: 'business.name',
    placeholder: '{{business.name}}',
    description: 'Your business name',
    category: 'business',
    example: 'Acme Photography',
  },
  {
    name: 'business.email',
    placeholder: '{{business.email}}',
    description: 'Your business email',
    category: 'business',
    example: 'hello@acmephoto.com',
  },
  {
    name: 'business.phone',
    placeholder: '{{business.phone}}',
    description: 'Your business phone',
    category: 'business',
    example: '+44 987 654 3210',
  },
  {
    name: 'business.address',
    placeholder: '{{business.address}}',
    description: 'Your business address',
    category: 'business',
    example: '456 Photo Lane, London',
  },
  {
    name: 'business.website',
    placeholder: '{{business.website}}',
    description: 'Your business website',
    category: 'business',
    example: 'https://acmephoto.com',
  },
];

export class VariableSubstitutionService {
  /**
   * Replace all variables in a text string with their actual values
   */
  static substitute(text: string, context: VariableContext): string {
    if (!text) return text;

    let result = text;

    // Replace all {{variable.name}} patterns
    const pattern = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
    result = result.replace(pattern, (match, variablePath) => {
      return this.getVariableValue(variablePath, context) || match;
    });

    return result;
  }

  /**
   * Get value of a variable using dot notation (e.g., "client.name")
   */
  private static getVariableValue(path: string, context: VariableContext): string {
    const parts = path.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return ''; // Return empty string if path not found
      }
    }

    // Format the value for display
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Get all available variables (optionally filtered by category)
   */
  static getAvailableVariables(category?: string): Variable[] {
    if (!category) {
      return AVAILABLE_VARIABLES;
    }
    return AVAILABLE_VARIABLES.filter((v) => v.category === category);
  }

  /**
   * Get variables by category, grouped
   */
  static getVariablesByCategory(): Record<string, Variable[]> {
    const grouped: Record<string, Variable[]> = {
      client: [],
      proposal: [],
      date: [],
      business: [],
      custom: [],
    };

    for (const variable of AVAILABLE_VARIABLES) {
      if (variable.category in grouped) {
        grouped[variable.category].push(variable);
      }
    }

    return grouped;
  }

  /**
   * Check if text contains any variables
   */
  static hasVariables(text: string): boolean {
    const pattern = /\{\{[a-zA-Z0-9_.]+\}\}/;
    return pattern.test(text);
  }

  /**
   * Extract all variables from text
   */
  static extractVariables(text: string): string[] {
    const pattern = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
    const matches: string[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      matches.push(match[1]);
    }

    return [...new Set(matches)]; // Return unique variables
  }

  /**
   * Validate that all variables in text are available/known
   */
  static validateVariables(text: string): { valid: boolean; unknown: string[] } {
    const variables = this.extractVariables(text);
    const availableVars = new Set(AVAILABLE_VARIABLES.map((v) => v.name));

    const unknown = variables.filter((v) => !availableVars.has(v));

    return {
      valid: unknown.length === 0,
      unknown,
    };
  }

  /**
   * Create context from database objects
   */
  static createContext(
    client?: any,
    user?: any,
    proposal?: any,
    business?: any
  ): VariableContext {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-GB', {
        weekday: undefined,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return {
      client: client && {
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        address: client.address,
      },
      user: user && {
        name: user.name,
        email: user.email,
      },
      proposal: proposal && {
        number: proposal.proposalNumber,
        amount: proposal.total,
        subtotal: proposal.subtotal,
        tax: proposal.taxAmount,
        total: proposal.total,
      },
      date: {
        today: formatDate(today),
        tomorrow: formatDate(tomorrow),
        nextWeek: formatDate(nextWeek),
      },
      business: business && {
        name: business.name,
        email: business.email,
        phone: business.phone,
        address: business.address,
        website: business.website,
      },
    };
  }

  /**
   * Format a currency value for display
   */
  static formatCurrency(value: string | number, currency: string = 'GBP'): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);

    const symbols: Record<string, string> = {
      GBP: '£',
      USD: '$',
      EUR: '€',
    };
    const symbol = symbols[currency] || currency;

    return `${symbol}${num.toFixed(2)}`;
  }
}
