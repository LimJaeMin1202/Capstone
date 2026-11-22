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

const [{ EXERCISE_GUIDES }, { ExerciseSession }, { analyzePose, calcAngle, getTrackingUnavailableReason }] =
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
  "seated-ankle-pump", "standing-hip-extension", "assisted-calf-raise", "kneeling-plank",
];

test("all 29 seed exercises have an automatic rule or a clear guide-only status", () => {
  assert.deepEqual(exercises.map((ex) => ex.id).sort(), [...Object.keys(cases), ...disabled].sort());
  for (const exercise of exercises) {
    assert.equal(!!getTrackingUnavailableReason(exercise), disabled.includes(exercise.id), exercise.id);
    if (disabled.includes(exercise.id)) assert.equal(analyzePose(both(front), exercise).best, null);
  }
});

function observe(session, exercise, input, time) {
  return session.observe(analyzePose(input, exercise, session.activeSide), time);
}

function playCycle(exercise, input, rest) {
  const guide = EXERCISE_GUIDES[exercise.id];
  const elapsed = guide.holdSeconds * 1000;
  const session = new ExerciseSession(guide.mode, guide.holdSeconds, 0);
  for (let t = 0; t <= elapsed; t += 100) observe(session, exercise, input, t);
  for (let t = elapsed + 100; t <= elapsed + 500; t += 100) observe(session, exercise, rest, t);
  return session.stats(elapsed + 500);
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

test("the zero badge and hold completion coincide, with release counted once", () => {
  const session = new ExerciseSession("rep", 2, 0);
  for (let time = 0; time < 2000; time += 100) observe(session, frontExercise, frontGood, time);
  const completed = observe(session, frontExercise, frontGood, 2000);
  assert.equal(completed.phase, "satisfied");
  assert.equal(completed.remainingSeconds, 0);
  assert.equal(completed.count, 0);
  for (let time = 2100; time <= 2900; time += 100) observe(session, frontExercise, frontRest, time);
  assert.equal(session.stats(2900).goodCount, 1);
});

test("missing frames contribute neither hold nor release and are reported as unmeasured", () => {
  const session = new ExerciseSession("hold", 2, 0);
  observe(session, frontExercise, frontGood, 0);
  for (let time = 100; time < 5000; time += 100) session.observe(null, time);
  const resumed = observe(session, frontExercise, frontGood, 5000);
  assert.equal(resumed.phase, "holding");
  assert.equal(resumed.totalHoldSeconds, 0);
  const stats = session.stats(5000);
  assert.equal(stats.totalFrames, 51);
  assert.equal(stats.measuredFrames, 2);

  const beforeRelease = new ExerciseSession("rep", 2, 0);
  for (let time = 0; time <= 2000; time += 100) observe(beforeRelease, frontExercise, frontGood, time);
  observe(beforeRelease, frontExercise, frontRest, 2100);
  for (let time = 2200; time <= 2700; time += 100) beforeRelease.observe(null, time);
  assert.equal(beforeRelease.stats(2700).goodCount, 0);
  assert.equal(observe(beforeRelease, frontExercise, frontRest, 2800).count, 0);
  for (let time = 2900; time <= 3200; time += 100) observe(beforeRelease, frontExercise, frontRest, time);
  assert.equal(beforeRelease.stats(3200).goodCount, 1);
});

test("a long pause with no frames restarts the hold, and an active side cannot be swapped", () => {
  const exercise = exercises.find((ex) => ex.id === "seated-leg-extension");
  const session = new ExerciseSession("rep", 2, 0);
  for (let time = 0; time <= 1000; time += 100) observe(session, exercise, pose(legExtension), time);
  assert.equal(session.activeSide, "left");
  const otherLeg = observe(session, exercise, pose({}, legExtension), 1100);
  assert.equal(otherLeg.kind, "missing");
  const resumed = observe(session, exercise, pose(legExtension), 6000);
  assert.equal(resumed.phase, "holding");
  assert.equal(resumed.remainingSeconds, 2);
  assert.equal(session.stats(6000).goodCount, 0);
});

test("unreliable or overlapping required keypoints cannot qualify a frame", () => {
  assert.equal(calcAngle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 40 }), null);
  const occluded = frontGood.map((point, i) => i === 9 ? { ...point, score: 0.29 } : point);
  assert.equal(analyzePose(occluded, frontExercise).best, null);
  assert.equal(analyzePose([], frontExercise).best, null);
});
