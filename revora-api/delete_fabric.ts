import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:RevoraSecureAdmin123!@127.0.0.1:5432/revora?host=/cloudsql/revora-496714:us-central1:revora-db"
    }
  }
});

async function main() {
  const fabric = await prisma.fabric.findFirst({
    where: { name: { contains: 'Organic Silk Charmeuse' } }
  });
  if (fabric) {
    await prisma.fabric.delete({ where: { id: fabric.id } });
    console.log(`Deleted fabric: ${fabric.name}`);
  } else {
    console.log('Fabric not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
