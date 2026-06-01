package com.capstone.backend.dto;

// 내 정보 조회(/api/auth/me) 응답
public record UserResponse(
        String username,
        String name,
        Integer birthYear // null 가능 — 카카오 가입자가 아직 입력 안 했으면 null
) {}
