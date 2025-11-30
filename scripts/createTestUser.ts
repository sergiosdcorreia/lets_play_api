import { prisma } from "../src/utils/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "john@example.com";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      name: "John Doe",
      password: hashedPassword,
      role: "PLAYER",
    },
  });

  console.log(`User created/updated: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
