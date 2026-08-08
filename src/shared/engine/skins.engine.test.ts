import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeSkins,
  computeContestValues,
  EngineContestConfig,
  EnginePlayerScore,
} from "./skins.engine";

const baseConfig = (
  over: Partial<EngineContestConfig> = {},
): EngineContestConfig => ({
  holePars: Array<number>(18).fill(4),
  payoutMode: "poolSplit",
  skinsPot: 180,
  skinsDeductMidPercent: 0,
  skinsDeductPlusPercent: 0,
  skinsOptOut: [],
  guests: [],
  guestsInSideGames: false,
  ...over,
});

const onHole1 = (name: string, strokes: number): EnginePlayerScore => {
  const holes = Array<number>(18).fill(0);
  holes[0] = strokes;
  return { playerName: name, holes };
};

const hole1 = (rs: ReturnType<typeof computeSkins>) =>
  rs.find((r) => r.hole === 1);

test("lone birdie beats a par", () => {
  const rs = computeSkins([onHole1("Ana", 3), onHole1("Ben", 4)], baseConfig());
  assert.equal(hole1(rs)?.winner, "Ana");
  assert.equal(hole1(rs)?.wonWithPar, false);
});

test("tie at birdie cuts the hole (no winner)", () => {
  const rs = computeSkins([onHole1("Ana", 3), onHole1("Ben", 3)], baseConfig());
  assert.equal(hole1(rs), undefined);
});

test("lone par takes an otherwise-open hole", () => {
  const rs = computeSkins([onHole1("Ana", 4), onHole1("Ben", 5)], baseConfig());
  assert.equal(hole1(rs)?.winner, "Ana");
  assert.equal(hole1(rs)?.wonWithPar, true);
});

test("opted-out player can neither win nor cut", () => {
  // Both birdie: normally a cut. Opting Ben out leaves Ana a lone birdie.
  const rs = computeSkins(
    [onHole1("Ana", 3), onHole1("Ben", 3)],
    baseConfig({ skinsOptOut: ["Ben"] }),
  );
  assert.equal(hole1(rs)?.winner, "Ana");
});

test("guests excluded by default, included when flag is on", () => {
  const scores = [onHole1("Ana", 3), onHole1("Gus", 3)];
  assert.equal(
    hole1(computeSkins(scores, baseConfig({ guests: ["Gus"] })))?.winner,
    "Ana",
  );
  assert.equal(
    hole1(
      computeSkins(
        scores,
        baseConfig({ guests: ["Gus"], guestsInSideGames: true }),
      ),
    ),
    undefined,
  );
});

test("poolSplit divides the pot across skins won", () => {
  // Ana wins hole 1 (birdie), Ben wins hole 2 (birdie). Pot 180 / 2 = 90 each.
  const a = { playerName: "Ana", holes: [3, 4, ...Array<number>(16).fill(0)] };
  const b = { playerName: "Ben", holes: [4, 3, ...Array<number>(16).fill(0)] };
  const rs = computeSkins([a, b], baseConfig());
  assert.equal(rs.length, 2);
  assert.equal(rs[0].value, 90);
  assert.equal(rs[1].value, 90);
});

test("deduction: 0-5.5 winner gives up mid band, redistributed to 5.6+ winner", () => {
  // Ana (hcp 3.0) wins hole 1, Ben (hcp 10) wins hole 2. poolSplit 180 -> 90 each.
  // Mid band 20%: Ana gives up 18 -> keeps 72; Ben receives the 18 -> 108.
  const a = { playerName: "Ana", holes: [3, 4, ...Array<number>(16).fill(0)] };
  const b = { playerName: "Ben", holes: [4, 3, ...Array<number>(16).fill(0)] };
  const rs = computeSkins([a, b], baseConfig({ skinsDeductMidPercent: 20 }), {
    Ana: 3.0,
    Ben: 10.0,
  });
  const ana = rs.find((r) => r.winner === "Ana")!;
  const ben = rs.find((r) => r.winner === "Ben")!;
  assert.equal(ana.value, 72);
  assert.equal(ana.deductPercent, 20);
  assert.equal(ben.value, 108);
  assert.equal(ben.deductPercent, 0);
});

test("deduction undone when no 5.6+ winner exists to receive it", () => {
  // Only winner is Ana at hcp 3.0. Nobody at 5.6+, so she keeps the full 180.
  const rs = computeSkins(
    [onHole1("Ana", 3), onHole1("Ben", 5)],
    baseConfig({ skinsDeductMidPercent: 20 }),
    { Ana: 3.0 },
  );
  assert.equal(hole1(rs)?.value, 180);
  assert.equal(hole1(rs)?.deductPercent, 0);
});

test("contest values: carryover rolls unwon holes forward", () => {
  // KP holes 3,7,11; only hole 7 won. pot 90 / 3 = 30 nominal. Hole 3 unwon
  // carries into 7 -> 60; hole 11 unwon carries after, redistributed to won.
  const values = computeContestValues({
    eligibleHoles: [3, 7, 11],
    wonHoles: new Set([7]),
    pot: 90,
    mode: "carryover",
  });
  assert.equal(values.get(7), 90); // 30 (own) + 30 (from 3) + 30 (from 11)
});
