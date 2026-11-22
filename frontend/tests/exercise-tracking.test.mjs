import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function importSource(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import("data:text/javascript;charset=utf-8," + encodeURIComponent(outputText));
}

const [{ EXERCISE_GUIDES }, { ExerciseSession }, { analyzePose, calcAngle, getTrackingUnavailableReason, judgeLevel }] =
  await Promise.all([
    importSource("../src/data/exerciseGuides.ts"),
    importSource("../src/utils/exerciseSession.ts"),
    importSource("../src/utils/pose.ts"),
  ]);

const exercises = JSON.parse(readFileSync(new URL("../../backend/src/main/resources/exercises.json", import.meta.url), "utf8"));
const left = { nose: 0, ear: 3, s: 5, e: 7, w: 9, h: 11, k: 13, a: 15 };
const right = { nose: 0, ear: 4, s: 6, e: 8, w: 10, h: 12, k: 14, a: 16 };

function pose(leftSide = {}, rightSide = {}) {
  const points = Array.from({ length: 17 }, () => ({ x: 0, y: 0, score: 0 }));
  for (const [body, indices] of [[leftSide, left], [rightSide, right]]) {
    for (const [joint, [x, y]] of Object.entries(body)) {
      points[indices[joint]] = { x: x + 230, y: y + 160, score: 0.99 };
    }
  }
  return points;
}

function both(body) {
  const other = Object.fromEntries(Object.entries(body).map(([joint, [x, y]]) => [joint, [x + 14, y + 4]]));
  return pose(body, other);
}

// Each entry supplies the intended posture, the audited compensation, and the observed release.
const front = { s: [0, 0], h: [0, 60], k: [45, 60], e: [40, 0], w: [80, 0] };
const chest = { ...front, e: [35, 8], w: [70, 0] };
const droppedArms = { e: [0, 35], w: [0, 70] };
const curl = { s: [0, 0], h: [0, 65], e: [1, 30], w: [12, 3] };
const overhead = { s: [0, 0], nose: [0, -35], e: [0, -27], w: [0, -60] };
const legExtension = { s: [0, -50], h: [0, 0], k: [48, 0], a: [92, 0] };
const march = { s: [0, -52], h: [0, 0], k: [36, -20], a: [36, 28] };
const bow = { s: [25, -45], h: [0, 0], k: [40, 0], a: [40, 45] };
const seatedTuck = { s: [0, -52], h: [0, 0], k: [40, -27], w: [43, -25] };
const sideBend = { s: [27, -38], h: [0, 0], k: [0, 48], w: [38, -70], nose: [30, -55] };
const bowWithStraightLeg = { ...bow, a: [83, 0] };
const pushup = { s: [0, 0], h: [0, 50], a: [0, 100], w: [42, 0], e: [22, 22], nose: [17, -27], ear: [3, -23] };
const squat = { h: [-35, -12], k: [0, 0], a: [-8, 44] };
const standing = { h: [0, -44], k: [0, 0], a: [0, 42] };
const sideLeg = { s: [0, -55], h: [0, 0], k: [-18, 40] };
const supportHip = { h: [20, 0] };
const legCurl = { h: [0, 0], k: [0, 42], a: [-36, 42], ear: [0, -22], nose: [15, -21] };
const slide = { s: [0, 0], h: [0, 60], e: [12, -40], w: [15, -68] };
const lungeFront = { h: [0, -5], k: [43, 8], a: [38, 62], nose: [19, -30], ear: [3, -25] };
const lungeRear = { h: [4, 0], k: [16, 55], a: [-38, 77] };
const wallSquat = { s: [0, -50], h: [0, 0], k: [40, 10], a: [49, 54], nose: [15, -65], ear: [0, -63] };
const bridge = { s: [-50, 0], h: [0, -25], k: [47, -41], a: [35, 26] };
const lyingArms = { s: [-45, 0], h: [0, 0], e: [-80, 0], w: [-119, 0] };
const lyingTuck = { s: [-50, 0], h: [0, 0], k: [-20, -40], w: [-20, -38] };
const lyingLeg = { s: [-55, 0], h: [0, 0], k: [36, -36], a: [72, -72] };
const swan = { s: [-40, -22], h: [0, 0], k: [40, 0] };
const birdLeg = { s: [-50, 0], h: [0, 0], k: [50, 0], a: [94, 0] };
const birdArm = { s: [-50, 5], h: [0, 5], e: [-83, 5], w: [-116, 5], k: [0, 50] };
const heelTouch = { s: [-46, -18], h: [0, 0], k: [32, -28], a: [51, 0], w: [35, 5] };
const flatHeelTouch = { ...heelTouch, s: [-45, 0], w: [-55, 13] };

