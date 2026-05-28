package com.capstone.backend.dto;

// 로그인 성공 시 반환 (토큰 + 사용자 정보)
public record AuthResponse(
        String token,
        String username,
        String name
) {}
