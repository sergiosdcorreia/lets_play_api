/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (optional - be careful!)
  await prisma.matchPlayer.deleteMany();
  await prisma.match.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.venue.deleteMany();
  // Don't delete users if you want to keep your test account

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create test users (skip if you want to keep your existing user)
  const user1 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      password: hashedPassword,
      name: "John Doe",
      position: "Forward",
      skillLevel: 7,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      email: "jane@example.com",
      password: hashedPassword,
      name: "Jane Smith",
      position: "Midfielder",
      skillLevel: 8,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "mike@example.com" },
    update: {},
    create: {
      email: "mike@example.com",
      password: hashedPassword,
      name: "Mike Johnson",
      position: "Defender",
      skillLevel: 6,
    },
  });

  console.log("✅ Created/updated test users");

  // Create venues
  const venue1 = await prisma.venue.create({
    data: {
      name: "Downtown Sports Center",
      address: "123 Main St",
      city: "Plymouth",
      surface: "Indoor Turf",
      capacity: 14,
      pricePerHour: 80,
      latitude: 50.3755,
      longitude: -4.1427,
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: "City Indoor Arena",
      address: "456 Sports Ave",
      city: "Plymouth",
      surface: "Indoor Court",
      capacity: 10,
      pricePerHour: 60,
      latitude: 50.3763,
      longitude: -4.1435,
    },
  });

  console.log("✅ Created 2 venues");

  // Create availability for users
  // John is available Monday and Wednesday evenings
  await prisma.availability.createMany({
    data: [
      {
        userId: user1.id,
        dayOfWeek: 1, // Monday
        startTime: "18:00",
        endTime: "21:00",
      },
      {
        userId: user1.id,
        dayOfWeek: 3, // Wednesday
        startTime: "18:00",
        endTime: "21:00",
      },
    ],
  });

  // Jane is available Monday, Wednesday, and Friday evenings
  await prisma.availability.createMany({
    data: [
      {
        userId: user2.id,
        dayOfWeek: 1, // Monday
        startTime: "18:00",
        endTime: "21:00",
      },
      {
        userId: user2.id,
        dayOfWeek: 3, // Wednesday
        startTime: "19:00",
        endTime: "22:00",
      },
      {
        userId: user2.id,
        dayOfWeek: 5, // Friday
        startTime: "18:00",
        endTime: "21:00",
      },
    ],
  });

  // Mike is available Tuesday and Thursday evenings
  await prisma.availability.createMany({
    data: [
      {
        userId: user3.id,
        dayOfWeek: 2, // Tuesday
        startTime: "19:00",
        endTime: "22:00",
      },
      {
        userId: user3.id,
        dayOfWeek: 4, // Thursday
        startTime: "18:00",
        endTime: "21:00",
      },
    ],
  });

  console.log("✅ Created availability for all users");

  // Create a sample match (next Monday at 7pm)
  const nextMonday = new Date();
  nextMonday.setDate(
    nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7)
  );
  nextMonday.setHours(19, 0, 0, 0);

  const match = await prisma.match.create({
    data: {
      date: nextMonday,
      duration: 90,
      venueId: venue1.id,
      status: "scheduled",
      notes: "Friendly match - all skill levels welcome",
      createdById: user1.id,
    },
  });

  // Add players to the match
  await prisma.matchPlayer.createMany({
    data: [
      {
        matchId: match.id,
        userId: user1.id,
        status: "confirmed",
      },
      {
        matchId: match.id,
        userId: user2.id,
        status: "confirmed",
      },
      {
        matchId: match.id,
        userId: user3.id,
        status: "pending",
      },
    ],
  });

  console.log("✅ Created sample match with players");
  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
