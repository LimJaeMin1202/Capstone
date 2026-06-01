package com.capstone.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "아이디를 입력해주세요")
        @Size(min = 3, max = 20, message = "아이디는 3~20자")
        String username,

        @NotBlank(message = "비밀번호를 입력해주세요")
        @Size(min = 4, message = "비밀번호는 4자 이상")
        String password,

        @NotBlank(message = "이름을 입력해주세요")
        String name,

        // 출생연도 (예: 1965). 나이별 운동 기준·통계용
        @NotNull(message = "출생연도를 입력해주세요")
        @Min(value = 1900, message = "올바른 출생연도를 입력해주세요")
        @Max(value = 2025, message = "올바른 출생연도를 입력해주세요")
        Integer birthYear
) {}
