import { Types } from "mongoose";
import { Tournament } from "../models/tournament/tournament.model";
import { TournamentResult } from "../models/tournament-result/tournament.result.model";
import { User } from "../models/user/user.model";

const calculateClubHandicap = async (
  clubId: Types.ObjectId | string,
): Promise<boolean> => {
  // get last 20 tournaments (not just 8)
  const tournaments = await Tournament.find({
    club: clubId,
    status: "completed",
    typeName: "big",
  })
    .sort({ createdAt: -1 })
    .limit(20);

  if (tournaments.length < 8) {
    return null as any;
  }

  const tournamentIds = tournaments.map((t) => t._id);

  const results = await TournamentResult.find({
    tournament: { $in: tournamentIds },
  });

  const resultMap = new Map<string, any>();
  results.forEach((r: any) => {
    resultMap.set(r.tournament.toString(), r);
  });

  // collect all players
  const playerSet = new Set<string>();
  tournaments.forEach((t) => {
    t.tournamentPlayersList.forEach((p: any) => playerSet.add(p.toString()));
  });

  const players = Array.from(playerSet);

  console.log("Players to calculate handicap for:", players);

  for (const playerId of players) {
    const differentials: number[] = [];

    for (const t of tournaments) {
      const result = resultMap.get(t._id.toString());
      if (!result) continue;

      const playerScore = result.playerScores.find(
        (p: any) => p.user.toString() === playerId,
      );

      if (!playerScore) continue;

      const score = playerScore.score;
      if (!score || !t.courseRating || !t.slopeRating) continue;

      console.log(
        "Player score data:",
        score,
        "CR :",
        t.courseRating,
        "SR :",
        t.slopeRating,
      );

      // PCC support (optional)
      const pcc = t.playingConditionAdjustment || 0;

      const diff = ((score - t.courseRating) * 113) / t.slopeRating + pcc;

      console.log("Calculated differential for player", playerId, ":", diff);

      differentials.push(Number(diff.toFixed(1)));
    }

    const rounds = differentials.length;

    // your rule: minimum 8
    if (rounds < 8) continue;

    // sort best first
    differentials.sort((a, b) => a - b);

    // dynamic selection
    let useCount: number;

    if (rounds <= 8) useCount = 2;
    else if (rounds <= 11) useCount = 3;
    else if (rounds <= 14) useCount = 4;
    else if (rounds <= 16) useCount = 5;
    else if (rounds <= 18) useCount = 6;
    else if (rounds === 19) useCount = 7;
    else useCount = 8;

    const bestDiffs = differentials.slice(0, useCount);

    console.log(
      `Player ${playerId} - Rounds: ${rounds}, Using best : ${useCount}, Best diffs:`,
      bestDiffs,
    );

    const avg = bestDiffs.reduce((sum, v) => sum + v, 0) / bestDiffs.length;

    console.log("Average of best diffs for player", playerId, ":", avg);

    // official multiplier
    const handicapIndex = Number((avg * 0.96).toFixed(1));

    console.log(
      "official handicap index for player",
      playerId,
      ":",
      handicapIndex,
    );

    // clamp
    const finalHandicap = Math.max(0, handicapIndex);

    console.log(
      "Final handicap index for player",
      playerId,
      ":",
      finalHandicap,
    );

    await User.findByIdAndUpdate(playerId, {
      clubHandicap: finalHandicap,
    });
  }

  return true;
};

export default calculateClubHandicap;
