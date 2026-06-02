package com.capstone.backend.controller;

import com.capstone.backend.dto.GoalResponse;
import com.capstone.backend.dto.GoalUpdateRequest;
import com.capstone.backend.service.UserGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class UserGoalController {

    private final UserGoalService userGoalService;

    // 내 목표 조회 (없으면 기본값 자동 생성)
    @GetMapping
    public GoalResponse getMyGoal(Authentication authentication) {
        return userGoalService.getMyGoal(authentication.getName());
    }

    // 목표 변경
    @PutMapping
    public GoalResponse updateGoal(
            Authentication authentication,
            @Valid @RequestBody GoalUpdateRequest req
    ) {
        return userGoalService.updateGoal(
                authentication.getName(),
                req.weeklySessionTarget(),
                req.weeklyMinuteTarget()
        );
    }
}
