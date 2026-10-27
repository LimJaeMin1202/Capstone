package com.capstone.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExerciseRecordRequest(
        @NotBlank(message = "운동을 선택해주세요")
        @Size(max = 100)
        String exerciseId,
        @NotNull(message = "운동 시간을 입력해주세요")
        @Min(value = 0, message = "운동 시간은 0초 이상이어야 합니다")
        @Max(value = 86400, message = "운동 시간은 24시간 이하여야 합니다")
        Integer duration,
        @NotNull(message = "운동 횟수를 입력해주세요")
        @Min(value = 0, message = "운동 횟수는 0회 이상이어야 합니다")
        @Max(value = 10000, message = "운동 횟수가 너무 큽니다")
        Integer goodCount,
        @NotNull(message = "정확도를 입력해주세요")
        @Min(value = 0, message = "정확도는 0~100 사이여야 합니다")
        @Max(value = 100, message = "정확도는 0~100 사이여야 합니다")
        Integer accuracy
) {}
