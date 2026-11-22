package com.capstone.backend.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

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
        @NotNull(message = "자세 기준 충족률을 입력해주세요")
        @Min(value = 0, message = "자세 기준 충족률은 0~100 사이여야 합니다")
        @Max(value = 100, message = "자세 기준 충족률은 0~100 사이여야 합니다")
        Integer accuracy,
        @Pattern(regexp = "rep|hold", message = "운동 모드가 올바르지 않습니다")
        String mode,
        @Min(0) @Max(86400) Integer totalHoldSeconds,
        @Min(0) Integer measuredFrames,
        @Min(0) Integer totalFrames,
        UUID sessionId
) {
    public ExerciseRecordRequest(String exerciseId, Integer duration, Integer goodCount, Integer accuracy) {
        this(exerciseId, duration, goodCount, accuracy, null, null, null, null, null);
    }

    @AssertTrue(message = "측정 프레임 수가 올바르지 않습니다")
    public boolean isMeasurementConsistent() {
        if (measuredFrames == null && totalFrames == null) return true;
        return measuredFrames != null && totalFrames != null && measuredFrames <= totalFrames
                && (measuredFrames > 0 || accuracy == null || accuracy == 0);
    }

    @AssertTrue(message = "누적 유지시간은 운동 시간 이하여야 합니다")
    public boolean isHoldDurationConsistent() {
        return totalHoldSeconds == null || duration == null || totalHoldSeconds <= duration;
    }
}
