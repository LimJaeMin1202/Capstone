package com.capstone.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NameRequest(
        @NotBlank(message = "이름을 입력해주세요")
        @Size(min = 1, max = 20, message = "이름은 1~20자")
        String name
) {}
