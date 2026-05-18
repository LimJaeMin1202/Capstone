package com.capstone.backend.controller;

import com.capstone.backend.entity.ExerciseRecord;
import com.capstone.backend.service.ExerciseRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class ExerciseRecordController {

    private final ExerciseRecordService recordService;

    @GetMapping
    public List<ExerciseRecord> getAllRecords(
            @RequestParam(required = false) String exerciseId
    ) {
        if (exerciseId != null) {
            return recordService.getRecordsByExercise(exerciseId);
        }
        return recordService.getAllRecords();
    }

    @PostMapping
    public ResponseEntity<ExerciseRecord> createRecord(@RequestBody ExerciseRecord record) {
        ExerciseRecord created = recordService.createRecord(record);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllRecords() {
        recordService.deleteAllRecords();
        return ResponseEntity.noContent().build();
    }
}
