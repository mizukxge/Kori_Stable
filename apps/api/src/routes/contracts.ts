import { FastifyInstance } from 'fastify';
import { ContractService } from '../services/contract.js';
import { requireAdmin } from '../middleware/auth.js';

export async function contractsRoutes(fastify: FastifyInstance) {
  // All routes require admin authentication
  fastify.addHook('preHandler', requireAdmin);

  /**
   * GET /admin/contracts/stats
   * Get contract statistics
   */
  fastify.get('/admin/contracts/stats', async (request, reply) => {
    try {
      const stats = await ContractService.getContractStats();

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching contract stats');
      throw error;
    }
  });

  /**
   * GET /admin/contracts
   * List all contracts
   */
  fastify.get('/admin/contracts', async (request, reply) => {
    try {
      const query = request.query as any;

      const contracts = await ContractService.listContracts({
        clientId: query.clientId,
        templateId: query.templateId,
        status: query.status,
      });

      return reply.status(200).send({
        success: true,
        data: contracts,
      });
    } catch (error) {
      request.log.error(error, 'Error listing contracts');
      throw error;
    }
  });

  /**
   * GET /admin/contracts/:id
   * Get a single contract by ID
   */
  fastify.get('/admin/contracts/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const contract = await ContractService.getContractById(id);

      return reply.status(200).send({
        success: true,
        data: contract,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Contract not found',
        });
      }

      request.log.error(error, 'Error fetching contract');
      throw error;
    }
  });

  /**
   * POST /admin/contracts
   * Generate a new contract from template
   */
  fastify.post('/admin/contracts', async (request, reply) => {
    try {
      const data = request.body as any;

      // Validate required fields
      if (!data.templateId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'templateId is required',
        });
      }

      if (!data.title) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'title is required',
        });
      }

      if (!data.variables || typeof data.variables !== 'object') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'variables object is required',
        });
      }

      const contract = await ContractService.generateContract(
        data,
        request.user!.userId
      );

      request.log.info(
        {
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          userId: request.user!.userId,
        },
        'Contract generated'
      );

      return reply.status(201).send({
        success: true,
        message: 'Contract generated successfully',
        data: {
          id: contract.id,
          contractNumber: contract.contractNumber,
          title: contract.title,
          status: contract.status,
          createdAt: contract.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Template not found',
        });
      }

      if (error instanceof Error && error.message === 'Template is not active') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Template is not active',
        });
      }

      request.log.error(error, 'Error generating contract');
      throw error;
    }
  });

  /**
   * PUT /admin/contracts/:id
   * Update a contract
   */
  fastify.put('/admin/contracts/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const contract = await ContractService.updateContract(
        id,
        data,
        request.user!.userId
      );

      request.log.info(
        {
          contractId: id,
          userId: request.user!.userId,
        },
        'Contract updated'
      );

      return reply.status(200).send({
        success: true,
        message: 'Contract updated successfully',
        data: contract,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Contract not found',
        });
      }

      request.log.error(error, 'Error updating contract');
      throw error;
    }
  });

  /**
   * POST /admin/contracts/:id/send
   * Send contract to client
   */
  fastify.post('/admin/contracts/:id/send', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const contract = await ContractService.sendContract(id, request.user!.userId);

      request.log.info(
        {
          contractId: id,
          contractNumber: contract.contractNumber,
          userId: request.user!.userId,
        },
        'Contract sent'
      );

      return reply.status(200).send({
        success: true,
        message: 'Contract sent successfully',
        data: {
          contractNumber: contract.contractNumber,
          status: contract.status,
          sentAt: contract.sentAt,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Contract not found',
        });
      }

      if (error instanceof Error && error.message === 'Only draft contracts can be sent') {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: error.message,
        });
      }

      request.log.error(error, 'Error sending contract');
      throw error;
    }
  });

  /**
   * POST /admin/contracts/:id/generate-pdf
   * Generate PDF for contract
   */
  fastify.post('/admin/contracts/:id/generate-pdf', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const pdfPath = await ContractService.generatePDF(id);

      request.log.info(
        {
          contractId: id,
          userId: request.user!.userId,
        },
        'Contract PDF generated'
      );

      return reply.status(200).send({
        success: true,
        message: 'PDF generated successfully',
        data: {
          pdfPath,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Contract not found',
        });
      }

      request.log.error(error, 'Error generating PDF');
      throw error;
    }
  });

  /**
   * GET /admin/contracts/:id/pdf
   * Download contract PDF
   */
  fastify.get('/admin/contracts/:id/pdf', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const contract = await ContractService.getContractById(id);

      if (!contract.pdfPath) {
        // Generate PDF if not exists
        await ContractService.generatePDF(id);
        const updated = await ContractService.getContractById(id);
        
        if (!updated.pdfPath) {
          throw new Error('Failed to generate PDF');
        }

        return reply.sendFile(updated.pdfPath.split('/').pop()!, {
          root: updated.pdfPath.substring(0, updated.pdfPath.lastIndexOf('/')),
        });
      }

      return reply.sendFile(contract.pdfPath.split('/').pop()!, {
        root: contract.pdfPath.substring(0, contract.pdfPath.lastIndexOf('/')),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Contract not found',
        });
      }

      request.log.error(error, 'Error downloading PDF');
      throw error;
    }
  });

  /**
   * DELETE /admin/contracts/:id
   * Delete a contract
   */
  fastify.delete('/admin/contracts/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const contract = await ContractService.deleteContract(id, request.user!.userId);

      request.log.info(
        {
          contractId: id,
          userId: request.user!.userId,
        },
        'Contract deleted'
      );

      return reply.status(200).send({
        success: true,
        message: 'Contract deleted successfully',
        data: {
          id: contract.id,
          contractNumber: contract.contractNumber,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Contract not found',
        });
      }

      request.log.error(error, 'Error deleting contract');
      throw error;
    }
  });
}