const cases = {
  "seated-front-raise": [
    both(front), both({ ...front, w: [40, -40] }), both({ ...front, ...droppedArms }),
  ],
  "seated-lateral-raise": [
    pose({ s: [-20, 0], h: [-20, 60], e: [-60, 0] }, { s: [20, 0], h: [20, 60], e: [60, 0] }),
    pose({ s: [-20, 0], h: [-20, 60], e: [-60, 0] }, { s: [20, 0], h: [20, 60], e: [20, 35] }),
    pose({ s: [-20, 0], h: [-20, 60], e: [-20, 35] }, { s: [20, 0], h: [20, 60], e: [20, 35] }),
  ],
  "seated-chest-press": [
    both(chest), both({ ...chest, ...droppedArms }), both({ ...chest, e: [30, 12], w: [12, 6] }),
  ],
  "seated-biceps-curl": [
    both(curl), both({ ...curl, e: [35, 0], w: [5, -23] }), both({ ...curl, w: [1, 60] }),
  ],
  "seated-overhead-press": [
    both(overhead), both({ ...overhead, ...droppedArms }), both({ ...overhead, e: [25, -5], w: [20, 15] }),
  ],
  "seated-leg-extension": [
    pose(legExtension), pose({ ...legExtension, k: [0, 40], a: [0, 80] }), pose({ ...legExtension, a: [48, 44] }),
  ],
  "seated-marching": [pose(march), pose(bow), pose({ ...march, k: [40, 0] })],
  "seated-good-morning": [pose(bow), pose(march), pose({ ...bow, s: [0, -50] })],
  "seated-knee-to-chest": [
    pose(seatedTuck), pose({ ...seatedTuck, w: [-28, 15] }), pose({ ...seatedTuck, k: [40, 0], w: [42, 2] }),
  ],
  "seated-side-bend": [
    pose(sideBend, { w: [32, 40] }),
    pose({ ...sideBend, w: [40, 39] }, { w: [72, 41] }),
    pose({ ...sideBend, s: [0, -48] }, { w: [32, 40] }),
  ],
  "seated-hamstring-stretch": [
    pose(bowWithStraightLeg), pose(bow), pose({ ...bowWithStraightLeg, s: [0, -55] }),
  ],
  "wall-pushup": [
    both(pushup), both({ ...pushup, e: [30, 0], w: [30, -30] }), both({ ...pushup, e: [22, 0], w: [44, 0] }),
  ],
  "chair-mini-squat": [pose(squat), pose({ h: [-30, 15], k: [0, 0], a: [-13, 40] }), pose(standing)],
  "standing-side-leg-raise": [
    pose(sideLeg, supportHip),
    pose({ ...sideLeg, s: [25, -40], k: [0, 50] }, supportHip),
    pose({ ...sideLeg, k: [0, 45] }, supportHip),
  ],
  "standing-leg-curl": [
    pose(legCurl), pose({ ...legCurl, k: [30, 0], a: [30, 40] }), pose({ ...legCurl, a: [0, 84] }),
  ],
  "wall-slide": [
    both(slide), both({ ...slide, e: [0, -40], w: [10, 0] }), both({ ...slide, e: [36, 0], w: [37, -36] }),
  ],
  "assisted-mini-lunge": [
    pose(lungeFront, lungeRear),
    pose({ ...lungeFront, h: [0, 0], k: [22, 50], a: [60, 80] }, lungeRear),
    pose({ ...lungeFront, h: [38, -38], k: [38, 12] }, lungeRear),
  ],
  "wall-squat": [
    pose(wallSquat),
    pose({ ...wallSquat, k: [40, 0], a: [40, 45] }),
    pose({ ...wallSquat, s: [28, -111], h: [28, -64], k: [39, -4], a: [50, 55] }),
  ],
  "mini-glute-bridge": [
    pose(bridge), pose({ s: [0, 0], h: [45, 0], k: [85, 0], a: [125, 0] }), pose({ ...bridge, h: [0, 0] }),
  ],
  "lying-overhead-arm-reach": [
    both(lyingArms), both({ ...lyingArms, w: [-80, -30] }), both({ ...lyingArms, e: [-6, 0], w: [30, 0] }),
  ],
  "lying-knee-to-chest": [
    pose(lyingTuck), pose({ ...lyingTuck, w: [-57, 21] }), pose({ ...lyingTuck, k: [43, -3], w: [38, -3] }),
  ],
  "straight-leg-raise": [
    pose(lyingLeg), pose({ ...lyingLeg, a: [72, 0] }), pose({ ...lyingLeg, k: [40, 0], a: [80, 0] }),
  ],
  "prone-mini-swan": [
    pose(swan), pose({ ...swan, s: [-50, 0], k: [36, -36] }), pose({ ...swan, s: [-48, 0] }),
  ],
  "modified-bird-dog": [
    pose(birdLeg, birdArm),
    pose(birdLeg, { ...birdArm, e: [-50, 29], w: [-50, 50] }),
    pose({ ...birdLeg, k: [0, 45], a: [25, 45] }, birdArm),
  ],
  "lying-heel-touch": [pose(heelTouch), pose(flatHeelTouch), pose(flatHeelTouch)],
};

