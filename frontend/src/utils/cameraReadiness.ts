const STABLE_FRAMING_MS = 650;
const MAX_FRAME_GAP_MS = 500;

export class CameraReadiness {
  private visibleSince: number | null = null;
  private lastFrameAt: number | null = null;

  observe(visible: boolean, now: number) {
    if (!visible) {
      this.reset();
      return;
    }
    if (this.lastFrameAt === null || now - this.lastFrameAt > MAX_FRAME_GAP_MS) {
      this.visibleSince = now;
    }
    this.lastFrameAt = now;
  }

  isReady(now: number): boolean {
    return this.visibleSince !== null && this.lastFrameAt !== null
      && this.lastFrameAt - this.visibleSince >= STABLE_FRAMING_MS
      && now - this.lastFrameAt <= MAX_FRAME_GAP_MS;
  }

  reset() {
    this.visibleSince = null;
    this.lastFrameAt = null;
  }
}
