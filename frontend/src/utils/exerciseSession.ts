import type { ExerciseMode } from "../data/exerciseGuides";
import type { PoseAnalysis, Side } from "./pose.ts";

const MAX_SAMPLE_GAP_MS = 300;
const HOLD_COMPLETION_DELAY_MS = 400;
const RELEASE_CONFIRM_MS = 400;

type Phase = "rest" | "holding" | "satisfied";
type ObservationKind = "matched" | "released" | "outside" | "missing";

export interface SessionStats {
  mode: ExerciseMode;
  goodCount: number;
  duration: number;
  accuracy: number;
  totalHoldSeconds: number;
  measuredFrames: number;
  totalFrames: number;
}

export class ExerciseSession {
  private mode: ExerciseMode;
  private startedAt: number;
  private goalMs: number;
  private phase: Phase = "rest";
  private previous: { kind: ObservationKind; time: number } | null = null;
  private lastMatchAt: number | null = null;
  private heldMs = 0;
  private releaseMs: number | null = null;
  private accumulatedMs = 0;
  private goodFrames = 0;
  private measuredFrames = 0;
  private totalFrames = 0;
  private count = 0;
  private side: Side | null = null;

  constructor(mode: ExerciseMode, holdSeconds: number, startedAt: number) {
    this.mode = mode;
    this.goalMs = holdSeconds * 1000;
    this.startedAt = startedAt;
  }

  get activeSide(): Side | null {
    return this.side;
  }

  observe(pose: PoseAnalysis | null, now: number) {
    const before = this.phase;
    const previousCount = this.count;
    const best = pose?.best;
    const kind: ObservationKind = !best ? "missing"
      : best.level !== "fail" ? "matched"
      : pose.released ? "released" : "outside";
    const previous = this.previous;
    const gap = previous ? now - previous.time : 0;
    const interval = gap > 0 && gap <= MAX_SAMPLE_GAP_MS ? gap : 0;
    this.totalFrames++;
    if (best) {
      this.previous = { kind, time: now };
      this.measuredFrames++;
    } else {
      this.interrupt();
    }

    if (kind === "matched") {
      this.goodFrames++;
      if (previous?.kind === "matched") this.accumulatedMs += interval;
      if (this.phase === "holding" && previous?.kind === "matched" && interval > 0) {
        this.heldMs += interval;
      } else if (this.phase === "holding" && this.interrupted(now)) {
        this.heldMs = 0;
      }
      this.lastMatchAt = now;
    } else if (this.phase === "holding" && this.interrupted(now)) {
      this.resetRep();
    }

    if (this.phase === "rest" && kind === "matched") {
      this.phase = "holding";
      this.side = pose?.activeSide ?? null;
    }
    if (this.phase === "holding" && this.heldMs >= this.goalMs + HOLD_COMPLETION_DELAY_MS) {
      this.phase = "satisfied";
    }

    if (this.phase === "satisfied" && kind === "released" && this.interrupted(now)) {
      this.releaseMs = this.releaseMs !== null && interval > 0
        ? this.releaseMs + interval : 0;
      if (this.releaseMs >= RELEASE_CONFIRM_MS) {
        if (this.mode === "rep") this.count++;
        this.resetRep();
      }
    } else {
      this.releaseMs = null;
    }

    return {
      phase: this.phase,
      kind,
      count: this.count,
      counted: this.count > previousCount,
      started: before === "rest" && this.phase === "holding",
      completed: before === "holding" && this.phase === "satisfied",
      remainingSeconds: this.phase === "holding" ? Math.max(0, Math.ceil((this.goalMs - this.heldMs) / 1000))
        : this.phase === "satisfied" && kind === "matched" ? 0 : null,
      totalHoldSeconds: Math.floor(this.accumulatedMs / 1000),
    };
  }

  stats(now: number): SessionStats {
    return {
      mode: this.mode,
      goodCount: this.count,
      duration: Math.floor(Math.max(0, now - this.startedAt) / 1000),
      accuracy: this.measuredFrames > 0 ? Math.round(this.goodFrames * 100 / this.measuredFrames) : 0,
      totalHoldSeconds: Math.floor(this.accumulatedMs / 1000),
      measuredFrames: this.measuredFrames,
      totalFrames: this.totalFrames,
    };
  }

  interrupt() {
    this.previous = null;
    this.releaseMs = null;
    if (this.phase === "holding") this.resetRep();
  }

  private interrupted(now: number) {
    return this.lastMatchAt !== null && now - this.lastMatchAt >= MAX_SAMPLE_GAP_MS;
  }

  private resetRep() {
    this.phase = "rest";
    this.side = null;
    this.heldMs = 0;
    this.releaseMs = null;
    this.lastMatchAt = null;
  }
}
