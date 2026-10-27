package com.capstone.backend;

import com.capstone.backend.controller.HealthController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests {

    @Autowired HealthController healthController;

    @Test
    void contextLoads() {
        assertEquals(HttpStatus.OK, healthController.health().getStatusCode());
    }

}
