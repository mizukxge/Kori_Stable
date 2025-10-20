import { FastifyInstance } from 'fastify';
import { ClientService } from '../services/clients.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  CreateClientSchema,
  UpdateClientSchema,
  UpdateStatusSchema,
  ListClientsQuerySchema,
  ClientIdSchema,
  CreateClientInput,
  UpdateClientInput,
  UpdateStatusInput,
  ListClientsQuery,
  ClientIdParam,
} from '../schemas/client.js';

export async function clientRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/clients/stats
   * Get client statistics
   */
  fastify.get('/admin/clients/stats', async (request, reply) => {
    try {
      const stats = await ClientService.getClientStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching client stats');
      throw error;
    }
  });

  /**
   * GET /admin/clients
   * List all clients with pagination and filters
   */
  fastify.get<{ Querystring: ListClientsQuery }>(
    '/admin/clients',
    async (request, reply) => {
      try {
        // Validate query parameters
        const query = ListClientsQuerySchema.parse(request.query);

        const { page, limit, sortBy, sortOrder, status, search, tags } = query;

        const result = await ClientService.listClients(
          { status, search, tags },
          { page, limit, sortBy, sortOrder }
        );

        return reply.status(200).send({
          success: true,
          data: result.data,
          pagination: result.pagination,
        });
      } catch (error) {
        request.log.error(error, 'Error listing clients');
        throw error;
      }
    }
  );

  /**
   * GET /admin/clients/:id
   * Get a single client by ID
   */
  fastify.get<{ Params: ClientIdParam }>(
    '/admin/clients/:id',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);

        const client = await ClientService.getClient(id);

        return reply.status(200).send({
          success: true,
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        request.log.error(error, 'Error fetching client');
        throw error;
      }
    }
  );

  /**
   * POST /admin/clients
   * Create a new client
   */
  fastify.post<{ Body: CreateClientInput }>(
    '/admin/clients',
    async (request, reply) => {
      try {
        // Validate request body
        const data = CreateClientSchema.parse(request.body);

        const client = await ClientService.createClient(
          data,
          request.user!.userId
        );

        request.log.info(
          {
            clientId: client.id,
            userId: request.user!.userId,
          },
          'Client created'
        );

        return reply.status(201).send({
          success: true,
          message: 'Client created successfully',
          data: client,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'A client with this email already exists'
        ) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: error.message,
          });
        }

        request.log.error(error, 'Error creating client');
        throw error;
      }
    }
  );

  /**
   * PUT /admin/clients/:id
   * Update a client
   */
  fastify.put<{ Params: ClientIdParam; Body: UpdateClientInput }>(
    '/admin/clients/:id',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);
        const data = UpdateClientSchema.parse(request.body);

        const client = await ClientService.updateClient(
          id,
          data,
          request.user!.userId
        );

        request.log.info(
          {
            clientId: id,
            userId: request.user!.userId,
          },
          'Client updated'
        );

        return reply.status(200).send({
          success: true,
          message: 'Client updated successfully',
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        if (
          error instanceof Error &&
          error.message === 'A client with this email already exists'
        ) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: error.message,
          });
        }

        request.log.error(error, 'Error updating client');
        throw error;
      }
    }
  );

  /**
   * PATCH /admin/clients/:id/status
   * Update client status
   */
  fastify.patch<{ Params: ClientIdParam; Body: UpdateStatusInput }>(
    '/admin/clients/:id/status',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);
        const { status } = UpdateStatusSchema.parse(request.body);

        const client = await ClientService.updateClientStatus(
          id,
          status,
          request.user!.userId
        );

        request.log.info(
          {
            clientId: id,
            status,
            userId: request.user!.userId,
          },
          'Client status updated'
        );

        return reply.status(200).send({
          success: true,
          message: 'Client status updated successfully',
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        request.log.error(error, 'Error updating client status');
        throw error;
      }
    }
  );

  /**
   * DELETE /admin/clients/:id
   * Delete (archive) a client
   */
  fastify.delete<{ Params: ClientIdParam }>(
    '/admin/clients/:id',
    async (request, reply) => {
      try {
        const { id } = ClientIdSchema.parse(request.params);

        const client = await ClientService.deleteClient(id, request.user!.userId);

        request.log.info(
          {
            clientId: id,
            userId: request.user!.userId,
          },
          'Client archived'
        );

        return reply.status(200).send({
          success: true,
          message: 'Client archived successfully',
          data: client,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Client not found') {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Client not found',
          });
        }

        request.log.error(error, 'Error deleting client');
        throw error;
      }
    }
  );
}