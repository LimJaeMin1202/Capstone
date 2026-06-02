package com.capstone.backend.repository;

import com.capstone.backend.entity.User;
import com.capstone.backend.entity.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserGoalRepository extends JpaRepository<UserGoal, Long> {
    Optional<UserGoal> findByUser(User user);
}
