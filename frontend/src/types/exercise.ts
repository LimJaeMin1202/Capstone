// 백엔드 Exercise 엔티티와 1:1 대응하는 타입
export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  bodyPart: string;
  difficulty: string;
  jointA: string;
  jointB: string;
  jointC: string;
  restAngle: number;
  normalTarget: number;
  allowedTarget: number;
  notes: string;
}
