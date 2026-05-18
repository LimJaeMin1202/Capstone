package com.capstone.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Column(name = "feedback_ok")
    private String ok;

    @Column(name = "feedback_low")
    private String low;

    @Column(name = "feedback_high")
    private String high;
}
