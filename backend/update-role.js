const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.update({
    where: { email: 'landlord@nyumbaflow.com' },
    data: { role: 'LANDLORD' }
  });
  console.log('Updated user:', result.email, '-> Role:', result.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());