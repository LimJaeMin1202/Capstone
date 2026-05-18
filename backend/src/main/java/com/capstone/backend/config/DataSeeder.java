package com.capstone.backend.config;

import com.capstone.backend.entity.Exercise;
import com.capstone.backend.entity.Feedback;
import com.capstone.backend.entity.Joint;
import com.capstone.backend.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final ExerciseRepository exerciseRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (exerciseRepository.count() > 0) {
            log.info("DB에 이미 운동 데이터가 있어요. 시딩 건너뜀.");
            return;
        }

        log.info("운동 데이터 시딩 시작...");

        Exercise armRaise = Exercise.builder()
                .id("arm-raise")
                .name("팔 옆으로 들기")
                .category("어깨")
                .icon("🙆")
                .description("어깨 외전 운동")
                .difficulty("초급")
                .targetSets(3)
                .targetReps(10)
                .feedback(new Feedback(
                        "좋은 자세예요!",
                        "팔을 더 옆으로 들어주세요",
                        "너무 높이 들었어요"
                ))
                .build();
        armRaise.addJoint(Joint.builder()
                .label("왼팔").pointA(11).pointB(5).pointC(7)
                .minAngle(70).maxAngle(110).build());
        armRaise.addJoint(Joint.builder()
                .label("오른팔").pointA(12).pointB(6).pointC(8)
                .minAngle(70).maxAngle(110).build());

        Exercise elbowFlex = Exercise.builder()
                .id("elbow-flex")
                .name("팔꿈치 굽히기")
                .category("팔꿈치")
                .icon("💪")
                .description("팔꿈치 굴곡 운동")
                .difficulty("초급")
                .targetSets(3)
                .targetReps(10)
                .feedback(new Feedback(
                        "잘 굽혀지고 있어요!",
                        "팔꿈치를 더 굽혀주세요",
                        "너무 많이 굽혔어요"
                ))
                .build();
        elbowFlex.addJoint(Joint.builder()
                .label("왼팔꿈치").pointA(5).pointB(7).pointC(9)
                .minAngle(60).maxAngle(120).build());
        elbowFlex.addJoint(Joint.builder()
                .label("오른팔꿈치").pointA(6).pointB(8).pointC(10)
                .minAngle(60).maxAngle(120).build());

        Exercise squat = Exercise.builder()
                .id("squat")
                .name("무릎 굽히기")
                .category("무릎")
                .icon("🏋️")
                .description("하체 재활 운동")
                .difficulty("중급")
                .targetSets(3)
                .targetReps(10)
                .feedback(new Feedback(
                        "좋은 자세예요!",
                        "무릎을 더 굽혀주세요",
                        "너무 많이 굽혔어요"
                ))
                .build();
        squat.addJoint(Joint.builder()
                .label("왼무릎").pointA(11).pointB(13).pointC(15)
                .minAngle(60).maxAngle(120).build());
        squat.addJoint(Joint.builder()
                .label("오른무릎").pointA(12).pointB(14).pointC(16)
                .minAngle(60).maxAngle(120).build());

        exerciseRepository.saveAll(List.of(armRaise, elbowFlex, squat));

        log.info("운동 데이터 시딩 완료! (3개 운동 등록됨)");
    }
}
