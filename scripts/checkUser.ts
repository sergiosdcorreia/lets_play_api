import { prisma } from "../src/utils/prisma";

async function main() {
  const email = "john@example.com";
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log(`User found: ${user.email}`);
    console.log(`ID: ${user.id}`);
  } else {
    console.log(`User not found: ${email}`);
    
    // List all users to see who is available
    const allUsers = await prisma.user.findMany({
        take: 5,
        select: { email: true }
    });
    console.log("Available users:", allUsers.map(u => u.email));
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
