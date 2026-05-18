package com.capstone.backend.service;

import com.capstone.backend.entity.ExerciseRecord;
import com.capstone.backend.repository.ExerciseRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExerciseRecordService {

    private final ExerciseRecordRepository recordRepository;

    public List<ExerciseRecord> getAllRecords() {
        return recordRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<ExerciseRecord> getRecordsByExercise(String exerciseId) {
        return recordRepository.findByExerciseIdOrderByCreatedAtDesc(exerciseId);
    }

    @Transactional
    public ExerciseRecord createRecord(ExerciseRecord record) {
        return recordRepository.save(record);
    }

    @Transactional
    public void deleteAllRecords() {
        recordRepository.deleteAll();
    }
}
