package com.capstone.backend.repository;

import com.capstone.backend.entity.ExerciseRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseRecordRepository extends JpaRepository<ExerciseRecord, Long> {

    // 특정 운동의 기록만 조회 (메소드 이름만 잘 지으면 SQL 자동 생성됨!)
    List<ExerciseRecord> findByExerciseIdOrderByCreatedAtDesc(String exerciseId);

    List<ExerciseRecord> findAllByOrderByCreatedAtDesc();
}
