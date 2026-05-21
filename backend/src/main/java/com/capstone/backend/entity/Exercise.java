package com.capstone.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

    @Id
    private String id;                 // 슬러그 (예: seated-front-raise)

    private String name;               // 한글명

    @Column(name = "name_en")
    private String nameEn;             // 영어명

    private String category;           // 의자 착석 / 벽·의자 지지 / 바닥·매트

    @Column(name = "body_part")
    private String bodyPart;           // 운동 부위

    private String difficulty;         // 초급 / 중급 / 고급

    // 각도 기준점 3개 (관절 이름) - 프론트에서 좌/우 MoveNet 인덱스로 변환
    @Column(name = "joint_a")
    private String jointA;
    @Column(name = "joint_b")
    private String jointB;
    @Column(name = "joint_c")
    private String jointC;

    @Column(name = "rest_angle")
    private Integer restAngle;         // 시작 자세 각도

    @Column(name = "normal_target")
    private Integer normalTarget;      // 정상 목표 각도 (화면에 목표로 표시)

    @Column(name = "allowed_target")
    private Integer allowedTarget;     // 허용 목표 각도 (실제 성공 판정 기준)

    @Column(length = 500)
    private String notes;              // 주의사항·특수처리 메모
}
