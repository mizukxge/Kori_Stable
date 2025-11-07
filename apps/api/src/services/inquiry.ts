import { PrismaClient, InquiryStatus, InquiryType, ClientStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface InquiryFilters {
  status?: InquiryStatus;
  type?: InquiryType;
  search?: string; // Search by fullName or email
  dateFrom?: Date;
  dateTo?: Date;
  budgetMin?: number;
  budgetMax?: number;
  tags?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateInquiryData {
  fullName: string;
  email: string;
  phone: string;
  company?: string | null;
  inquiryType: InquiryType;
  shootDate?: Date | null;
  shootDescription: string;
  location?: string | null;
  specialRequirements?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  attachmentUrls?: string[];
  source?: string | null;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateInquiryData {
  internalNotes?: string | null;
  tags?: string[];
  status?: InquiryStatus;
}

export class InquiryService {
  /**
   * Create a new inquiry (public form submission)
   */
  static async createInquiry(data: CreateInquiryData) {
    const inquiry = await prisma.inquiry.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        company: data.company || null,
        inquiryType: data.inquiryType,
        shootDate: data.shootDate || null,
        shootDescription: data.shootDescription,
        location: data.location || null,
        specialRequirements: data.specialRequirements || null,
        budgetMin: data.budgetMin || null,
        budgetMax: data.budgetMax || null,
        attachmentUrls: data.attachmentUrls || [],
        attachmentCount: data.attachmentUrls?.length || 0,
        source: data.source || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: 'NEW',
      },
    });

    return inquiry;
  }

  /**
   * List inquiries with pagination and filters (admin only)
   */
  static async listInquiries(
    filters: InquiryFilters = {},
    pagination: PaginationParams = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.InquiryWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.inquiryType = filters.type;
    }

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
      where.AND = [
        filters.budgetMin !== undefined ? { budgetMin: { gte: filters.budgetMin } } : {},
        filters.budgetMax !== undefined ? { budgetMax: { lte: filters.budgetMax } } : {},
      ].filter((obj) => Object.keys(obj).length > 0);
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // Get total count
    const total = await prisma.inquiry.count({ where });

    // Get inquiries
    const inquiries = await prisma.inquiry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    return {
      data: inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single inquiry by ID
   */
  static async getInquiry(id: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            status: true,
          },
        },
      },
    });

    if (!inquiry) {
      throw new Error(`Inquiry with ID ${id} not found`);
    }

    return inquiry;
  }

  /**
   * Update inquiry (admin only)
   */
  static async updateInquiry(id: string, data: UpdateInquiryData) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new Error(`Inquiry with ID ${id} not found`);
    }

    const updateData: Prisma.InquiryUpdateInput = {};

    if (data.internalNotes !== undefined) {
      updateData.internalNotes = data.internalNotes;
    }

    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
      // Update timestamp based on status
      if (data.status === 'CONTACTED' && !inquiry.contactedAt) {
        updateData.contactedAt = new Date();
      }
      if (data.status === 'QUALIFIED' && !inquiry.qualifiedAt) {
        updateData.qualifiedAt = new Date();
      }
      if (data.status === 'CONVERTED' && !inquiry.convertedAt) {
        updateData.convertedAt = new Date();
      }
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Convert inquiry to client
   */
  static async convertInquiryToClient(
    id: string,
    clientStatus: ClientStatus = 'ACTIVE'
  ) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new Error(`Inquiry with ID ${id} not found`);
    }

    if (inquiry.status === 'CONVERTED') {
      throw new Error('Inquiry is already converted to a client');
    }

    // Create or link client
    let client;

    // Check if client with this email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email: inquiry.email },
    });

    if (existingClient) {
      // Link existing client
      client = existingClient;
    } else {
      // Create new client from inquiry
      client = await prisma.client.create({
        data: {
          name: inquiry.fullName,
          email: inquiry.email,
          phone: inquiry.phone || undefined,
          company: inquiry.company || undefined,
          status: clientStatus,
          notes: `Created from inquiry: ${inquiry.shootDescription}`,
          tags: inquiry.tags,
        },
      });
    }

    // Update inquiry with client linkage and mark as converted
    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        clientId: client.id,
        status: 'CONVERTED',
        convertedAt: new Date(),
      },
      include: {
        client: true,
      },
    });

    return { inquiry: updated, client };
  }

  /**
   * Update inquiry status
   */
  static async updateInquiryStatus(id: string, status: InquiryStatus) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new Error(`Inquiry with ID ${id} not found`);
    }

    const updateData: Prisma.InquiryUpdateInput = {
      status,
    };

    // Update timestamp based on status
    if (status === 'CONTACTED' && !inquiry.contactedAt) {
      updateData.contactedAt = new Date();
    }
    if (status === 'QUALIFIED' && !inquiry.qualifiedAt) {
      updateData.qualifiedAt = new Date();
    }
    if (status === 'CONVERTED' && !inquiry.convertedAt) {
      updateData.convertedAt = new Date();
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete or archive inquiry
   */
  static async deleteInquiry(id: string, archive: boolean = true) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw new Error(`Inquiry with ID ${id} not found`);
    }

    if (archive) {
      // Archive instead of delete
      return await prisma.inquiry.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
    } else {
      // Permanently delete
      return await prisma.inquiry.delete({
        where: { id },
      });
    }
  }

  /**
   * Get inquiry stats for dashboard
   */
  static async getInquiryStats(days: number = 30) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Total inquiries this period
    const totalThisPeriod = await prisma.inquiry.count({
      where: {
        createdAt: { gte: dateFrom },
      },
    });

    // New inquiries today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await prisma.inquiry.count({
      where: {
        createdAt: { gte: today },
      },
    });

    // Conversion rate
    const total = await prisma.inquiry.count();
    const converted = await prisma.inquiry.count({
      where: { status: 'CONVERTED' },
    });
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    // Average response time (time from creation to first contact)
    const withContactTime = await prisma.inquiry.findMany({
      where: {
        contactedAt: { not: null },
      },
      select: {
        createdAt: true,
        contactedAt: true,
      },
    });

    let avgResponseTime = 0;
    if (withContactTime.length > 0) {
      const totalTime = withContactTime.reduce((sum, inquiry) => {
        const time =
          (inquiry.contactedAt!.getTime() - inquiry.createdAt.getTime()) / (1000 * 60 * 60); // in hours
        return sum + time;
      }, 0);
      avgResponseTime = totalTime / withContactTime.length;
    }

    return {
      totalThisPeriod,
      newToday,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgResponseTimeHours: Math.round(avgResponseTime * 100) / 100,
    };
  }
}
