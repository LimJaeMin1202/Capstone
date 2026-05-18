package com.capstone.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "exercise_joints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Joint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;

    @Column(name = "point_a")
    private Integer pointA;

    @Column(name = "point_b")
    private Integer pointB;

    @Column(name = "point_c")
    private Integer pointC;

    @Column(name = "min_angle")
    private Integer minAngle;

    @Column(name = "max_angle")
    private Integer maxAngle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id")
    @JsonIgnore
    private Exercise exercise;
}
