package com.capstone.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record KakaoLoginRequest(
        @NotBlank String code,        // 카카오에서 받은 인가코드
        @NotBlank String redirectUri  // 카카오 콘솔에 등록한 Redirect URI
) {}
