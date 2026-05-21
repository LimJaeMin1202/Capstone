import type { Keypoint } from "@tensorflow-models/pose-detection";
import type { Exercise } from "../types/exercise";

// 관절 이름 → MoveNet 키포인트 인덱스 (좌/우)
// MoveNet 17개: 5/6 어깨, 7/8 팔꿈치, 9/10 손목, 11/12 고관절, 13/14 무릎, 15/16 발목
const JOINT_INDEX: Record<string, { left: number; right: number }> = {
  어깨: { left: 5, right: 6 },
  팔꿈치: { left: 7, right: 8 },
  손목: { left: 9, right: 10 },
  고관절: { left: 11, right: 12 },
  무릎: { left: 13, right: 14 },
  발목: { left: 15, right: 16 },
  // '발끝'은 MoveNet에 없음 → 매핑 불가 (해당 운동은 판정 미지원)
};

const MIN_SCORE = 0.3;

// 세 점 A-B-C로 B에서의 각도 계산 (0~180°)
export function calcAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (mag === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / mag));
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}

export type Level = "perfect" | "success" | "fail";

export interface SideResult {
  side: "left" | "right";
  angle: number;
  level: Level;
}

// 한 쪽 각도 계산 (관절 매핑 불가 or 신뢰도 낮으면 null)
function angleForSide(
  kp: Keypoint[],
  ex: Exercise,
  side: "left" | "right"
): number | null {
  const a = JOINT_INDEX[ex.jointA];
  const b = JOINT_INDEX[ex.jointB];
  const c = JOINT_INDEX[ex.jointC];
  if (!a || !b || !c) return null;
  const pa = kp[a[side]];
  const pb = kp[b[side]];
  const pc = kp[c[side]];
  if (
    (pa.score ?? 0) < MIN_SCORE ||
    (pb.score ?? 0) < MIN_SCORE ||
    (pc.score ?? 0) < MIN_SCORE
  ) {
    return null;
  }
  return calcAngle(pa, pb, pc);
}

// 각도 → 판정 단계
export function judgeLevel(angle: number, ex: Exercise): Level {
  const increasing = ex.normalTarget > ex.restAngle;
  if (increasing) {
    if (angle >= ex.normalTarget) return "perfect";
    if (angle >= ex.allowedTarget) return "success";
    return "fail";
  } else {
    if (angle <= ex.normalTarget) return "perfect";
    if (angle <= ex.allowedTarget) return "success";
    return "fail";
  }
}

// 양쪽 중 가장 잘한 쪽을 대표로 반환 (한쪽 운동·양쪽 운동 모두 대응)
export function analyzePose(
  kp: Keypoint[],
  ex: Exercise
): SideResult | null {
  const results: SideResult[] = [];
  for (const side of ["left", "right"] as const) {
    const angle = angleForSide(kp, ex, side);
    if (angle !== null) {
      results.push({ side, angle, level: judgeLevel(angle, ex) });
    }
  }
  if (results.length === 0) return null;
  const rank: Record<Level, number> = { perfect: 2, success: 1, fail: 0 };
  results.sort((a, b) => rank[b.level] - rank[a.level]);
  return results[0];
}
