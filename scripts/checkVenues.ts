import { prisma } from "../src/utils/prisma";

async function main() {
  const venues = await prisma.venue.findMany({ take: 5 });
  console.log(`Found ${venues.length} venues.`);
  if (venues.length > 0) {
    console.log(venues[0]);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
