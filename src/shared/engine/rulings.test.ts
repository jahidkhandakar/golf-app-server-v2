import { test } from "node:test";
import assert from "node:assert/strict";
import {
  breakTournamentTie,
  rankTournament,
  resolveChallengeByScore,
  skinsCarried,
} from "./rulings";

// Helper: 18 holes all par-4 (=4) except overrides by 1-based hole number.
const card = (overrides: Record<number, number> = {}): number[] =>
  Array.from({ length: 18 }, (_, i) => overrides[i + 1] ?? 4);

test("tiebreak: better back 9 wins", () => {
  const a = card({ 10: 3 }); // one shot better on the back 9
  const b = card();
  assert.ok(breakTournamentTie(a, b) < 0); // a ranks ahead
  assert.ok(breakTournamentTie(b, a) > 0);
});

test("tiebreak: equal back 9, decided on back 3", () => {
  // Same back-9 total, but differ within the back 3.
  const a = card({ 10: 5, 16: 3 }); // +1 on 10, -1 on 16 → back9 equal, back6 equal? check
  const b = card({ 10: 5, 13: 3 }); // +1 on 10, -1 on 13
  // back9 equal (both +1-1=0). back6 (13-18): a has 16=3 (-1), b has 13=3 (-1) → equal.
  // back3 (16-18): a=3+4+4=11, b=4+4+4=12 → a better.
  assert.ok(breakTournamentTie(a, b) < 0);
});

test("tiebreak: identical cards tie", () => {
  assert.equal(breakTournamentTie(card(), card()), 0);
});

test("rankTournament orders by gross then tiebreak", () => {
  const low = { player: "Low", gross: 70, holes: card() };
  const tieA = { player: "TieA", gross: 72, holes: card({ 10: 3 }) };
  const tieB = { player: "TieB", gross: 72, holes: card() };
  const ranked = rankTournament([tieB, low, tieA]);
  assert.deepEqual(
    ranked.map((r) => r.player),
    ["Low", "TieA", "TieB"],
  );
});

test("challenge tie is a push, decisive scores pick the winner", () => {
  assert.equal(resolveChallengeByScore(72, 72), "push");
  assert.equal(resolveChallengeByScore(71, 74), "p1");
  assert.equal(resolveChallengeByScore(75, 74), "p2");
});

test("skins pot carries when nobody wins", () => {
  assert.equal(skinsCarried(300, 0), 300);
  assert.equal(skinsCarried(300, 4), 0);
});
