package com.capstone.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GoalUpdateRequest(
        @NotNull(message = "주간 운동 횟수를 입력해주세요")
        @Min(value = 1, message = "최소 1회 이상이어야 합니다")
        @Max(value = 50, message = "최대 50회까지 가능합니다")
        Integer weeklySessionTarget,

        @NotNull(message = "주간 운동 시간을 입력해주세요")
        @Min(value = 1, message = "최소 1분 이상이어야 합니다")
        @Max(value = 1000, message = "최대 1000분까지 가능합니다")
        Integer weeklyMinuteTarget
) {}
