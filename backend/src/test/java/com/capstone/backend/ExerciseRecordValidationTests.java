package com.capstone.backend;

import com.capstone.backend.dto.ExerciseRecordRequest;
import com.capstone.backend.entity.ExerciseRecord;
import com.capstone.backend.entity.User;
import com.capstone.backend.repository.UserRepository;
import com.capstone.backend.service.ExerciseRecordService;
import jakarta.validation.Validator;
import tools.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class ExerciseRecordValidationTests {

    @Autowired Validator validator;
    @Autowired ExerciseRecordService recordService;
    @Autowired UserRepository userRepository;
    @Autowired ObjectMapper objectMapper;

    @Test
    void rejectsOutOfRangeRecordValues() {
        var invalid = new ExerciseRecordRequest("", -1, -1, 101);
        assertEquals(4, validator.validate(invalid).size());
    }

    @Test
    void rejectsInconsistentMeasurementAndHoldDuration() {
        var invalidCoverage = new ExerciseRecordRequest("sample", 10, 0, 100, "hold", 11, 0, 2, null);
        var invalidFrameCounts = new ExerciseRecordRequest("sample", 10, 0, 0, "hold", 0, 3, 2, null);
        assertEquals(2, validator.validate(invalidCoverage).size());
        assertEquals(1, validator.validate(invalidFrameCounts).size());
    }

    @Test
    void concurrentRetriesReturnOneRecordWithTheSameMeasurements() throws Exception {
        var user = userRepository.save(User.builder()
                .username("measurement-test-user")
                .password("test-only")
                .name("Test")
                .role("USER")
                .build());
        var sessionId = UUID.randomUUID();
        var request = new ExerciseRecordRequest(
                "kneeling-plank", 16, 0, 80, "hold", 12, 40, 60, sessionId);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(() -> recordService.createRecord(user.getUsername(), request));
            var second = executor.submit(() -> recordService.createRecord(user.getUsername(), request));
            var saved = first.get(10, TimeUnit.SECONDS);
            assertEquals(saved.getId(), second.get(10, TimeUnit.SECONDS).getId());
            var records = recordService.getMyRecords(user.getUsername());
            assertEquals(1, records.size());
            var reloaded = records.get(0);
            assertEquals(sessionId, reloaded.getSessionId());
            assertEquals("hold", reloaded.getMode());
            assertEquals(12, reloaded.getTotalHoldSeconds());
            assertEquals(40, reloaded.getMeasuredFrames());
            assertEquals(60, reloaded.getTotalFrames());
        } finally {
            executor.shutdownNow();
            executor.awaitTermination(10, TimeUnit.SECONDS);
            recordService.deleteMyRecords(user.getUsername());
            userRepository.deleteById(user.getId());
        }
    }

    @Test
    @Transactional
    void olderRequestWithoutSessionIdCanStillSaveMoreThanOneRecord() {
        var user = userRepository.save(User.builder()
                .username("legacy-measurement-test-user")
                .password("test-only")
                .name("Test")
                .role("USER")
                .build());
        var request = new ExerciseRecordRequest("seated-front-raise", 10, 1, 80);
        recordService.createRecord(user.getUsername(), request);
        recordService.createRecord(user.getUsername(), request);
        assertEquals(2, recordService.getMyRecords(user.getUsername()).size());
    }

    @Test
    @Transactional
    void rejectsUnknownExercise() {
        userRepository.save(User.builder()
                .username("record-test-user")
                .password("test-only")
                .name("Test")
                .role("USER")
                .build());
        var valid = new ExerciseRecordRequest("missing-exercise", 60, 1, 80);
        assertEquals(0, validator.validate(valid).size());
        assertThrows(IllegalArgumentException.class,
                () -> recordService.createRecord("record-test-user", valid));
    }

    @Test
    void recordTimestampIsExplicitlyUtcInApi() throws Exception {
        var record = ExerciseRecord.builder()
                .exerciseId("sample")
                .duration(60)
                .goodCount(1)
                .accuracy(80)
                .createdAt(LocalDateTime.of(2026, 10, 27, 15, 30))
                .build();
        assertTrue(objectMapper.writeValueAsString(record)
                .contains("\"createdAt\":\"2026-10-27T15:30:00Z\""));
    }
}
