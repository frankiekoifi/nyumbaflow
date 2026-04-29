const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Change this email to the user you want to reset
    const email = "francisochieng700@gmail.com";
    const newPassword = "password123";

    console.log(`🔐 Resetting password for: ${email}`);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      console.log(`❌ User with email ${email} not found!`);
      console.log("\nAvailable users:");
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, role: true },
      });
      console.table(allUsers);
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✅ Password reset successful!`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 New password: ${newPassword}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🎭 Role: ${user.role}`);
  } catch (error) {
    console.error("❌ Error resetting password:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