const disabled = [
  "seated-ankle-pump", "standing-hip-extension", "assisted-calf-raise",
];
const plank = exercises.find((exercise) => exercise.id === "kneeling-plank");

test("all 29 seed exercises have an automatic rule or a clear guide-only status", () => {
  assert.deepEqual(exercises.map((ex) => ex.id).sort(), [...Object.keys(cases), plank.id, ...disabled].sort());
  for (const exercise of exercises) {
    assert.equal(!!getTrackingUnavailableReason(exercise), disabled.includes(exercise.id), exercise.id);
    if (disabled.includes(exercise.id)) assert.equal(analyzePose(both(front), exercise).best, null);
  }
});

test("kneeling plank uses its own increasing thresholds and enters a hold only at 165 degrees or above", () => {
  assert.deepEqual([plank.jointA, plank.jointB, plank.jointC], ["어깨", "고관절", "무릎"]);
  assert.deepEqual([plank.restAngle, plank.allowedTarget, plank.normalTarget], [180, 165, 180]);
  assert.equal(getTrackingUnavailableReason(plank), null);
  const guide = EXERCISE_GUIDES[plank.id];
  for (const [angle, expected] of [[164, "fail"], [165, "success"], [179, "success"], [180, "perfect"]]) {
    const radians = angle * Math.PI / 180;
    const keypoints = pose({ s: [80, 0], h: [0, 0], k: [80 * Math.cos(radians), 80 * Math.sin(radians)] });
    const result = analyzePose(keypoints, plank);
    assert.equal(result.best?.angle, angle);
    assert.equal(result.best?.level, expected);
    assert.equal(judgeLevel(angle, plank), expected);
    const session = new ExerciseSession(guide.mode, guide.holdSeconds, 0);
    assert.equal(session.observe(result, 0).phase, expected === "fail" ? "rest" : "holding");
  }
});

