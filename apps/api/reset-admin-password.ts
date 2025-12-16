import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'michael@shotbymizu.co.uk';
  const newPassword = '#Admin:123';

  try {
    // Hash the password
    const hashedPassword = await argon2.hash(newPassword);

    // Update the user
    const user = await prisma.adminUser.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    console.log(`✅ Password updated successfully for ${email}`);
    console.log(`   You can now log in with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
