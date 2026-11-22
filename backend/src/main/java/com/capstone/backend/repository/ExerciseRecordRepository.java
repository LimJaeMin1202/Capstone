package com.capstone.backend.repository;

import com.capstone.backend.entity.ExerciseRecord;
import com.capstone.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExerciseRecordRepository extends JpaRepository<ExerciseRecord, Long> {

    Optional<ExerciseRecord> findByUserAndSessionId(User user, UUID sessionId);

    // 특정 사용자의 기록 (최신순)
    List<ExerciseRecord> findByUser_UsernameOrderByCreatedAtDesc(String username);

    // 특정 사용자의 특정 운동 기록
    List<ExerciseRecord> findByUser_UsernameAndExerciseIdOrderByCreatedAtDesc(
            String username, String exerciseId);

    // 특정 사용자의 기록 전체 삭제
    void deleteByUser_Username(String username);
}
