package com.capstone.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BirthYearRequest(
        @NotNull(message = "출생연도를 입력해주세요")
        @Min(value = 1900, message = "올바른 출생연도를 입력해주세요")
        @Max(value = 2025, message = "올바른 출생연도를 입력해주세요")
        Integer birthYear
) {}
