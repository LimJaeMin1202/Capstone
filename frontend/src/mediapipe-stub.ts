// MediaPipe Pose 스텁 (가짜 모듈)
// 우리는 MoveNet(TF.js)만 사용하므로 MediaPipe 런타임은 실행되지 않음.
// pose-detection 라이브러리가 @mediapipe/pose를 import할 때 이 파일로 대체되어
// 번들링/런타임 export 에러를 회피한다.
export class Pose {}
export const POSE_CONNECTIONS: number[][] = [];
export const VERSION = "stub";
export default {};
