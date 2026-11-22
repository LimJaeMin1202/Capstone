import type { Keypoint } from "@tensorflow-models/pose-detection";
import type { Exercise } from "../types/exercise";

const INDICES = {
  nose: [0, 0],
  ear: [3, 4],
  shoulder: [5, 6],
  elbow: [7, 8],
  wrist: [9, 10],
  hip: [11, 12],
  knee: [13, 14],
  ankle: [15, 16],
} as const;

type Joint = keyof typeof INDICES;
type JointRef = Joint | `other:${Joint}`;
type Point = Pick<Keypoint, "x" | "y">;
export type Side = "left" | "right";
export type Level = "perfect" | "success" | "fail";

const JOINT_NAMES: Partial<Record<Exercise["jointA"], Joint>> = {
  어깨: "shoulder",
  팔꿈치: "elbow",
  손목: "wrist",
  고관절: "hip",
  무릎: "knee",
  발목: "ankle",
};

export const MIN_KEYPOINT_SCORE = 0.3;
const MIN_SEGMENT_PIXELS = 2;
// 화면에서 크게 굽은 팔다리를 분리하는 보조 기준이다.
const EXTENDED_ANGLE = 150;

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function calcAngle(a: Point, b: Point, c: Point): number | null {
  const ba = distance(a, b);
  const bc = distance(b, c);
  if (!Number.isFinite(ba) || !Number.isFinite(bc) || ba < MIN_SEGMENT_PIXELS || bc < MIN_SEGMENT_PIXELS) {
    return null;
  }
  const dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
  const cosine = Math.max(-1, Math.min(1, dot / (ba * bc)));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

export function isVisibleKeypoint(point: Keypoint | undefined): point is Keypoint {
  return !!point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && (point.score ?? 0) >= MIN_KEYPOINT_SCORE;
}

function readPoint(points: Keypoint[], side: Side, joint: JointRef): Point | undefined {
  const isOpposite = joint.startsWith("other:");
  const name = (isOpposite ? joint.slice(6) : joint) as Joint;
  const index = (side === "left") !== isOpposite ? 0 : 1;
  const point = points[INDICES[name][index]];
  return isVisibleKeypoint(point) ? point : undefined;
}

export function judgeLevel(angle: number, exercise: Exercise): Level {
  if (exercise.normalTarget > exercise.restAngle) {
    if (angle >= exercise.normalTarget) return "perfect";
    return angle >= exercise.allowedTarget ? "success" : "fail";
  }
  if (angle <= exercise.normalTarget) return "perfect";
  return angle <= exercise.allowedTarget ? "success" : "fail";
}

interface Check {
  joints: JointRef[];
  matches: (...points: Point[]) => boolean | null;
  hint: string;
}

interface Rule {
  sides: "one" | "both" | "front";
  checks: Check[];
  limitDepth?: boolean;
  release?: Pick<Check, "joints" | "matches">;
}

function check(joints: JointRef[], matches: Check["matches"], hint: string): Check {
  return { joints, matches, hint };
}

function upright(shoulder: Point, hip: Point) {
  return hip.y - shoulder.y > Math.abs(hip.x - shoulder.x) * 2.5;
}

function horizontal(a: Point, b: Point) {
  return Math.abs(a.y - b.y) <= Math.abs(a.x - b.x) * 0.6;
}

function extended(a: Point, b: Point, c: Point) {
  const angle = calcAngle(a, b, c);
  return angle === null ? null : angle >= EXTENDED_ANGLE;
}

function raised(hip: Point, upper: Point) {
  const span = distance(hip, upper);
  return span < MIN_SEGMENT_PIXELS ? null : hip.y - upper.y > span * 0.12;
}

function closeTo(a: Point, b: Point, shoulder: Point, hip: Point, torsoRatio: number) {
  const span = distance(shoulder, hip);
  return span < MIN_SEGMENT_PIXELS ? null : distance(a, b) <= span * torsoRatio;
}

function forwardOf(origin: Point, point: Point, axisStart: Point, axisEnd: Point) {
  const dx = axisEnd.x - axisStart.x;
  const span = distance(origin, point);
  if (Math.abs(dx) < MIN_SEGMENT_PIXELS || span < MIN_SEGMENT_PIXELS) return null;
  return (point.x - origin.x) * Math.sign(dx) >= span * 0.3;
}

const tallTorso = check(["shoulder", "hip"], upright, "상체를 곧게 세워 주세요");
const seatedThigh = check(["hip", "knee"], horizontal, "의자에 앉아 허벅지를 화면에 보여 주세요");
const straightArm = check(["shoulder", "elbow", "wrist"], extended, "팔꿈치를 가이드 자세에 맞춰 펴 주세요");
const straightLeg = check(["hip", "knee", "ankle"], extended, "들어 올린 다리의 무릎을 가이드에 맞춰 펴 주세요");
const handAtKnee = check(["wrist", "knee", "shoulder", "hip"],
  (w, k, s, h) => closeTo(w, k, s, h, 0.45), "손을 같은 쪽 무릎 가까이에 두세요");

const RULES: Record<string, Rule> = {
  "seated-front-raise": { sides: "both", checks: [
    seatedThigh,
    check(["shoulder", "elbow", "hip", "knee"], forwardOf, "양팔을 몸 앞쪽으로 들어 올려 주세요"),
    straightArm,
  ] },
  "seated-lateral-raise": { sides: "both", checks: [
    check(["shoulder", "elbow", "other:shoulder"], (s, e, other) =>
      (e.x - s.x) * (s.x - other.x) > 0 && e.y >= s.y - distance(s, e) * 0.12,
    "양팔을 어깨 높이까지 몸 양옆으로 들어 주세요"),
  ] },
  "seated-chest-press": { sides: "both", checks: [
    seatedThigh,
    check(["shoulder", "wrist", "hip", "knee"], (s, w, h, k) =>
      horizontal(s, w) && forwardOf(s, w, h, k), "양손을 가슴 높이에서 앞으로 밀어 주세요"),
  ] },
  "seated-biceps-curl": { sides: "both", checks: [
    check(["shoulder", "elbow", "hip"], (s, e, h) => {
      const span = distance(s, h);
      return span < MIN_SEGMENT_PIXELS ? null : e.y > s.y && Math.abs(e.x - s.x) <= span * 0.32;
    }, "팔꿈치를 옆구리 가까이에 두고 손을 들어 주세요"),
  ] },
  "seated-overhead-press": { sides: "both", checks: [
    check(["wrist", "nose"], (w, nose) => w.y < nose.y, "양손을 머리 위로 들어 주세요"),
  ] },
  "seated-leg-extension": { sides: "one", checks: [tallTorso, seatedThigh] },
  "seated-marching": { sides: "one", checks: [
    tallTorso,
    check(["hip", "knee"], (h, k) => k.y < h.y, "상체를 세우고 한쪽 무릎을 들어 주세요"),
  ] },
  "seated-good-morning": { sides: "one", checks: [
    seatedThigh,
    check(["hip", "shoulder", "knee"], (h, s, k) =>
      s.y < h.y && forwardOf(h, s, h, k), "다리는 그대로 두고 상체를 앞으로 숙여 주세요"),
  ] },
  "seated-knee-to-chest": { sides: "one", checks: [
    check(["hip", "knee"], (h, k) => k.y < h.y, "무릎을 가슴 쪽으로 들어 주세요"),
    handAtKnee,
  ] },
  "seated-side-bend": { sides: "one", release: { joints: ["shoulder", "hip"], matches: upright }, checks: [
    check(["shoulder", "hip", "wrist", "other:wrist", "nose"], (s, h, w, other, nose) =>
      Math.abs(s.x - h.x) > Math.abs(s.y - h.y) * 0.2
      && (w.y < nose.y || other.y < nose.y), "한 손을 머리 위로 들고 상체를 옆으로 기울여 주세요"),
  ] },
  "seated-hamstring-stretch": { sides: "one", checks: [
    straightLeg,
    check(["hip", "shoulder", "knee"], (h, s, k) =>
      s.y < h.y && forwardOf(h, s, h, k), "다리를 뻗은 상태에서 상체를 앞으로 숙여 주세요"),
  ] },
  "wall-pushup": { sides: "both", checks: [
    check(["shoulder", "hip", "ankle"], extended, "어깨부터 발목까지 몸을 곧게 유지해 주세요"),
    check(["shoulder", "wrist", "ear", "nose"], (s, w, ear, nose) =>
      horizontal(s, w) && forwardOf(s, w, ear, nose), "몸 앞쪽 어깨 높이에 양손을 두세요"),
  ] },
  "chair-mini-squat": { sides: "one", limitDepth: true, checks: [
    check(["hip", "knee"], (h, k) => h.y <= k.y, "가이드처럼 엉덩이를 조금만 내려 주세요"),
  ] },
  "standing-side-leg-raise": { sides: "one", checks: [
    tallTorso,
    check(["hip", "knee", "other:hip"], (h, k, other) =>
      (k.x - h.x) * (h.x - other.x) > 0, "상체를 기울이지 않고 다리를 옆으로 들어 주세요"),
  ] },
  "standing-leg-curl": { sides: "one", checks: [
    check(["hip", "knee", "ankle", "ear", "nose"], (h, k, a, ear, nose) =>
      upright(h, k) && forwardOf(a, k, ear, nose), "허벅지는 그대로 두고 발뒤꿈치를 몸 뒤로 들어 주세요"),
  ] },
  "wall-slide": { sides: "both", checks: [
    check(["shoulder", "wrist", "elbow"], (s, w, e) =>
      w.y < s.y && w.y <= e.y, "양손을 팔꿈치 위로 천천히 올려 주세요"),
  ] },
  "assisted-mini-lunge": { sides: "front", limitDepth: true, checks: [
    check(["hip", "knee"], (h, k) => h.y <= k.y, "앞다리 무릎을 얕게 굽혀 주세요"),
  ] },
  "wall-squat": { sides: "one", limitDepth: true, checks: [
    tallTorso,
    check(["knee", "ankle", "ear", "nose"], (k, a, ear, nose) =>
      (a.x - k.x) * Math.sign(nose.x - ear.x) > MIN_SEGMENT_PIXELS, "양발을 앞으로 둔 뒤 등을 세워 주세요"),
  ] },
  "mini-glute-bridge": { sides: "one", checks: [
    check(["hip", "shoulder"], (h, s) => raised(s, h), "어깨는 매트에 두고 골반을 들어 주세요"),
    check(["hip", "knee", "ankle"], (h, k, a) => {
      const angle = calcAngle(h, k, a);
      return angle === null ? null : angle < EXTENDED_ANGLE;
    }, "무릎을 굽히고 발을 매트 쪽에 두세요"),
  ] },
  "lying-overhead-arm-reach": { sides: "both", checks: [
    straightArm,
    check(["hip", "shoulder", "wrist"], (h, s, w) =>
      horizontal(h, s) && horizontal(s, w) && forwardOf(s, w, h, s), "누운 자세를 유지하며 양손을 머리 위쪽으로 뻗어 주세요"),
  ] },
  "lying-knee-to-chest": { sides: "one", checks: [
    check(["shoulder", "hip"], horizontal, "몸통을 매트 쪽에 유지해 주세요"),
    handAtKnee,
  ] },
  "straight-leg-raise": { sides: "one", checks: [
    straightLeg,
    check(["hip", "knee"], raised, "펴고 있는 다리를 위로 들어 주세요"),
  ] },
  "prone-mini-swan": { sides: "one", checks: [
    check(["hip", "shoulder"], raised, "다리는 그대로 두고 상체를 들어 주세요"),
    check(["hip", "knee"], horizontal, "다리를 매트 쪽에 유지해 주세요"),
  ] },
  "modified-bird-dog": { sides: "one", checks: [
    straightLeg,
    check(["hip", "knee"], horizontal, "다리를 몸 뒤쪽으로 뻗어 주세요"),
    check(["other:shoulder", "other:elbow", "other:wrist", "other:hip"], (s, e, w, h) =>
      horizontal(s, w) && forwardOf(s, w, h, s) && extended(s, e, w),
    "뻗은 다리의 반대쪽 팔을 앞으로 뻗어 주세요"),
  ] },
  "lying-heel-touch": { sides: "one", release: {
    joints: ["hip", "shoulder"],
    matches: (h, s) => raised(h, s) === false,
  }, checks: [
    check(["wrist", "ankle", "shoulder", "hip"], (w, a, s, h) =>
      closeTo(w, a, s, h, 0.72), "같은 쪽 발뒤꿈치 방향으로 손을 뻗어 주세요"),
    check(["hip", "shoulder"], raised, "어깨를 매트에서 살짝 들어 주세요"),
  ] },
};

const UNAVAILABLE: Record<string, string> = {
  "seated-ankle-pump": "발끝 움직임을 측정할 수 없어 자동 집계를 준비 중이에요.",
  "standing-hip-extension": "다리를 뒤로 뻗는 방향을 확인하는 자동 판정을 준비 중이에요.",
  "assisted-calf-raise": "발뒤꿈치 상승과 복귀를 확인하는 자동 판정을 준비 중이에요.",
  "kneeling-plank": "몸통 정렬과 지지 자세를 확인하는 자동 판정을 준비 중이에요.",
};

function exerciseRule(exercise: Exercise): Rule | undefined {
  return Object.hasOwn(RULES, exercise.id) ? RULES[exercise.id] : undefined;
}

export function getTrackingUnavailableReason(exercise: Exercise): string | null {
  if (Object.hasOwn(UNAVAILABLE, exercise.id)) return UNAVAILABLE[exercise.id];
  const joints = [exercise.jointA, exercise.jointB, exercise.jointC];
  const { restAngle, normalTarget, allowedTarget } = exercise;
  const angles = [restAngle, normalTarget, allowedTarget];
  const ordered = normalTarget > restAngle
    ? restAngle < allowedTarget && allowedTarget <= normalTarget
    : normalTarget <= allowedTarget && allowedTarget < restAngle;
  if (!exerciseRule(exercise) || joints.some((joint) => !Object.hasOwn(JOINT_NAMES, joint))
    || new Set(joints).size !== 3 || !ordered
    || angles.some((angle) => !Number.isFinite(angle) || angle < 0 || angle > 180)) {
    return "이 운동은 가이드에서 동작을 확인할 수 있어요. 자동 집계를 준비 중이에요.";
  }
  return null;
}

export interface SideResult {
  side: Side;
  angle: number;
  level: Level;
  released: boolean;
  hint: string | null;
}

export interface PoseAnalysis {
  left: SideResult | null;
  right: SideResult | null;
  best: SideResult | null;
  activeSide: Side | null;
  released: boolean;
  hint: string | null;
}

function observeForm(points: Keypoint[], side: Side, form: Pick<Check, "joints" | "matches">) {
  const required = form.joints.map((joint) => readPoint(points, side, joint));
  return required.every((point) => point !== undefined) ? form.matches(...required) : null;
}

function evaluateSide(points: Keypoint[], exercise: Exercise, rule: Rule, side: Side): SideResult | null {
  const a = readPoint(points, side, JOINT_NAMES[exercise.jointA]!);
  const b = readPoint(points, side, JOINT_NAMES[exercise.jointB]!);
  const c = readPoint(points, side, JOINT_NAMES[exercise.jointC]!);
  if (!a || !b || !c) return null;
  const angle = calcAngle(a, b, c);
  if (angle === null) return null;

  let hint: string | null = null;
  for (const form of rule.checks) {
    const matches = observeForm(points, side, form);
    if (matches === null) return null;
    if (!matches) hint ??= form.hint;
  }
  if (rule.limitDepth && angle < exercise.normalTarget) {
    hint ??= "가이드에 맞춰 조금 덜 굽혀 주세요";
  }
  const angleLevel = judgeLevel(angle, exercise);
  const level = hint ? "fail" : angleLevel;
  const released = rule.release ? observeForm(points, side, rule.release) === true : angleLevel === "fail";
  return {
    side,
    angle,
    level,
    released: level === "fail" && released,
    hint,
  };
}

function frontLeg(points: Keypoint[]): Side | null {
  const leftAnkle = readPoint(points, "left", "ankle");
  const rightAnkle = readPoint(points, "right", "ankle");
  const nose = readPoint(points, "left", "nose");
  const ears = (["left", "right"] as const)
    .map((side) => readPoint(points, side, "ear"))
    .filter((ear) => ear !== undefined);
  if (!leftAnkle || !rightAnkle || !nose || ears.length === 0) return null;
  const earX = ears.reduce((sum, ear) => sum + ear.x, 0) / ears.length;
  const footDx = leftAnkle.x - rightAnkle.x;
  if (Math.abs(nose.x - earX) < MIN_SEGMENT_PIXELS || Math.abs(footDx) < MIN_SEGMENT_PIXELS) return null;
  return footDx * (nose.x - earX) > 0 ? "left" : "right";
}

const RANK: Record<Level, number> = { perfect: 2, success: 1, fail: 0 };

export function analyzePose(points: Keypoint[], exercise: Exercise, lockedSide: Side | null = null): PoseAnalysis {
  const unavailable = getTrackingUnavailableReason(exercise);
  const rule = exerciseRule(exercise);
  if (unavailable || !rule) {
    return { left: null, right: null, best: null, activeSide: null, released: false, hint: unavailable };
  }
  const left = evaluateSide(points, exercise, rule, "left");
  const right = evaluateSide(points, exercise, rule, "right");
  if (rule.sides === "both") {
    const best = left && right ? (RANK[left.level] <= RANK[right.level] ? left : right) : null;
    return {
      left, right, best, activeSide: null,
      released: !!left?.released && !!right?.released,
      hint: best ? best.hint : "양쪽 관절이 화면에 보이게 해주세요",
    };
  }

  const selected = rule.sides === "front" ? frontLeg(points) : lockedSide;
  const fixed = rule.sides === "front" || lockedSide !== null;
  const candidate = left && right ? (RANK[left.level] >= RANK[right.level] ? left : right) : left ?? right;
  const best = fixed
    ? (selected && (!lockedSide || lockedSide === selected) ? (selected === "left" ? left : right) : null)
    : candidate;
  return {
    left, right, best, activeSide: best?.side ?? lockedSide,
    released: best?.released ?? false,
    hint: best?.hint ?? (rule.sides === "front" && !best ? "옆모습에서 앞발과 뒷발이 보이게 해주세요" : null),
  };
}
