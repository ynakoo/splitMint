const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const users = await prisma.user.findMany({ 
    include: { 
      participants: {
        include: {
          group: true
        }
      } 
    } 
  });
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));
  
  const expenses = await prisma.expense.findMany({
    include: {
      payer: true,
      splits: { include: { participant: true } }
    }
  });
  console.log('--- EXPENSES ---');
  console.log(JSON.stringify(expenses, null, 2));
  await prisma.$disconnect();
}
check().catch(console.error);
