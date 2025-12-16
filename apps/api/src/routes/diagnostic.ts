import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function diagnosticRoutes(fastify: FastifyInstance) {
  /**
   * GET /diagnostic/admin-users
   * Check what admin users exist in database (for debugging only)
   */
  fastify.get('/diagnostic/admin-users', async (request, reply) => {
    try {
      const users = await prisma.adminUser.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({
        status: 'ok',
        userCount: users.length,
        users: users.map((u) => ({
          email: u.email,
          name: u.name,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      request.log.error(error, 'Diagnostic error');
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /diagnostic/test-login
   * Test login without creating a session (for debugging)
   */
  fastify.post<{ Body: { email: string; password: string } }>(
    '/diagnostic/test-login',
    async (request, reply) => {
      const { email, password } = request.body;

      try {
        if (!email || !password) {
          return reply.status(400).send({
            error: 'Email and password required',
          });
        }

        // Find user
        const user = await prisma.adminUser.findUnique({
          where: { email },
        });

        if (!user) {
          return reply.send({
            status: 'user_not_found',
            email,
            message: `User ${email} not found in database`,
          });
        }

        // Import argon2 here
        const argon2 = await import('argon2');

        // Test password
        const isValid = await argon2.default.verify(user.password, password);

        return reply.send({
          status: 'ok',
          found: true,
          email: user.email,
          passwordMatches: isValid,
          passwordTestResult: isValid ? '✅ Password is correct' : '❌ Password does not match',
          userCreatedAt: user.createdAt.toISOString(),
          userUpdatedAt: user.updatedAt.toISOString(),
          hashLength: user.password.length,
          hashPrefix: user.password.substring(0, 50),
        });
      } catch (error) {
        request.log.error(error, 'Login test error');
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}
