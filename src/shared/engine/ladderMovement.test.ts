import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyChallengeResult,
  enterNewPlayer,
  applyDeclinePenalty,
  LadderEntry,
} from "./ladderMovement";

const ladder = (ids: string[]): LadderEntry[] =>
  ids.map((userId, i) => ({ userId, position: i + 1 }));

const order = (l: LadderEntry[]) =>
  [...l].sort((a, b) => a.position - b.position).map((e) => e.userId);

test("winner takes loser's slot; loser drops min(5, distance)", () => {
  // A B C D E F G H  (1..8). G (7) beats C (3). distance=4, drop=4.
  const result = applyChallengeResult(
    ladder(["A", "B", "C", "D", "E", "F", "G", "H"]),
    "G",
    "C",
  );
  // G takes slot 3; C drops 4 from rank 3 -> rank 7.
  assert.deepEqual(order(result), ["A", "B", "G", "D", "E", "F", "C", "H"]);
});

test("drop is capped at 5", () => {
  // 10 players; #10 beats #1. distance 9 -> drop capped 5. loser (#1) -> rank 6.
  const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
  const result = applyChallengeResult(ladder(ids), "j", "a");
  assert.equal(result.find((e) => e.userId === "j")!.position, 1);
  assert.equal(result.find((e) => e.userId === "a")!.position, 6);
});

test("no movement when loser ranked at/below winner", () => {
  const result = applyChallengeResult(ladder(["A", "B", "C"]), "A", "C");
  assert.deepEqual(order(result), ["A", "B", "C"]);
});

test("new player entry: beating top half enters at midpoint", () => {
  const result = enterNewPlayer(
    ladder(["a", "b", "c", "d", "e", "f", "g", "h"]),
    "NEW",
    2,
  );
  // n=8, midpoint=4 -> enter at rank 4.
  assert.equal(result.find((e) => e.userId === "NEW")!.position, 4);
});

test("decline penalty drops 3, floored at bottom", () => {
  const result = applyDeclinePenalty(ladder(["A", "B", "C", "D", "E"]), "B");
  assert.equal(result.find((e) => e.userId === "B")!.position, 5);
});
