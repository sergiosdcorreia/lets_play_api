import { prisma } from "../utils/prisma";

async function listTeams() {
  try {
    const teams = await prisma.team.findMany({
      select: { id: true, name: true },
    });
    console.log("Teams:", teams);
  } catch (error) {
    console.error("Error listing teams:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listTeams();
