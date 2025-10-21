import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  /**
   * Hash a password using Argon2
   */
  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Authenticate a user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<SessionData | null> {
    const { email, password } = credentials;

    // Find user by email
    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await this.verifyPassword(user.password, password);

    if (!isValid) {
      return null;
    }

    // Return session data (without password)
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'SUPER_ADMIN', // Default role since role field was also removed
    };
  }

  /**
   * Create a session token in the database
   */
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    // Generate secure random token
    const token = randomBytes(32).toString('hex');

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store session in database
    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return token;
  }

  /**
   * Validate a session token
   */
  static async validateSession(token: string): Promise<SessionData | null> {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.session.delete({ where: { token } });
      return null;
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: 'SUPER_ADMIN', // Default role
    };
  }

  /**
   * Delete a session (logout)
   */
  static async deleteSession(token: string): Promise<void> {
    await prisma.session.delete({
      where: { token },
    }).catch(() => {
      // Ignore errors if session doesn't exist
    });
  }

  /**
   * Delete all sessions for a user
   */
  static async deleteAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}