test("the base angle classification of all other exercises is unchanged", () => {
  for (const exercise of exercises.filter((exercise) => exercise.id !== plank.id)) {
    for (let angle = 0; angle <= 180; angle++) {
      const { restAngle, normalTarget, allowedTarget } = exercise;
      const reachesNormal = normalTarget > restAngle ? angle >= normalTarget : angle <= normalTarget;
      const reachesAllowed = normalTarget > restAngle ? angle >= allowedTarget : angle <= allowedTarget;
      const expected = reachesNormal ? "perfect" : reachesAllowed ? "success" : "fail";
      assert.equal(judgeLevel(angle, exercise), expected, exercise.id + " at " + angle);
    }
  }
});

function observe(session, exercise, input, time) {
  return session.observe(analyzePose(input, exercise, session.activeSide), time);
}

function playCycle(exercise, input, rest) {
  const guide = EXERCISE_GUIDES[exercise.id];
  const completedAt = guide.holdSeconds * 1000 + 400;
  const session = new ExerciseSession(guide.mode, guide.holdSeconds, 0);
  for (let t = 0; t <= completedAt; t += 100) observe(session, exercise, input, t);
  for (let t = completedAt + 100; t <= completedAt + 700; t += 100) observe(session, exercise, rest, t);
  return session.stats(completedAt + 700);
}

for (const [id, [correct, compensation, rest]] of Object.entries(cases)) {
  const exercise = exercises.find((item) => item.id === id);
  test(id + " accepts the intended cycle and rejects the audited compensation", () => {
    assert.ok(["perfect", "success"].includes(analyzePose(correct, exercise).best?.level));
    assert.equal(analyzePose(compensation, exercise).best?.level, "fail");
    assert.equal(playCycle(exercise, correct, rest).goodCount, 1);
    assert.equal(playCycle(exercise, compensation, rest).goodCount, 0);
    const mirrored = correct.map((point) => ({ ...point, x: 640 - point.x }));
    assert.ok(["perfect", "success"].includes(analyzePose(mirrored, exercise).best?.level));
  });
}

const frontExercise = exercises.find((ex) => ex.id === "seated-front-raise");
const [frontGood, , frontRest] = cases[frontExercise.id];
const frontOccluded = frontGood.map((point, i) => i === 9 ? { ...point, score: 0.29 } : point);

function completeFrontHold(session) {
  for (let time = 0; time <= 2400; time += 100) observe(session, frontExercise, frontGood, time);
}

test("the zero badge starts at H, hold completes at H + 400, and release observes the 300 ms grace", () => {
  const session = new ExerciseSession("rep", 2, 0);
  for (let time = 0; time < 2000; time += 100) observe(session, frontExercise, frontGood, time);
  const goal = observe(session, frontExercise, frontGood, 2000);
  assert.equal(goal.phase, "holding");
  assert.equal(goal.remainingSeconds, 0);
  for (const time of [2100, 2200, 2399]) assert.equal(observe(session, frontExercise, frontGood, time).phase, "holding");
  const completed = observe(session, frontExercise, frontGood, 2400);
  assert.equal(completed.phase, "satisfied");
  assert.equal(completed.remainingSeconds, 0);
  assert.equal(completed.count, 0);
  for (const time of [2500, 2600, 2699, 2700, 2800, 2900, 3000, 3099]) {
    assert.equal(observe(session, frontExercise, frontRest, time).count, 0);
  }
  assert.equal(observe(session, frontExercise, frontRest, 3100).count, 1);
  assert.equal(observe(session, frontExercise, frontRest, 3500).count, 1);
});

test("an observed out-of-range pose retains the hold for less than 300 ms", () => {
  const session = new ExerciseSession("rep", 2, 0);
  observe(session, frontExercise, frontGood, 0);
  observe(session, frontExercise, frontGood, 200);
  assert.equal(observe(session, frontExercise, frontRest, 499).phase, "holding");
  assert.equal(observe(session, frontExercise, frontRest, 500).phase, "rest");
});

