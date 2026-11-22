package com.capstone.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "exercise_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exercise_id", nullable = false)
    private String exerciseId;

    @Column(nullable = false)
    private Integer duration;          // 운동 시간 (초)

    @Column(name = "good_count", nullable = false)
    private Integer goodCount;         // 정확한 자세 횟수

    @Column(nullable = false)
    private Integer accuracy;          // 자세 기준 충족률 (0~100)

    @Column(name = "session_id", updatable = false)
    private UUID sessionId;

    @Column(length = 4)
    private String mode;

    @Column(name = "total_hold_seconds")
    private Integer totalHoldSeconds;

    @Column(name = "measured_frames")
    private Integer measuredFrames;

    @Column(name = "total_frames")
    private Integer totalFrames;

    @Column(name = "created_at", nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime createdAt;

    // 이 기록의 주인 (서버에서 로그인 사용자로 설정)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
