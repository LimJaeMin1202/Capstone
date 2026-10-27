package com.capstone.backend;

import com.capstone.backend.dto.ExerciseRecordRequest;
import com.capstone.backend.entity.ExerciseRecord;
import com.capstone.backend.entity.User;
import com.capstone.backend.repository.UserRepository;
import com.capstone.backend.service.ExerciseRecordService;
import jakarta.validation.Validator;
import tools.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
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
