package com.capstone.backend.controller;

import com.capstone.backend.entity.ExerciseRecord;
import com.capstone.backend.service.ExerciseRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class ExerciseRecordController {

    private final ExerciseRecordService recordService;

    @GetMapping
    public List<ExerciseRecord> getRecords(
            Authentication authentication,
            @RequestParam(required = false) String exerciseId
    ) {
        String username = authentication.getName();
        if (exerciseId != null) {
            return recordService.getMyRecordsByExercise(username, exerciseId);
        }
        return recordService.getMyRecords(username);
    }

    @PostMapping
    public ResponseEntity<ExerciseRecord> createRecord(
            Authentication authentication,
            @RequestBody ExerciseRecord record
    ) {
        ExerciseRecord created = recordService.createRecord(authentication.getName(), record);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteRecords(Authentication authentication) {
        recordService.deleteMyRecords(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
