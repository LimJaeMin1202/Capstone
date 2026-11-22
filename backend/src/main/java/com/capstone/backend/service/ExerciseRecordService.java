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
        var owner = request.sessionId() == null
                ? userRepository.findByUsername(username)
                : userRepository.findByUsernameForUpdate(username);
        User user = owner.orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        if (request.sessionId() != null) {
            // 같은 사용자의 동시 재시도는 사용자 행 잠금 안에서 기존 기록을 확인한다.
            var previous = recordRepository.findByUserAndSessionId(user, request.sessionId());
            if (previous.isPresent()) {
                ExerciseRecord existing = previous.get();
                if (!existing.getExerciseId().equals(request.exerciseId())) {
                    throw new IllegalArgumentException("이미 다른 운동 기록에 사용된 요청입니다");
                }
                return existing;
            }
        }
        if (!exerciseRepository.existsById(request.exerciseId())) {
            throw new IllegalArgumentException("운동을 찾을 수 없습니다");
        }
        ExerciseRecord record = ExerciseRecord.builder()
                .exerciseId(request.exerciseId())
                .duration(request.duration())
                .goodCount(request.goodCount())
                .accuracy(request.accuracy())
                .sessionId(request.sessionId())
                .mode(request.mode())
                .totalHoldSeconds(request.totalHoldSeconds())
                .measuredFrames(request.measuredFrames())
                .totalFrames(request.totalFrames())
                .user(user)
                .build();
        return recordRepository.save(record);
    }

    @Transactional
    public void deleteMyRecords(String username) {
        recordRepository.deleteByUser_Username(username);
    }
}
