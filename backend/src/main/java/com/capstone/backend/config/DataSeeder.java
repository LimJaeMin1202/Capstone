package com.capstone.backend.config;

import com.capstone.backend.entity.Exercise;
import com.capstone.backend.repository.ExerciseRepository;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final ExerciseRepository exerciseRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (exerciseRepository.count() > 0) {
            log.info("DB에 이미 운동 데이터가 있어요. 시딩 건너뜀.");
            return;
        }

        log.info("운동 데이터 시딩 시작...");

        try (InputStream is = new ClassPathResource("exercises.json").getInputStream()) {
            Exercise[] array = objectMapper.readValue(is, Exercise[].class);
            List<Exercise> exercises = List.of(array);
            exerciseRepository.saveAll(exercises);
            log.info("운동 데이터 시딩 완료! ({}개 운동 등록됨)", exercises.size());
        }
    }
}
