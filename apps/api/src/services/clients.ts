import { PrismaClient, ClientStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
  tags?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status?: ClientStatus;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export class ClientService {
  /**
   * List clients with pagination and filters
   */
  static async listClients(
    filters: ClientFilters = {},
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
    const where: Prisma.ClientWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // Get total count
    const total = await prisma.client.count({ where });

    // Get clients
    const clients = await prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single client by ID
   */
  static async getClient(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return client;
  }

  /**
   * Create a new client
   */
  static async createClient(data: CreateClientData, userId: string) {
    // Check if email already exists
    const existing = await prisma.client.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('A client with this email already exists');
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        ...data,
        status: data.status || 'ACTIVE',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Client',
        entityId: client.id,
        userId,
        clientId: client.id,
        changes: { new: client },
        metadata: { source: 'admin_api' },
      },
    });

    return client;
  }

  /**
   * Update a client
   */
  static async updateClient(
    id: string,
    data: UpdateClientData,
    userId: string
  ) {
    // Get existing client
    const existingClient = await prisma.client.findUnique({ where: { id } });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error('A client with this email already exists');
      }
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Client',
        entityId: id,
        userId,
        clientId: id,
        changes: {
          old: existingClient,
          new: updatedClient,
        },
        metadata: { source: 'admin_api' },
      },
    });

    return updatedClient;
  }

  /**
   * Update client status
   */
  static async updateClientStatus(
    id: string,
    status: ClientStatus,
    userId: string
  ) {
    const client = await prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new Error('Client not found');
    }

    const oldStatus = client.status;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: { status },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Client',
        entityId: id,
        userId,
        clientId: id,
        changes: { statusChange: { from: oldStatus, to: status } },
        metadata: { source: 'admin_api', action: 'status_change' },
      },
    });

    return updatedClient;
  }

  /**
   * Delete a client (soft delete to ARCHIVED)
   */
  static async deleteClient(id: string, userId: string) {
    const client = await prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new Error('Client not found');
    }

    // Soft delete by setting status to ARCHIVED
    const archivedClient = await prisma.client.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Client',
        entityId: id,
        userId,
        clientId: id,
        changes: { archived: true, previousStatus: client.status },
        metadata: { source: 'admin_api', action: 'soft_delete' },
      },
    });

    return archivedClient;
  }

  /**
   * Get client statistics
   */
  static async getClientStats() {
    const [total, active, inactive, pending, archived] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'ACTIVE' } }),
      prisma.client.count({ where: { status: 'INACTIVE' } }),
      prisma.client.count({ where: { status: 'PENDING' } }),
      prisma.client.count({ where: { status: 'ARCHIVED' } }),
    ]);

    return {
      total,
      byStatus: {
        active,
        inactive,
        pending,
        archived,
      },
    };
  }
}