import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding test notification...");
  
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.log("No user found.");
    return;
  }

  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      type: "SYSTEM",
      message: "This is a test notification from the system.",
      isRead: false,
    }
  });

  console.log(`Notification created for user ${user.email}:`, notification);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