for (const [label, missingInput] of [["no pose", []], ["no representative angle", frontOccluded]]) {
  test(label + " resets an incomplete hold on the first missing frame without crediting the gap", () => {
    const session = new ExerciseSession("rep", 2, 0);
    for (let time = 0; time <= 1900; time += 100) observe(session, frontExercise, frontGood, time);
    const before = session.stats(1900);
    const missing = observe(session, frontExercise, missingInput, 1920);
    assert.equal(missing.kind, "missing");
    assert.equal(missing.phase, "rest");
    assert.equal(session.stats(1920).measuredFrames, before.measuredFrames);
    const resumed = observe(session, frontExercise, frontGood, 2070);
    assert.equal(resumed.phase, "holding");
    assert.equal(resumed.remainingSeconds, 2);
    assert.equal(resumed.totalHoldSeconds, before.totalHoldSeconds);
    assert.equal(session.stats(2070).totalFrames, before.totalFrames + 2);
    assert.equal(observe(session, frontExercise, frontGood, 2170).totalHoldSeconds, 2);
  });

  test(label + " preserves a completed hold, cancels release, and requires 400 ms of observed release again", () => {
    const session = new ExerciseSession("rep", 2, 0);
    completeFrontHold(session);
    for (const time of [2500, 2600, 2700, 2800, 2900]) observe(session, frontExercise, frontRest, time);
    for (const time of [2910, 3200, 3800]) {
      const missing = observe(session, frontExercise, missingInput, time);
      assert.equal(missing.phase, "satisfied");
      assert.equal(missing.count, 0);
    }
    for (const time of [3900, 4000, 4100, 4200, 4299]) {
      assert.equal(observe(session, frontExercise, frontRest, time).count, 0);
    }
    assert.equal(observe(session, frontExercise, frontRest, 4300).count, 1);
    assert.equal(observe(session, frontExercise, frontRest, 4400).count, 1);
  });
}

test("remeasurement within the grace window cannot start release early", () => {
  const session = new ExerciseSession("rep", 2, 0);
  completeFrontHold(session);
  observe(session, frontExercise, frontOccluded, 2440);
  for (const time of [2500, 2600, 2699, 2700, 2800, 2900, 3099]) {
    assert.equal(observe(session, frontExercise, frontRest, time).count, 0);
  }
  assert.equal(observe(session, frontExercise, frontRest, 3100).count, 1);
});

test("interrupting tracking preserves confirmed counts, accumulated hold and the measured frame ratio", () => {
  const session = new ExerciseSession("rep", 2, 0);
  completeFrontHold(session);
  for (const time of [2700, 2800, 2900, 3000, 3100]) observe(session, frontExercise, frontRest, time);
  const before = session.stats(3100);
  assert.equal(before.goodCount, 1);
  assert.equal(before.totalHoldSeconds, 2);
  assert.equal(before.accuracy, Math.round(25 * 100 / 30));

  session.interrupt();
  assert.deepEqual(session.stats(3100), before);
  assert.equal(observe(session, frontExercise, [], 6000).count, 1);
  assert.deepEqual(session.stats(6000), { ...before, duration: 6, totalFrames: before.totalFrames + 1 });
});

test("a long pause with no frames restarts the hold, and an active side cannot be swapped", () => {
  const exercise = exercises.find((ex) => ex.id === "seated-leg-extension");
  const session = new ExerciseSession("rep", 2, 0);
  for (let time = 0; time <= 1000; time += 100) observe(session, exercise, pose(legExtension), time);
  assert.equal(session.activeSide, "left");
  const otherLeg = observe(session, exercise, pose({}, legExtension), 1100);
  assert.equal(otherLeg.kind, "missing");
  assert.equal(otherLeg.phase, "rest");
  const resumed = observe(session, exercise, pose(legExtension), 6000);
  assert.equal(resumed.phase, "holding");
  assert.equal(resumed.remainingSeconds, 2);
  assert.equal(session.stats(6000).goodCount, 0);
});

test("unreliable or overlapping required keypoints cannot qualify a frame", () => {
  assert.equal(calcAngle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 40 }), null);
  assert.equal(analyzePose(frontOccluded, frontExercise).best, null);
  assert.equal(analyzePose([], frontExercise).best, null);
});
