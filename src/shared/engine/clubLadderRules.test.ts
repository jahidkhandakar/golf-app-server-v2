import { test } from "node:test";
import assert from "node:assert/strict";
import { ClubLadderRules, canChallenge } from "./clubLadderRules";

test("challenge range: 30% clamped to [3,15]", () => {
  assert.equal(new ClubLadderRules(5).challengeRange, 3); // 1.5→round 2, floor 3
  assert.equal(new ClubLadderRules(20).challengeRange, 6); // 6
  assert.equal(new ClubLadderRules(60).challengeRange, 15); // 18→ceiling 15
});

test("scaling thresholds", () => {
  assert.equal(new ClubLadderRules(7).isActive, false);
  assert.equal(new ClubLadderRules(8).isActive, true);
  assert.equal(new ClubLadderRules(14).showBottom5, false);
  assert.equal(new ClubLadderRules(15).showBottom5, true);
  assert.equal(new ClubLadderRules(24).top10GateActive, false);
  assert.equal(new ClubLadderRules(25).top10GateActive, true);
});

test("entry positions", () => {
  assert.equal(new ClubLadderRules(10).entryTopHalf, 5);
  assert.equal(new ClubLadderRules(9).entryTopHalf, 5); // ceil(4.5)
  assert.equal(new ClubLadderRules(10).entryBottomHalf, 9); // round(9)
});

test("canChallenge: inactive ladder blocks everything", () => {
  const r = canChallenge(1, 2, 5);
  assert.equal(r.allowed, false);
});

test("canChallenge: within range allowed, outside rejected", () => {
  // 20 ranked → range 6.
  assert.equal(canChallenge(3, 9, 20).allowed, true); // gap 6
  assert.equal(canChallenge(3, 10, 20).allowed, false); // gap 7
  assert.equal(canChallenge(5, 5, 20).allowed, false); // self
});
