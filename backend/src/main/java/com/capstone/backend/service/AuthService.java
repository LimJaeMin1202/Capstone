package com.capstone.backend.service;

import com.capstone.backend.dto.AuthResponse;
import com.capstone.backend.dto.LoginRequest;
import com.capstone.backend.dto.SignupRequest;
import com.capstone.backend.dto.UserResponse;
import com.capstone.backend.entity.User;
import com.capstone.backend.repository.UserRepository;
import com.capstone.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final KakaoService kakaoService;

    @Transactional
    public void signup(SignupRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다");
        }
        User user = User.builder()
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))
                .name(req.name())
                .role("USER")
                .birthYear(req.birthYear())
                .build();
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.username())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다"));

        // 카카오 가입자는 비밀번호가 없음 → 일반 로그인 차단
        if (user.getPassword() == null) {
            throw new IllegalArgumentException("카카오로 가입된 계정입니다. 카카오 로그인을 이용해주세요");
        }

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다");
        }

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getName());
    }

    // 카카오 로그인: 신규면 자동 가입, 기존이면 로그인 → 우리 JWT 발급
    @Transactional
    public AuthResponse kakaoLogin(String code, String redirectUri) {
        String accessToken = kakaoService.getAccessToken(code, redirectUri);
        KakaoService.KakaoUserInfo info = kakaoService.getUserInfo(accessToken);
        String kakaoIdStr = String.valueOf(info.kakaoId());

        User user = userRepository.findByKakaoId(kakaoIdStr)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .username("kakao_" + kakaoIdStr)
                                .password(null) // 카카오 가입자는 비번 없음
                                .name(info.nickname())
                                .role("USER")
                                .kakaoId(kakaoIdStr)
                                .build()
                ));

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, user.getUsername(), user.getName());
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        return new UserResponse(user.getUsername(), user.getName(), user.getBirthYear());
    }

    // 카카오 가입자가 첫 로그인 후 출생연도를 입력하는 용도
    @Transactional
    public UserResponse updateBirthYear(String username, Integer birthYear) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        user.setBirthYear(birthYear);
        // @Transactional 트랜잭션 안에서 변경 감지로 자동 update
        return new UserResponse(user.getUsername(), user.getName(), user.getBirthYear());
    }
}
