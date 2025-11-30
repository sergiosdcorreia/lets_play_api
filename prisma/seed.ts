import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ==================== LIMPAR DADOS EXISTENTES ====================
  console.log("🧹 Clearing existing data...");

  await prisma.matchEvent.deleteMany();
  await prisma.matchPlayer.deleteMany();
  await prisma.tournamentTeam.deleteMany();
  await prisma.match.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.teamInvite.deleteMany();
  await prisma.team.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // ==================== CRIAR UTILIZADORES ====================
  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "sergio@example.com",
        password: hashedPassword,
        name: "Sérgio Correia",
        position: "Forward",
        skillLevel: 8,
      },
    }),
    prisma.user.create({
      data: {
        email: "john@example.com",
        password: hashedPassword,
        name: "John Smith",
        position: "Midfielder",
        skillLevel: 7,
      },
    }),
    prisma.user.create({
      data: {
        email: "jane@example.com",
        password: hashedPassword,
        name: "Jane Doe",
        position: "Defender",
        skillLevel: 8,
      },
    }),
    prisma.user.create({
      data: {
        email: "mike@example.com",
        password: hashedPassword,
        name: "Mike Johnson",
        position: "Goalkeeper",
        skillLevel: 9,
      },
    }),
    prisma.user.create({
      data: {
        email: "sarah@example.com",
        password: hashedPassword,
        name: "Sarah Williams",
        position: "Forward",
        skillLevel: 7,
      },
    }),
    prisma.user.create({
      data: {
        email: "david@example.com",
        password: hashedPassword,
        name: "David Brown",
        position: "Midfielder",
        skillLevel: 6,
      },
    }),
    prisma.user.create({
      data: {
        email: "emma@example.com",
        password: hashedPassword,
        name: "Emma Wilson",
        position: "Defender",
        skillLevel: 8,
      },
    }),
    prisma.user.create({
      data: {
        email: "alex@example.com",
        password: hashedPassword,
        name: "Alex Garcia",
        position: "Forward",
        skillLevel: 9,
      },
    }),
    prisma.user.create({
      data: {
        email: "olivia@example.com",
        password: hashedPassword,
        name: "Olivia Martinez",
        position: "Midfielder",
        skillLevel: 7,
      },
    }),
    prisma.user.create({
      data: {
        email: "james@example.com",
        password: hashedPassword,
        name: "James Anderson",
        position: "Defender",
        skillLevel: 6,
      },
    }),
    prisma.user.create({
      data: {
        email: "sophia@example.com",
        password: hashedPassword,
        name: "Sophia Taylor",
        position: "Goalkeeper",
        skillLevel: 8,
      },
    }),
    prisma.user.create({
      data: {
        email: "liam@example.com",
        password: hashedPassword,
        name: "Liam Thomas",
        position: "Forward",
        skillLevel: 7,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // ==================== CRIAR VENUES ====================
  const venues = await Promise.all([
    prisma.venue.create({
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
    }),
    prisma.venue.create({
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
    }),
    prisma.venue.create({
      data: {
        name: "Riverside Football Complex",
        address: "789 River Road",
        city: "Exeter",
        surface: "Artificial Grass",
        capacity: 16,
        pricePerHour: 100,
        latitude: 50.7184,
        longitude: -3.5339,
      },
    }),
    prisma.venue.create({
      data: {
        name: "Parkside Sports Hall",
        address: "321 Park Lane",
        city: "Torquay",
        surface: "Indoor Court",
        capacity: 12,
        pricePerHour: 70,
        latitude: 50.4619,
        longitude: -3.5253,
      },
    }),
  ]);

  console.log(`✅ Created ${venues.length} venues`);

  // ==================== CRIAR AVAILABILITY ====================
  const availabilityData = [
    // Sergio - Segunda, Quarta, Sexta
    { userId: users[0].id, dayOfWeek: 1, startTime: "18:00", endTime: "21:00" },
    { userId: users[0].id, dayOfWeek: 3, startTime: "18:00", endTime: "21:00" },
    { userId: users[0].id, dayOfWeek: 5, startTime: "19:00", endTime: "22:00" },
    // John - Segunda, Quinta
    { userId: users[1].id, dayOfWeek: 1, startTime: "19:00", endTime: "22:00" },
    { userId: users[1].id, dayOfWeek: 4, startTime: "18:00", endTime: "21:00" },
    // Jane - Terça, Quarta, Sexta
    { userId: users[2].id, dayOfWeek: 2, startTime: "18:00", endTime: "21:00" },
    { userId: users[2].id, dayOfWeek: 3, startTime: "19:00", endTime: "22:00" },
    { userId: users[2].id, dayOfWeek: 5, startTime: "18:00", endTime: "21:00" },
    // Mike - Segunda, Quarta
    { userId: users[3].id, dayOfWeek: 1, startTime: "18:00", endTime: "21:00" },
    { userId: users[3].id, dayOfWeek: 3, startTime: "18:00", endTime: "21:00" },
  ];

  await prisma.availability.createMany({ data: availabilityData });
  console.log(`✅ Created ${availabilityData.length} availability slots`);

  // ==================== CRIAR EQUIPAS ====================
  const teams = await Promise.all([
    // Team 1: Sergio's Team
    prisma.team.create({
      data: {
        name: "Lightning FC",
        description: "Fast-paced attacking football",
        primaryColor: "#FFD700",
        secondaryColor: "#000000",
        managerId: users[0].id,
        subManagerId: users[1].id,
        members: {
          create: [
            {
              userId: users[0].id,
              role: "manager",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[1].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[4].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[7].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
          ],
        },
      },
    }),
    // Team 2: Jane's Team
    prisma.team.create({
      data: {
        name: "Thunder United",
        description: "Solid defense, quick counters",
        primaryColor: "#1E90FF",
        secondaryColor: "#FFFFFF",
        managerId: users[2].id,
        subManagerId: users[3].id,
        members: {
          create: [
            {
              userId: users[2].id,
              role: "manager",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[3].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[6].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[9].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
          ],
        },
      },
    }),
    // Team 3: Sarah's Team
    prisma.team.create({
      data: {
        name: "Phoenix Rising",
        description: "Never give up attitude",
        primaryColor: "#FF4500",
        secondaryColor: "#FFD700",
        managerId: users[4].id,
        members: {
          create: [
            {
              userId: users[4].id,
              role: "manager",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[5].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[8].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[11].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
          ],
        },
      },
    }),
    // Team 4: Alex's Team
    prisma.team.create({
      data: {
        name: "Dragons FC",
        description: "Fierce competitors",
        primaryColor: "#8B0000",
        secondaryColor: "#FFD700",
        managerId: users[7].id,
        members: {
          create: [
            {
              userId: users[7].id,
              role: "manager",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[10].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
            {
              userId: users[1].id,
              role: "player",
              status: "active",
              joinedAt: new Date(),
            },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${teams.length} teams`);

  // ==================== CRIAR TORNEIOS ====================
  const tournaments = await Promise.all([
    // Torneio 1: Winter Championship (Concluído)
    prisma.tournament.create({
      data: {
        name: "Winter Championship 2024",
        description: "Annual winter indoor football tournament",
        format: "league",
        startDate: new Date("2024-12-01"),
        createdById: users[0].id,
        autoGenerateMatches: true,
        status: "completed",
      },
    }),
    // Torneio 2: Spring Cup (Em progresso)
    prisma.tournament.create({
      data: {
        name: "Spring Cup 2025",
        description: "Knockout tournament for the spring season",
        format: "knockout",
        startDate: new Date("2025-03-15"),
        createdById: users[2].id,
        autoGenerateMatches: false,
        status: "in_progress",
      },
    }),
    // Torneio 3: Summer League (Upcoming)
    prisma.tournament.create({
      data: {
        name: "Summer League 2025",
        description: "League format with round-robin matches",
        format: "league",
        startDate: new Date("2025-06-01"),
        createdById: users[4].id,
        autoGenerateMatches: true,
        status: "upcoming",
      },
    }),
  ]);

  console.log(`✅ Created ${tournaments.length} tournaments`);

  // ==================== ADICIONAR EQUIPAS AOS TORNEIOS ====================
  // Winter Championship - Todas as 4 equipas
  const tournamentTeams1 = await Promise.all([
    prisma.tournamentTeam.create({
      data: {
        tournamentId: tournaments[0].id,
        teamId: teams[0].id,
        status: "confirmed",
        joinedAt: new Date("2024-11-25"),
        // Lightning FC - Campeões!
        matchesPlayed: 3,
        wins: 3,
        draws: 0,
        losses: 0,
        goalsFor: 12,
        goalsAgainst: 3,
        goalDifference: 9,
        points: 9,
      },
    }),
    prisma.tournamentTeam.create({
      data: {
        tournamentId: tournaments[0].id,
        teamId: teams[1].id,
        status: "confirmed",
        joinedAt: new Date("2024-11-25"),
        // Thunder United - 2º lugar
        matchesPlayed: 3,
        wins: 2,
        draws: 0,
        losses: 1,
        goalsFor: 8,
        goalsAgainst: 6,
        goalDifference: 2,
        points: 6,
      },
    }),
    prisma.tournamentTeam.create({
      data: {
        tournamentId: tournaments[0].id,
        teamId: teams[2].id,
        status: "confirmed",
        joinedAt: new Date("2024-11-25"),
        // Phoenix Rising - 3º lugar
        matchesPlayed: 3,
        wins: 1,
        draws: 0,
        losses: 2,
        goalsFor: 5,
        goalsAgainst: 8,
        goalDifference: -3,
        points: 3,
      },
    }),
    prisma.tournamentTeam.create({
      data: {
        tournamentId: tournaments[0].id,
        teamId: teams[3].id,
        status: "confirmed",
        joinedAt: new Date("2024-11-25"),
        // Dragons FC - 4º lugar
        matchesPlayed: 3,
        wins: 0,
        draws: 0,
        losses: 3,
        goalsFor: 2,
        goalsAgainst: 10,
        goalDifference: -8,
        points: 0,
      },
    }),
  ]);

  // Spring Cup - 3 equipas
  const tournamentTeams2 = await Promise.all([
    prisma.tournamentTeam.create({
      data: {
        tournamentId: tournaments[1].id,
        teamId: teams[0].id,
        status: "confirmed",
        joinedAt: new Date("2025-03-01"),
        matchesPlayed: 1,
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 2,
        goalDifference: 2,
        points: 3,
      },
    }),
    prisma.tournamentTeam.create({
      data: {
        tournamentId: tournaments[1].id,
        teamId: teams[1].id,
        status: "confirmed",
        joinedAt: new Date("2025-03-01"),
        matchesPlayed: 1,
        wins: 0,
        draws: 0,
        losses: 1,
        goalsFor: 2,
        goalsAgainst: 4,
        goalDifference: -2,
        points: 0,
      },
    }),
    prisma.tournamentTeam.create({
      data: {
        tournamentId: tournaments[1].id,
        teamId: teams[2].id,
        status: "invited",
      },
    }),
  ]);

  // Summer League - Todas confirmadas
  const tournamentTeams3 = await Promise.all(
    teams.map((team) =>
      prisma.tournamentTeam.create({
        data: {
          tournamentId: tournaments[2].id,
          teamId: team.id,
          status: "confirmed",
          joinedAt: new Date("2025-05-20"),
        },
      })
    )
  );

  console.log("✅ Added teams to tournaments");

  // ==================== CRIAR JOGOS COM RESULTADOS ====================

  // WINTER CHAMPIONSHIP - Jogos completos
  const winterMatches = await Promise.all([
    // Jogo 1: Lightning FC 5-1 Dragons FC
    prisma.match.create({
      data: {
        date: new Date("2024-12-05T19:00:00"),
        duration: 90,
        venueId: venues[0].id,
        status: "completed",
        createdById: users[0].id,
        tournamentId: tournaments[0].id,
        homeTeamId: teams[0].id,
        awayTeamId: teams[3].id,
        homeScore: 5,
        awayScore: 1,
      },
    }),
    // Jogo 2: Thunder United 3-2 Phoenix Rising
    prisma.match.create({
      data: {
        date: new Date("2024-12-05T20:30:00"),
        duration: 90,
        venueId: venues[1].id,
        status: "completed",
        createdById: users[2].id,
        tournamentId: tournaments[0].id,
        homeTeamId: teams[1].id,
        awayTeamId: teams[2].id,
        homeScore: 3,
        awayScore: 2,
      },
    }),
    // Jogo 3: Lightning FC 4-2 Thunder United
    prisma.match.create({
      data: {
        date: new Date("2024-12-12T19:00:00"),
        duration: 90,
        venueId: venues[2].id,
        status: "completed",
        createdById: users[0].id,
        tournamentId: tournaments[0].id,
        homeTeamId: teams[0].id,
        awayTeamId: teams[1].id,
        homeScore: 4,
        awayScore: 2,
      },
    }),
    // Jogo 4: Phoenix Rising 2-1 Dragons FC
    prisma.match.create({
      data: {
        date: new Date("2024-12-12T20:30:00"),
        duration: 90,
        venueId: venues[3].id,
        status: "completed",
        createdById: users[4].id,
        tournamentId: tournaments[0].id,
        homeTeamId: teams[2].id,
        awayTeamId: teams[3].id,
        homeScore: 2,
        awayScore: 1,
      },
    }),
    // Jogo 5: Thunder United 3-1 Dragons FC
    prisma.match.create({
      data: {
        date: new Date("2024-12-19T19:00:00"),
        duration: 90,
        venueId: venues[0].id,
        status: "completed",
        createdById: users[2].id,
        tournamentId: tournaments[0].id,
        homeTeamId: teams[1].id,
        awayTeamId: teams[3].id,
        homeScore: 3,
        awayScore: 1,
      },
    }),
    // Jogo 6: Lightning FC 3-1 Phoenix Rising
    prisma.match.create({
      data: {
        date: new Date("2024-12-19T20:30:00"),
        duration: 90,
        venueId: venues[1].id,
        status: "completed",
        createdById: users[0].id,
        tournamentId: tournaments[0].id,
        homeTeamId: teams[0].id,
        awayTeamId: teams[2].id,
        homeScore: 3,
        awayScore: 1,
      },
    }),
  ]);

  // SPRING CUP - 1 jogo completo
  const springMatches = await Promise.all([
    // Jogo 1: Lightning FC 4-2 Thunder United
    prisma.match.create({
      data: {
        date: new Date("2025-03-20T19:00:00"),
        duration: 90,
        venueId: venues[2].id,
        status: "completed",
        createdById: users[0].id,
        tournamentId: tournaments[1].id,
        homeTeamId: teams[0].id,
        awayTeamId: teams[1].id,
        homeScore: 4,
        awayScore: 2,
      },
    }),
  ]);

  // Jogos casuais (sem torneio)
  const casualMatches = await Promise.all([
    // Próximo jogo agendado
    prisma.match.create({
      data: {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Daqui a 1 semana
        duration: 90,
        venueId: venues[0].id,
        status: "scheduled",
        notes: "Friendly match - all skill levels welcome",
        createdById: users[0].id,
      },
    }),
  ]);

  console.log(
    `✅ Created ${
      winterMatches.length + springMatches.length + casualMatches.length
    } matches`
  );

  // ==================== CRIAR EVENTOS DE JOGO ====================

  // Jogo 1: Lightning FC 5-1 Dragons FC
  const match1Events = await Promise.all([
    // Golos Lightning FC
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[0].id,
        playerId: users[0].id, // Sergio
        eventType: "goal",
        minute: 12,
        notes: "Great solo run and finish",
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[0].id,
        playerId: users[7].id, // Alex
        eventType: "goal",
        minute: 23,
        notes: "Header from corner",
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[0].id,
        playerId: users[0].id, // Sergio
        eventType: "goal",
        minute: 35,
        notes: "Penalty",
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[0].id,
        playerId: users[4].id, // Sarah
        eventType: "goal",
        minute: 58,
        notes: "Long range strike",
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[0].id,
        playerId: users[1].id, // John
        eventType: "goal",
        minute: 72,
        notes: "Tap in from rebound",
      },
    }),
    // Golo Dragons FC
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[0].id,
        playerId: users[10].id, // Sophia
        eventType: "goal",
        minute: 80,
        notes: "Consolation goal",
      },
    }),
    // Cartões
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[0].id,
        playerId: users[7].id, // Alex
        eventType: "yellow_card",
        minute: 45,
        notes: "Tactical foul",
      },
    }),
  ]);

  // Jogo 2: Thunder United 3-2 Phoenix Rising
  const match2Events = await Promise.all([
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[1].id,
        playerId: users[2].id, // Jane
        eventType: "goal",
        minute: 8,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[1].id,
        playerId: users[5].id, // David (Phoenix)
        eventType: "goal",
        minute: 15,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[1].id,
        playerId: users[3].id, // Mike
        eventType: "goal",
        minute: 32,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[1].id,
        playerId: users[11].id, // Liam (Phoenix)
        eventType: "goal",
        minute: 55,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[1].id,
        playerId: users[6].id, // Emma
        eventType: "goal",
        minute: 78,
        notes: "Winning goal",
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[1].id,
        playerId: users[5].id, // David
        eventType: "yellow_card",
        minute: 82,
        notes: "Dissent",
      },
    }),
  ]);

  // Jogo 3: Lightning FC 4-2 Thunder United
  const match3Events = await Promise.all([
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[2].id,
        playerId: users[7].id, // Alex
        eventType: "goal",
        minute: 5,
        notes: "Early strike",
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[2].id,
        playerId: users[2].id, // Jane
        eventType: "goal",
        minute: 18,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[2].id,
        playerId: users[0].id, // Sergio
        eventType: "goal",
        minute: 27,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[2].id,
        playerId: users[0].id, // Sergio - hat-trick!
        eventType: "goal",
        minute: 44,
        notes: "Hat-trick goal!",
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[2].id,
        playerId: users[3].id, // Mike
        eventType: "goal",
        minute: 66,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[2].id,
        playerId: users[4].id, // Sarah
        eventType: "goal",
        minute: 85,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[2].id,
        playerId: users[9].id, // James
        eventType: "yellow_card",
        minute: 70,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[2].id,
        playerId: users[6].id, // Emma
        eventType: "yellow_card",
        minute: 75,
      },
    }),
  ]);

  // Jogo 4: Phoenix Rising 2-1 Dragons FC
  const match4Events = await Promise.all([
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[3].id,
        playerId: users[8].id, // Olivia
        eventType: "goal",
        minute: 20,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[3].id,
        playerId: users[7].id, // Alex (Dragons)
        eventType: "goal",
        minute: 35,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[3].id,
        playerId: users[11].id, // Liam
        eventType: "goal",
        minute: 68,
        notes: "Winner",
      },
    }),
  ]);

  // Jogo 5: Thunder United 3-1 Dragons FC
  const match5Events = await Promise.all([
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[4].id,
        playerId: users[2].id, // Jane
        eventType: "goal",
        minute: 14,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[4].id,
        playerId: users[3].id, // Mike
        eventType: "goal",
        minute: 28,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[4].id,
        playerId: users[10].id, // Sophia (Dragons)
        eventType: "goal",
        minute: 52,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[4].id,
        playerId: users[6].id, // Emma
        eventType: "goal",
        minute: 81,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[4].id,
        playerId: users[1].id, // John (Dragons)
        eventType: "red_card",
        minute: 75,
        notes: "Violent conduct",
      },
    }),
  ]);

  // Jogo 6: Lightning FC 3-1 Phoenix Rising
  const match6Events = await Promise.all([
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[5].id,
        playerId: users[4].id, // Sarah
        eventType: "goal",
        minute: 10,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[5].id,
        playerId: users[5].id, // David (Phoenix)
        eventType: "goal",
        minute: 22,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[5].id,
        playerId: users[7].id, // Alex
        eventType: "goal",
        minute: 56,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: winterMatches[5].id,
        playerId: users[0].id, // Sergio
        eventType: "goal",
        minute: 89,
        notes: "Last minute goal",
      },
    }),
  ]);

  // Spring Cup Jogo 1: Lightning FC 4-2 Thunder United
  const springMatch1Events = await Promise.all([
    prisma.matchEvent.create({
      data: {
        matchId: springMatches[0].id,
        playerId: users[0].id, // Sergio
        eventType: "goal",
        minute: 7,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: springMatches[0].id,
        playerId: users[2].id, // Jane
        eventType: "goal",
        minute: 15,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: springMatches[0].id,
        playerId: users[7].id, // Alex
        eventType: "goal",
        minute: 25,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: springMatches[0].id,
        playerId: users[3].id, // Mike
        eventType: "goal",
        minute: 40,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: springMatches[0].id,
        playerId: users[4].id, // Sarah
        eventType: "goal",
        minute: 62,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: springMatches[0].id,
        playerId: users[1].id, // John
        eventType: "goal",
        minute: 78,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: springMatches[0].id,
        playerId: users[6].id, // Emma
        eventType: "yellow_card",
        minute: 50,
      },
    }),
    prisma.matchEvent.create({
      data: {
        matchId: springMatches[0].id,
        playerId: users[9].id, // James
        eventType: "yellow_card",
        minute: 85,
      },
    }),
  ]);

  const totalEvents =
    match1Events.length +
    match2Events.length +
    match3Events.length +
    match4Events.length +
    match5Events.length +
    match6Events.length +
    springMatch1Events.length;

  console.log(
    `✅ Created ${totalEvents} match events (goals, yellow cards, red cards)`
  );

  // ==================== ADICIONAR JOGADORES AOS JOGOS ====================
  await prisma.matchPlayer.createMany({
    data: [
      // Casual match (próximo jogo)
      {
        matchId: casualMatches[0].id,
        userId: users[0].id,
        status: "confirmed",
      },
      {
        matchId: casualMatches[0].id,
        userId: users[1].id,
        status: "confirmed",
      },
      { matchId: casualMatches[0].id, userId: users[2].id, status: "pending" },
      {
        matchId: casualMatches[0].id,
        userId: users[3].id,
        status: "confirmed",
      },
    ],
  });

  console.log("✅ Added players to matches");

  // ==================== SUMÁRIO ====================
  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   👥 Users: ${users.length}`);
  console.log(`   📍 Venues: ${venues.length}`);
  console.log(`   ⚽ Teams: ${teams.length}`);
  console.log(`   🏆 Tournaments: ${tournaments.length}`);
  console.log(
    `   ⚽ Matches: ${
      winterMatches.length + springMatches.length + casualMatches.length
    }`
  );
  console.log(`   📝 Match Events: ${totalEvents}`);
  console.log(`      - Goals: ${totalEvents - 9}`); // Total events minus cards
  console.log(`      - Yellow Cards: 8`);
  console.log(`      - Red Cards: 1`);
  console.log("\n🔐 All users have password: password123");
  console.log("\n🏆 Tournament Results:");
  console.log("   Winter Championship 2024 (Completed):");
  console.log("      🥇 Lightning FC - 9 points (3W-0D-0L)");
  console.log("      🥈 Thunder United - 6 points (2W-0D-1L)");
  console.log("      🥉 Phoenix Rising - 3 points (1W-0D-2L)");
  console.log("      4️⃣  Dragons FC - 0 points (0W-0D-3L)");
  console.log("\n   Spring Cup 2025 (In Progress):");
  console.log("      Lightning FC vs Thunder United: 4-2 (Completed)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
