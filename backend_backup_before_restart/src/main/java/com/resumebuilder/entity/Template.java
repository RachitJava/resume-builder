package com.resumebuilder.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "templates")
public class Template {
    @Id
    private String id;
    private String name;
    private String country;
    private String description;
    private String baseStyle;

    @Column(columnDefinition = "TEXT")
    private String structure; // JSON structure if needed
}
