package com.capstone.backend.service;

import com.capstone.backend.dto.GoalResponse;
import com.capstone.backend.entity.User;
import com.capstone.backend.entity.UserGoal;
import com.capstone.backend.repository.UserGoalRepository;
import com.capstone.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserGoalService {

    private final UserGoalRepository userGoalRepository;
    private final UserRepository userRepository;

    // 기본 목표: 주 3회, 30분 (어르신 재활 운동 기준 권장 수준)
    private static final int DEFAULT_SESSION_TARGET = 3;
    private static final int DEFAULT_MINUTE_TARGET = 30;

    // 조회 — 없으면 자동으로 기본값 생성 후 반환
    @Transactional
    public GoalResponse getMyGoal(String username) {
        User user = findUser(username);
        UserGoal goal = userGoalRepository.findByUser(user)
                .orElseGet(() -> createDefault(user));
        return toResponse(goal);
    }

    @Transactional
    public GoalResponse updateGoal(String username, Integer sessionTarget, Integer minuteTarget) {
        User user = findUser(username);
        UserGoal goal = userGoalRepository.findByUser(user)
                .orElseGet(() -> createDefault(user));
        goal.setWeeklySessionTarget(sessionTarget);
        goal.setWeeklyMinuteTarget(minuteTarget);
        return toResponse(goal);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
    }

    private UserGoal createDefault(User user) {
        UserGoal goal = UserGoal.builder()
                .user(user)
                .weeklySessionTarget(DEFAULT_SESSION_TARGET)
                .weeklyMinuteTarget(DEFAULT_MINUTE_TARGET)
                .build();
        return userGoalRepository.save(goal);
    }

    private GoalResponse toResponse(UserGoal goal) {
        return new GoalResponse(goal.getWeeklySessionTarget(), goal.getWeeklyMinuteTarget());
    }
}
