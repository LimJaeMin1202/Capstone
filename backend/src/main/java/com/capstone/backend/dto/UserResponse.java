package com.capstone.backend.dto;

// 내 정보 조회(/api/auth/me) 응답
public record UserResponse(
        String username,
        String name
) {}
