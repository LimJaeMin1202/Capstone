package com.capstone.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username; // 로그인 아이디 (카카오는 "kakao_" + id 자동)

    @Column(nullable = true)
    private String password; // BCrypt 해시 (카카오 가입자는 null)

    @Column(nullable = false)
    private String name; // 표시 이름

    @Column(nullable = false)
    private String role; // 권한 (예: "USER")

    @Column(name = "kakao_id", unique = true)
    private String kakaoId; // 카카오 로그인 사용자 식별자 (일반 가입자는 null)

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.role == null) this.role = "USER";
    }
}
