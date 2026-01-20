package com.resumebuilder.controller;

import com.resumebuilder.dto.ResumeDTO;
import com.resumebuilder.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;

@RestController
@RequestMapping("/api/public/templates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PublicTemplateController {

        private final PdfService pdfService;

        @GetMapping("/{style}/preview")
        public ResponseEntity<byte[]> getTemplatePreview(@PathVariable String style) {
                try {
                        // 1. Create Rich Dummy Data (Full Page)
                        ResumeDTO dummy = new ResumeDTO();
                        dummy.setFullName("Alexander J. Sterling");
                        dummy.setEmail("alex.sterling@example.com");
                        dummy.setPhone("+1 (555) 123-4567");
                        dummy.setLocation("San Francisco, CA");
                        dummy.setLinkedIn("linkedin.com/in/alexsterling");
                        dummy.setWebsite("alexsterling.dev");
                        dummy.setSummary(
                                        "Senior Software Architect with 8+ years of experience designing scalable, high-performance distributed systems. Proven track record of leading cross-functional teams to deliver mission-critical solutions in FinTech and Cloud Infrastructure. Passionate about clean code, microservices architecture, and mentoring junior developers.");

                        dummy.setSkills(List.of(
                                        "Java / Kotlin", "Spring Boot", "Microservices", "React.js", "System Design",
                                        "AWS (ECS, Lambda, S3)", "Docker & Kubernetes", "PostgreSQL", "Redis",
                                        "Kafka", "CI/CD (Jenkins, GitHub Actions)", "Agile Leadership"));

                        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
                        exp1.setCompany("Nexus Cloud Solutions");
                        exp1.setPosition("Senior Software Architect");
                        exp1.setStartDate("2021");
                        exp1.setEndDate("Present");
                        exp1.setHighlights(List.of(
                                        "Architected a cloud-native payment processing engine processing $50M+ daily volume, achieving 99.99% availability.",
                                        "Led the migration of a legacy monolith to microservices, reducing deployment time by 60% and infrastructure costs by 25%.",
                                        "Mentored a team of 12 engineers, establishing code review standards and introducing TDD practices."));

                        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
                        exp2.setCompany("FinGlobal Systems");
                        exp2.setPosition("Lead Backend Engineer");
                        exp2.setStartDate("2018");
                        exp2.setEndDate("2021");
                        exp2.setHighlights(List.of(
                                        "Designed and implemented a real-time fraud detection service using Kafka and Spark, reducing fraudulent transactions by 40%.",
                                        "Optimized database queries and indexing strategies, improving API response times from 500ms to 50ms.",
                                        "Collaborated with product managers to define roadmap and technical requirements for the core banking platform."));

                        ResumeDTO.Experience exp3 = new ResumeDTO.Experience();
                        exp3.setCompany("Innovate Tech");
                        exp3.setPosition("Software Engineer");
                        exp3.setStartDate("2015");
                        exp3.setEndDate("2018");
                        exp3.setHighlights(List.of(
                                        "Developed full-stack features for a SaaS dashboard using Spring Boot and Angular.",
                                        "Implemented automated testing pipelines increasing code coverage from 45% to 85%.",
                                        "Resolved critical production bugs and improved system stability during high-traffic events."));

                        ResumeDTO.Education edu1 = new ResumeDTO.Education();
                        edu1.setInstitution("Stanford University");
                        edu1.setDegree("M.S. Computer Science");
                        edu1.setStartDate("2013");
                        edu1.setEndDate("2015");

                        ResumeDTO.Education edu2 = new ResumeDTO.Education();
                        edu2.setInstitution("University of California, Berkeley");
                        edu2.setDegree("B.S. Electrical Engineering & CS");
                        edu2.setStartDate("2009");
                        edu2.setEndDate("2013");

                        dummy.setExperience(List.of(exp1, exp2, exp3));
                        dummy.setEducation(List.of(edu1, edu2));
                        dummy.setTemplate(style);

                        // 2. Generate PDF
                        byte[] pdfBytes = pdfService.generatePdfDirect(dummy, style);

                        // 3. Convert to Image (PNG)
                        try (PDDocument document = PDDocument.load(pdfBytes)) {
                                PDFRenderer pdfRenderer = new PDFRenderer(document);
                                // Render page 0 at 300 DPI for high quality (Retina ready)
                                BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 300, ImageType.RGB);

                                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                                ImageIO.write(bim, "png", baos);
                                byte[] imageBytes = baos.toByteArray();

                                return ResponseEntity.ok()
                                                .contentType(MediaType.IMAGE_PNG)
                                                .body(imageBytes);
                        }

                } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.internalServerError().build();
                }
        }
}
