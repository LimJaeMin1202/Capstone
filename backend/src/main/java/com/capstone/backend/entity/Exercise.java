package com.capstone.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

    @Id
    private String id;

    private String name;

    private String category;

    private String icon;

    @Column(name = "description")
    private String description;

    private String difficulty;

    @Column(name = "target_sets")
    private Integer targetSets;

    @Column(name = "target_reps")
    private Integer targetReps;

    @Embedded
    private Feedback feedback;

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Joint> joints = new ArrayList<>();

    public void addJoint(Joint joint) {
        joints.add(joint);
        joint.setExercise(this);
    }
}
