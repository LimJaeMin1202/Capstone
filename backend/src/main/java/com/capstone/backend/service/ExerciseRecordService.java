package com.capstone.backend.service;

import com.capstone.backend.entity.ExerciseRecord;
import com.capstone.backend.dto.ExerciseRecordRequest;
import com.capstone.backend.entity.User;
import com.capstone.backend.repository.ExerciseRepository;
import com.capstone.backend.repository.ExerciseRecordRepository;
import com.capstone.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExerciseRecordService {

    private final ExerciseRecordRepository recordRepository;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;

    public List<ExerciseRecord> getMyRecords(String username) {
        return recordRepository.findByUser_UsernameOrderByCreatedAtDesc(username);
    }

    public List<ExerciseRecord> getMyRecordsByExercise(String username, String exerciseId) {
        return recordRepository.findByUser_UsernameAndExerciseIdOrderByCreatedAtDesc(
                username, exerciseId);
    }

    @Transactional
    public ExerciseRecord createRecord(String username, ExerciseRecordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        if (!exerciseRepository.existsById(request.exerciseId())) {
            throw new IllegalArgumentException("운동을 찾을 수 없습니다");
        }
        ExerciseRecord record = ExerciseRecord.builder()
                .exerciseId(request.exerciseId())
                .duration(request.duration())
                .goodCount(request.goodCount())
                .accuracy(request.accuracy())
                .user(user)
                .build();
        return recordRepository.save(record);
    }

    @Transactional
    public void deleteMyRecords(String username) {
        recordRepository.deleteByUser_Username(username);
    }
}
