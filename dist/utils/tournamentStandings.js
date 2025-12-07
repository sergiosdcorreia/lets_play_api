"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTournamentStandings = updateTournamentStandings;
exports.recalculateTournamentStandings = recalculateTournamentStandings;
const prisma_1 = require("./prisma");
async function updateTournamentStandings(result) {
    const { matchId, homeTeamId, awayTeamId, homeScore, awayScore } = result;
    // Get the match to find tournament
    const match = await prisma_1.prisma.match.findUnique({
        where: { id: matchId },
        select: { tournamentId: true },
    });
    if (!match || !match.tournamentId) {
        console.log("Match is not part of a tournament, skipping standings update");
        return;
    }
    const tournamentId = match.tournamentId;
    // Determine result
    let homeWin = 0, homeDraw = 0, homeLoss = 0;
    let awayWin = 0, awayDraw = 0, awayLoss = 0;
    let homePoints = 0, awayPoints = 0;
    if (homeScore > awayScore) {
        // Home team wins
        homeWin = 1;
        awayLoss = 1;
        homePoints = 3;
        awayPoints = 0;
    }
    else if (homeScore < awayScore) {
        // Away team wins
        homeLoss = 1;
        awayWin = 1;
        homePoints = 0;
        awayPoints = 3;
    }
    else {
        // Draw
        homeDraw = 1;
        awayDraw = 1;
        homePoints = 1;
        awayPoints = 1;
    }
    const goalDifferenceHome = homeScore - awayScore;
    const goalDifferenceAway = awayScore - homeScore;
    // Update home team stats
    const homeTeamStats = await prisma_1.prisma.tournamentTeam.findFirst({
        where: {
            tournamentId,
            teamId: homeTeamId,
        },
    });
    if (homeTeamStats) {
        await prisma_1.prisma.tournamentTeam.update({
            where: { id: homeTeamStats.id },
            data: {
                matchesPlayed: { increment: 1 },
                wins: { increment: homeWin },
                draws: { increment: homeDraw },
                losses: { increment: homeLoss },
                goalsFor: { increment: homeScore },
                goalsAgainst: { increment: awayScore },
                goalDifference: { increment: goalDifferenceHome },
                points: { increment: homePoints },
            },
        });
    }
    // Update away team stats
    const awayTeamStats = await prisma_1.prisma.tournamentTeam.findFirst({
        where: {
            tournamentId,
            teamId: awayTeamId,
        },
    });
    if (awayTeamStats) {
        await prisma_1.prisma.tournamentTeam.update({
            where: { id: awayTeamStats.id },
            data: {
                matchesPlayed: { increment: 1 },
                wins: { increment: awayWin },
                draws: { increment: awayDraw },
                losses: { increment: awayLoss },
                goalsFor: { increment: awayScore },
                goalsAgainst: { increment: homeScore },
                goalDifference: { increment: goalDifferenceAway },
                points: { increment: awayPoints },
            },
        });
    }
    console.log(`✅ Updated tournament standings for match ${matchId}`);
    console.log(`   Home (${homeTeamId}): ${homeScore} - Away (${awayTeamId}): ${awayScore}`);
    console.log(`   Points: Home +${homePoints}, Away +${awayPoints}`);
}
// Helper to recalculate all standings from scratch (useful for corrections)
async function recalculateTournamentStandings(tournamentId) {
    // Reset all team stats to zero
    await prisma_1.prisma.tournamentTeam.updateMany({
        where: { tournamentId },
        data: {
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
        },
    });
    // Get all completed matches in the tournament
    const matches = await prisma_1.prisma.match.findMany({
        where: {
            tournamentId,
            status: "completed",
            homeScore: { not: null },
            awayScore: { not: null },
        },
    });
    // Update standings for each match
    for (const match of matches) {
        if (match.homeTeamId &&
            match.awayTeamId &&
            match.homeScore !== null &&
            match.awayScore !== null) {
            await updateTournamentStandings({
                matchId: match.id,
                homeTeamId: match.homeTeamId,
                awayTeamId: match.awayTeamId,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
            });
        }
    }
    console.log(`✅ Recalculated all standings for tournament ${tournamentId}`);
}
