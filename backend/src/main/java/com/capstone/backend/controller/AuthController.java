package com.capstone.backend.controller;

import com.capstone.backend.dto.AuthResponse;
import com.capstone.backend.dto.KakaoLoginRequest;
import com.capstone.backend.dto.LoginRequest;
import com.capstone.backend.dto.SignupRequest;
import com.capstone.backend.dto.UserResponse;
import com.capstone.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@Valid @RequestBody SignupRequest req) {
        authService.signup(req);
        return ResponseEntity.ok().build();
    }

    // 로그인 → JWT 반환
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    // 카카오 로그인 → JWT 반환 (프론트가 받은 인가코드 + redirectUri 전달)
    @PostMapping("/kakao")
    public AuthResponse kakaoLogin(@Valid @RequestBody KakaoLoginRequest req) {
        return authService.kakaoLogin(req.code(), req.redirectUri());
    }

    // 내 정보 (토큰 필요)
    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return authService.getMe(authentication.getName());
    }
}
