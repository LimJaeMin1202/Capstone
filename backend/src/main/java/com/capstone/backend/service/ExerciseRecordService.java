package com.capstone.backend.service;

import com.capstone.backend.entity.ExerciseRecord;
import com.capstone.backend.entity.User;
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

    public List<ExerciseRecord> getMyRecords(String username) {
        return recordRepository.findByUser_UsernameOrderByCreatedAtDesc(username);
    }

    public List<ExerciseRecord> getMyRecordsByExercise(String username, String exerciseId) {
        return recordRepository.findByUser_UsernameAndExerciseIdOrderByCreatedAtDesc(
                username, exerciseId);
    }

    @Transactional
    public ExerciseRecord createRecord(String username, ExerciseRecord record) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        record.setUser(user); // 현재 로그인 사용자로 주인 설정
        return recordRepository.save(record);
    }

    @Transactional
    public void deleteMyRecords(String username) {
        recordRepository.deleteByUser_Username(username);
    }
}
