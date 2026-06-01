package com.capstone.backend.repository;

import com.capstone.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 아이디로 사용자 찾기 (로그인·중복확인용)
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    // 카카오 ID로 사용자 찾기 (OAuth 로그인용)
    Optional<User> findByKakaoId(String kakaoId);
}
