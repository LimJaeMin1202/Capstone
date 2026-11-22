package com.capstone.backend.repository;

import com.capstone.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 아이디로 사용자 찾기 (로그인·중복확인용)
    Optional<User> findByUsername(String username);

    @Query(value = "SELECT * FROM users WHERE username = :username FOR UPDATE", nativeQuery = true)
    Optional<User> findByUsernameForUpdate(@Param("username") String username);

    boolean existsByUsername(String username);

    // 카카오 ID로 사용자 찾기 (OAuth 로그인용)
    Optional<User> findByKakaoId(String kakaoId);
}
