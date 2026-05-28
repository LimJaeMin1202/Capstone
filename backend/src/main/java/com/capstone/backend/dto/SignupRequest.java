package com.capstone.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "아이디를 입력해주세요")
        @Size(min = 3, max = 20, message = "아이디는 3~20자")
        String username,

        @NotBlank(message = "비밀번호를 입력해주세요")
        @Size(min = 4, message = "비밀번호는 4자 이상")
        String password,

        @NotBlank(message = "이름을 입력해주세요")
        String name
) {}
