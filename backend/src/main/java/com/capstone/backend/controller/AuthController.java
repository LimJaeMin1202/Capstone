package com.capstone.backend.controller;

import com.capstone.backend.dto.AuthResponse;
import com.capstone.backend.dto.BirthYearRequest;
import com.capstone.backend.dto.KakaoLoginRequest;
import com.capstone.backend.dto.LoginRequest;
import com.capstone.backend.dto.NameRequest;
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

    // 출생연도 입력·수정 (주로 카카오 가입자 첫 로그인 후 모달)
    @PatchMapping("/me/birth-year")
    public UserResponse updateBirthYear(
            Authentication authentication,
            @Valid @RequestBody BirthYearRequest req
    ) {
        return authService.updateBirthYear(authentication.getName(), req.birthYear());
    }

    // 이름 변경
    @PatchMapping("/me/name")
    public UserResponse updateName(
            Authentication authentication,
            @Valid @RequestBody NameRequest req
    ) {
        return authService.updateName(authentication.getName(), req.name());
    }
}
