package com.resumebuilder.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.resumebuilder.dto.ResumeDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final ResumeService resumeService;

    private static final Logger logger = LoggerFactory.getLogger(PdfService.class);

    /**
     * Generates a high-fidelity PDF by rendering HTML via Puppeteer (Node.js).
     */
    /**
     * Generates a high-fidelity PDF by rendering HTML via Puppeteer service (HTTP).
     * Faster than spawning a new process every time.
     */
    public byte[] generatePdfFromHtml(String htmlContent) {
        try {
            logger.info("Requesting PDF from local Node.js service...");

            // Use Java 11+ HttpClient
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(2))
                    .build();

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("http://localhost:3000/generate"))
                    .header("Content-Type", "text/plain")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(htmlContent, StandardCharsets.UTF_8))
                    .timeout(java.time.Duration.ofSeconds(30))
                    .build();

            java.net.http.HttpResponse<byte[]> response = client.send(request,
                    java.net.http.HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() != 200) {
                // Try reading body for error
                String errorBody = new String(response.body(), StandardCharsets.UTF_8);
                throw new RuntimeException("Puppeteer Service Failed: " + response.statusCode() + " - " + errorBody);
            }

            byte[] pdfBytes = response.body();
            logger.info("PDF received successfully. Size: " + pdfBytes.length);

            if (pdfBytes.length == 0) {
                throw new RuntimeException("Received empty PDF from service");
            }

            return pdfBytes;

        } catch (Exception e) {
            logger.error("Failed to generate PDF via HTTP service", e);
            throw new RuntimeException("PDF Generation Failed: " + e.getMessage());
        }
    }

    public byte[] generatePdf(String resumeId, String template, String userId) {
        ResumeDTO resume = resumeService.getById(resumeId, userId);
        return generatePdfDirect(resume, template);
    }

    public byte[] generatePdfDirect(ResumeDTO resume, String template) {
        String selectedTemplate = template != null ? template : resume.getTemplate();

        return switch (selectedTemplate) {
            case "classic" -> generateClassicTemplate(resume);
            case "minimal" -> generateMinimalTemplate(resume);
            case "executive" -> generateExecutiveTemplate(resume);
            case "creative" -> generateCreativeTemplate(resume);
            case "ats" -> generateAtsTemplate(resume);
            case "atsclean" -> generateAtsCleanTemplate(resume);
            case "atsbold" -> generateAtsBoldTemplate(resume);
            case "atscompact" -> generateAtsCompactTemplate(resume);
            case "twocolumn" -> generateTwoColumnTemplate(resume);
            case "developer" -> generateDeveloperTemplate(resume);
            default -> generateModernTemplate(resume);
        };
    }

    // Max bullets per experience - adjust based on content
    private static final int MAX_HIGHLIGHTS = 20;
    private static final int MAX_PROJECTS = 20;

    private byte[] generateModernTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // Use smaller margins to maximize content area
        Document document = new Document(PageSize.A4, 36, 36, 30, 30);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Calculate approximate content density for font sizing
            int contentItems = countContentItems(resume);
            boolean isContentDense = contentItems > 20; // Increased threshold

            Color primaryColor = new Color(30, 58, 138);
            // Use slightly larger fonts for better readability, unless content is very
            // dense
            int titleSize = isContentDense ? 16 : 20; // Increased
            int headingSize = isContentDense ? 10 : 12; // Increased
            int normalSize = isContentDense ? 9 : 11; // Increased
            int smallSize = isContentDense ? 8 : 10; // Increased

            Font titleFont = new Font(Font.HELVETICA, titleSize, Font.BOLD, primaryColor);
            Font headingFont = new Font(Font.HELVETICA, headingSize, Font.BOLD, primaryColor);
            Font normalFont = new Font(Font.HELVETICA, normalSize, Font.NORMAL, Color.DARK_GRAY);
            Font smallFont = new Font(Font.HELVETICA, smallSize, Font.NORMAL, Color.GRAY);
            Font boldFont = new Font(Font.HELVETICA, normalSize, Font.BOLD, Color.DARK_GRAY);

            // Header - compact
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            name.setAlignment(Element.ALIGN_CENTER);
            name.setSpacingAfter(2);
            document.add(name);

            // Contact info - all on one line
            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null && !resume.getEmail().isEmpty())
                contact.append(resume.getEmail());
            if (resume.getPhone() != null && !resume.getPhone().isEmpty()) {
                if (contact.length() > 0)
                    contact.append(" | ");
                contact.append(resume.getPhone());
            }
            if (resume.getLocation() != null && !resume.getLocation().isEmpty()) {
                if (contact.length() > 0)
                    contact.append(" | ");
                contact.append(resume.getLocation());
            }
            if (resume.getLinkedIn() != null && !resume.getLinkedIn().isEmpty()) {
                if (contact.length() > 0)
                    contact.append(" | ");
                contact.append(resume.getLinkedIn());
            }
            if (resume.getGithub() != null && !resume.getGithub().isEmpty()) {
                if (contact.length() > 0)
                    contact.append(" | ");
                contact.append(resume.getGithub());
            }

            if (contact.length() > 0) {
                Paragraph contactPara = new Paragraph(contact.toString(), smallFont);
                contactPara.setAlignment(Element.ALIGN_CENTER);
                contactPara.setSpacingAfter(4);
                document.add(contactPara);
            }

            // Summary - truncate if too long
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                addModernSectionCompact(document, "PROFESSIONAL SUMMARY", headingFont, primaryColor);
                String summary = resume.getSummary().length() > 300 ? resume.getSummary().substring(0, 300) + "..."
                        : resume.getSummary();
                Paragraph summaryPara = new Paragraph(summary, normalFont);
                summaryPara.setSpacingAfter(4);
                document.add(summaryPara);
            }

            // Skills - Put before Experience to match Frontend Preview
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                addModernSectionCompact(document, "SKILLS", headingFont, primaryColor);
                String skillsText = String.join(" • ", resume.getSkills().stream()
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .map(String::trim)
                        .toList());
                Paragraph skills = new Paragraph(skillsText, normalFont);
                skills.setSpacingAfter(4);
                document.add(skills);
            }

            // Experience - limit highlights for 1-page fit
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addModernSectionCompact(document, "EXPERIENCE", headingFont, primaryColor);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    String endDate = (exp.getEndDate() != null && !exp.getEndDate().isEmpty()) ? exp.getEndDate()
                            : "Present";
                    Paragraph title = new Paragraph(exp.getPosition() + " at " + exp.getCompany() + " ("
                            + exp.getStartDate() + " - " + endDate + ")", boldFont);
                    document.add(title);

                    // Check if service-based with client projects
                    if (exp.isServiceBased() && exp.getClientProjects() != null && !exp.getClientProjects().isEmpty()) {
                        int clientCount = 0;
                        for (ResumeDTO.ClientProject client : exp.getClientProjects()) {
                            if (clientCount >= 2)
                                break; // Limit to 2 clients

                            String clientEndDate = (client.getEndDate() != null && !client.getEndDate().isEmpty())
                                    ? client.getEndDate()
                                    : "Present";
                            // Use standard bold font for Client headers (was too small at 7pt)
                            Paragraph clientHeader = new Paragraph("  → " + client.getClientName() + " ("
                                    + client.getStartDate() + " - " + clientEndDate + ")", boldFont);
                            document.add(clientHeader);

                            if (client.getHighlights() != null && !client.getHighlights().isEmpty()) {
                                int count = 0;
                                for (String highlight : client.getHighlights()) {
                                    if (count >= 2)
                                        break;
                                    if (highlight != null && !highlight.trim().isEmpty()) {
                                        Paragraph bullet = new Paragraph("      • " + highlight.trim(), normalFont);
                                        document.add(bullet);
                                        count++;
                                    }
                                }
                            }
                            clientCount++;
                        }
                    } else {
                        // Regular product-based experience - limit highlights
                        if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                            int count = 0;
                            for (String highlight : exp.getHighlights()) {
                                if (count >= MAX_HIGHLIGHTS)
                                    break;
                                if (highlight != null && !highlight.trim().isEmpty()) {
                                    Paragraph bullet = new Paragraph("  • " + highlight.trim(), normalFont);
                                    document.add(bullet);
                                    count++;
                                }
                            }
                        }
                    }
                }
            }

            // Education - compact inline format
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addModernSectionCompact(document, "EDUCATION", headingFont, primaryColor);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    String degreeText = edu.getDegree();
                    if (edu.getField() != null && !edu.getField().isEmpty()) {
                        degreeText += " in " + edu.getField();
                    }
                    String endDate = (edu.getEndDate() != null && !edu.getEndDate().isEmpty()) ? edu.getEndDate()
                            : "Present";
                    degreeText += ", " + edu.getInstitution() + " (" + edu.getStartDate() + " - " + endDate + ")";
                    if (edu.getGpa() != null && !edu.getGpa().isEmpty()) {
                        degreeText += " - GPA: " + edu.getGpa();
                    }
                    Paragraph degree = new Paragraph(degreeText, normalFont);
                    document.add(degree);
                }
            }

            // Projects - limit to MAX_PROJECTS
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                addModernSectionCompact(document, "PROJECTS", headingFont, primaryColor);
                int projCount = 0;
                for (ResumeDTO.Project proj : resume.getProjects()) {
                    if (projCount >= MAX_PROJECTS)
                        break;

                    // Name
                    document.add(new Paragraph(proj.getName(), boldFont));

                    // Description
                    if (proj.getDescription() != null && !proj.getDescription().isEmpty()) {
                        document.add(new Paragraph(proj.getDescription(), normalFont));
                    }

                    // Technologies
                    if (proj.getTechnologies() != null && !proj.getTechnologies().isEmpty()) {
                        Paragraph tech = new Paragraph("Technologies: " + String.join(", ", proj.getTechnologies()),
                                smallFont);
                        tech.setSpacingAfter(4); // spacing after project
                        document.add(tech);
                    } else {
                        document.add(Chunk.NEWLINE);
                    }

                    projCount++;
                }
            }

            // Certifications - inline
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                addModernSectionCompact(document, "CERTIFICATIONS", headingFont, primaryColor);
                String certs = String.join(" | ", resume.getCertifications().stream()
                        .filter(c -> c != null && !c.trim().isEmpty())
                        .map(String::trim)
                        .toList());
                document.add(new Paragraph(certs, normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }

        return out.toByteArray();
    }

    private byte[] generateClassicTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 35, 35, 30, 30);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.TIMES_ROMAN, 16, Font.BOLD, Color.BLACK);
            Font headingFont = new Font(Font.TIMES_ROMAN, 10, Font.BOLD, Color.BLACK);
            Font normalFont = new Font(Font.TIMES_ROMAN, 9, Font.NORMAL, Color.BLACK);
            Font smallFont = new Font(Font.TIMES_ROMAN, 8, Font.ITALIC, Color.DARK_GRAY);
            Font boldFont = new Font(Font.TIMES_ROMAN, 9, Font.BOLD, Color.BLACK);

            // Header
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            name.setAlignment(Element.ALIGN_CENTER);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null && !resume.getEmail().isEmpty())
                contact.append(resume.getEmail());
            if (resume.getPhone() != null && !resume.getPhone().isEmpty()) {
                if (contact.length() > 0)
                    contact.append("  |  ");
                contact.append(resume.getPhone());
            }
            if (resume.getLocation() != null && !resume.getLocation().isEmpty()) {
                if (contact.length() > 0)
                    contact.append("  |  ");
                contact.append(resume.getLocation());
            }

            if (contact.length() > 0) {
                Paragraph contactPara = new Paragraph(contact.toString(), normalFont);
                contactPara.setAlignment(Element.ALIGN_CENTER);
                contactPara.setSpacingAfter(8);
                document.add(contactPara);
            }

            addClassicLine(document, Color.BLACK);

            // Summary
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                addClassicSection(document, "Summary", headingFont);
                Paragraph summary = new Paragraph(resume.getSummary(), normalFont);
                summary.setSpacingAfter(8);
                document.add(summary);
            }

            // Experience - limit highlights
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addClassicSection(document, "Professional Experience", headingFont);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    String endDate = (exp.getEndDate() != null && !exp.getEndDate().isEmpty()) ? exp.getEndDate()
                            : "Present";
                    document.add(new Paragraph(exp.getCompany() + " - " + exp.getPosition() + " (" + exp.getStartDate()
                            + " - " + endDate + ")", boldFont));

                    if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                        int count = 0;
                        for (String h : exp.getHighlights()) {
                            if (count >= MAX_HIGHLIGHTS)
                                break;
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("\u2022 " + h.trim(), normalFont));
                                count++;
                            }
                        }
                    }
                }
            }

            // Skills - before education
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                addClassicSection(document, "Skills", headingFont);
                String skillsText = String.join(" • ", resume.getSkills().stream()
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .map(String::trim)
                        .toList());
                document.add(new Paragraph(skillsText, normalFont));
            }

            // Education - compact
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addClassicSection(document, "Education", headingFont);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    String degreeText = edu.getDegree();
                    if (edu.getField() != null && !edu.getField().isEmpty()) {
                        degreeText += " in " + edu.getField();
                    }
                    degreeText += " - " + edu.getInstitution() + " (" + edu.getStartDate() + " - " + edu.getEndDate()
                            + ")";
                    document.add(new Paragraph(degreeText, normalFont));

                    if (edu.getGpa() != null && !edu.getGpa().isEmpty()) {
                        document.add(new Paragraph("GPA: " + edu.getGpa(), smallFont));
                    }
                }
            }

            // Projects
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                addClassicSection(document, "Projects", headingFont);
                for (ResumeDTO.Project proj : resume.getProjects()) {
                    document.add(new Paragraph(proj.getName(), boldFont));
                    if (proj.getDescription() != null && !proj.getDescription().isEmpty()) {
                        document.add(new Paragraph(proj.getDescription(), normalFont));
                    }
                    if (proj.getTechnologies() != null && !proj.getTechnologies().isEmpty()) {
                        document.add(new Paragraph("Tech: " + String.join(", ", proj.getTechnologies()), smallFont));
                    }
                }
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                addClassicSection(document, "Certifications", headingFont);
                String certs = String.join(" | ", resume.getCertifications());
                document.add(new Paragraph(certs, normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }

        return out.toByteArray();
    }

    private byte[] generateMinimalTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 35, 35, 30, 30);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Color grayColor = new Color(100, 100, 100);
            Font titleFont = new Font(Font.HELVETICA, 14, Font.NORMAL, Color.BLACK);
            Font headingFont = new Font(Font.HELVETICA, 8, Font.BOLD, grayColor);
            Font normalFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.BLACK);
            Font smallFont = new Font(Font.HELVETICA, 7, Font.NORMAL, grayColor);
            Font boldFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.BLACK);

            // Simple header
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null && !resume.getEmail().isEmpty())
                contact.append(resume.getEmail());
            if (resume.getPhone() != null && !resume.getPhone().isEmpty()) {
                if (contact.length() > 0)
                    contact.append(" / ");
                contact.append(resume.getPhone());
            }
            if (resume.getLocation() != null && !resume.getLocation().isEmpty()) {
                if (contact.length() > 0)
                    contact.append(" / ");
                contact.append(resume.getLocation());
            }

            if (contact.length() > 0) {
                Paragraph contactPara = new Paragraph(contact.toString(), smallFont);
                contactPara.setSpacingAfter(15);
                document.add(contactPara);
            }

            // Summary
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                Paragraph summaryPara = new Paragraph(resume.getSummary(), normalFont);
                summaryPara.setSpacingAfter(12);
                document.add(summaryPara);
            }

            // Skills first
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                Paragraph skillsHeading = new Paragraph("SKILLS", headingFont);
                skillsHeading.setSpacingBefore(4);
                document.add(skillsHeading);

                String skillsText = String.join(" • ", resume.getSkills().stream()
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .map(String::trim)
                        .toList());
                document.add(new Paragraph(skillsText, normalFont));
            }

            // Experience - limit highlights
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                Paragraph expHeading = new Paragraph("EXPERIENCE", headingFont);
                expHeading.setSpacingBefore(4);
                document.add(expHeading);

                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    String endDate = (exp.getEndDate() != null && !exp.getEndDate().isEmpty()) ? exp.getEndDate()
                            : "Present";
                    document.add(new Paragraph(exp.getPosition() + " | " + exp.getCompany() + " (" + exp.getStartDate()
                            + " - " + endDate + ")", boldFont));

                    if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                        int count = 0;
                        for (String h : exp.getHighlights()) {
                            if (count >= MAX_HIGHLIGHTS)
                                break;
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("- " + h.trim(), normalFont));
                                count++;
                            }
                        }
                    }
                }
            }

            // Education - compact
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                Paragraph eduHeading = new Paragraph("EDUCATION", headingFont);
                eduHeading.setSpacingBefore(4);
                document.add(eduHeading);

                for (ResumeDTO.Education edu : resume.getEducation()) {
                    String degreeText = edu.getDegree();
                    if (edu.getField() != null && !edu.getField().isEmpty()) {
                        degreeText += " in " + edu.getField();
                    }
                    degreeText += " - " + edu.getInstitution() + " (" + edu.getStartDate() + " - " + edu.getEndDate()
                            + ")";
                    document.add(new Paragraph(degreeText, normalFont));
                }
            }

            // Projects
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                Paragraph projHeading = new Paragraph("PROJECTS", headingFont);
                projHeading.setSpacingBefore(4);
                document.add(projHeading);
                for (ResumeDTO.Project proj : resume.getProjects()) {
                    document.add(new Paragraph(proj.getName(), boldFont));
                    if (proj.getDescription() != null && !proj.getDescription().isEmpty()) {
                        document.add(new Paragraph(proj.getDescription(), normalFont));
                    }
                }
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                Paragraph certHeading = new Paragraph("CERTIFICATIONS", headingFont);
                certHeading.setSpacingBefore(4);
                document.add(certHeading);
                document.add(new Paragraph(String.join(" | ", resume.getCertifications()), normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }

        return out.toByteArray();
    }

    private void addModernSection(Document document, String title, Font font, Color lineColor)
            throws DocumentException {
        Paragraph section = new Paragraph(title, font);
        section.setSpacingBefore(8);
        section.setSpacingAfter(2);
        document.add(section);

        // Add a proper line separator
        LineSeparator line = new LineSeparator(0.5f, 100, lineColor, Element.ALIGN_LEFT, -2);
        document.add(new Chunk(line));
        document.add(Chunk.NEWLINE);
    }

    private void addModernSectionCompact(Document document, String title, Font font, Color lineColor)
            throws DocumentException {
        Paragraph section = new Paragraph(title, font);
        section.setSpacingBefore(4);
        section.setSpacingAfter(1);
        document.add(section);

        LineSeparator line = new LineSeparator(0.3f, 100, lineColor, Element.ALIGN_LEFT, -1);
        document.add(new Chunk(line));
    }

    private void addClassicSection(Document document, String title, Font font) throws DocumentException {
        Paragraph section = new Paragraph(title.toUpperCase(), font);
        section.setSpacingBefore(10);
        section.setSpacingAfter(2);
        document.add(section);
        addClassicLine(document, Color.DARK_GRAY);
    }

    private void addClassicLine(Document document, Color color) throws DocumentException {
        LineSeparator line = new LineSeparator(0.5f, 100, color, Element.ALIGN_CENTER, -2);
        document.add(new Chunk(line));
        document.add(Chunk.NEWLINE);
    }

    private byte[] generateExecutiveTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 30, 30, 30, 30);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Color slate800 = new Color(30, 41, 59);
            Color slate300 = new Color(203, 213, 225);
            Color slate50 = new Color(248, 250, 252);
            Color slate700 = new Color(51, 65, 85);

            Font nameFont = new Font(Font.HELVETICA, 22, Font.BOLD, Color.WHITE);
            Font contactFont = new Font(Font.HELVETICA, 10, Font.NORMAL, slate300);
            Font sectionFont = new Font(Font.HELVETICA, 11, Font.BOLD, slate700);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
            Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, slate700);

            // 1. Header with Background
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);

            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(slate800);
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setPadding(20);

            // Name
            Paragraph name = new Paragraph(resume.getFullName().toUpperCase(), nameFont);
            headerCell.addElement(name);

            // Contact
            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null)
                contact.append(resume.getEmail()).append(" | ");
            if (resume.getPhone() != null)
                contact.append(resume.getPhone()).append(" | ");
            if (resume.getLocation() != null)
                contact.append(resume.getLocation());
            String contactStr = contact.toString();
            if (contactStr.endsWith(" | "))
                contactStr = contactStr.substring(0, contactStr.length() - 3);

            Paragraph contactPara = new Paragraph(contactStr, contactFont);
            headerCell.addElement(contactPara);

            // Links
            java.util.List<String> links = new java.util.ArrayList<>();
            if (resume.getLinkedIn() != null)
                links.add(resume.getLinkedIn());
            if (resume.getGithub() != null)
                links.add(resume.getGithub());
            if (resume.getWebsite() != null)
                links.add(resume.getWebsite());

            if (!links.isEmpty()) {
                Paragraph linkPara = new Paragraph(String.join(" | ", links), contactFont);
                headerCell.addElement(linkPara);
            }

            headerTable.addCell(headerCell);
            document.add(headerTable);
            document.add(Chunk.NEWLINE);

            // 2. Summary (Boxed)
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                PdfPTable summaryTable = new PdfPTable(1);
                summaryTable.setWidthPercentage(100);
                PdfPCell summaryCell = new PdfPCell();
                summaryCell.setBackgroundColor(slate50);
                summaryCell.setBorder(Rectangle.LEFT);
                summaryCell.setBorderColorLeft(slate800);
                summaryCell.setBorderWidthLeft(4f);
                summaryCell.setBorderWidthRight(0);
                summaryCell.setBorderWidthTop(0);
                summaryCell.setBorderWidthBottom(0);
                summaryCell.setPadding(10);

                Paragraph title = new Paragraph("EXECUTIVE SUMMARY", new Font(Font.HELVETICA, 9, Font.BOLD, slate700));
                title.setSpacingAfter(4);
                summaryCell.addElement(title);

                summaryCell.addElement(new Paragraph(resume.getSummary(), normalFont));
                summaryTable.addCell(summaryCell);

                document.add(summaryTable);
                document.add(Chunk.NEWLINE);
            }

            // Helper for sections
            LineSeparator thickLine = new LineSeparator(1.5f, 100, slate800, Element.ALIGN_CENTER, -2);

            // Skills
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                Paragraph title = new Paragraph("CORE COMPETENCIES", sectionFont);
                document.add(title);
                document.add(thickLine);
                document.add(new Paragraph(" "));

                document.add(new Paragraph(String.join("  •  ", resume.getSkills()), normalFont));
                document.add(Chunk.NEWLINE);
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                Paragraph title = new Paragraph("PROFESSIONAL EXPERIENCE", sectionFont);
                document.add(title);
                document.add(thickLine);

                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    document.add(new Paragraph(" "));

                    // Role Details
                    Paragraph role = new Paragraph();
                    role.add(new Chunk(exp.getPosition(), boldFont));
                    role.add(new Chunk(" | " + exp.getCompany(), normalFont));
                    document.add(role);

                    document.add(new Paragraph(
                            exp.getStartDate() + " - " + (exp.getEndDate() != null ? exp.getEndDate() : "Present"),
                            new Font(Font.HELVETICA, 9, Font.ITALIC, Color.GRAY)));

                    if (exp.getDescription() != null)
                        document.add(new Paragraph(exp.getDescription(), normalFont));

                    if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                        com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
                        list.setListSymbol("▸");
                        list.setSymbolIndent(12);
                        list.setIndentationLeft(10);
                        for (String h : exp.getHighlights())
                            list.add(new ListItem(h, normalFont));
                        document.add(list);
                    }
                }
                document.add(Chunk.NEWLINE);
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                Paragraph title = new Paragraph("EDUCATION", sectionFont);
                document.add(title);
                document.add(thickLine);

                for (ResumeDTO.Education edu : resume.getEducation()) {
                    document.add(new Paragraph(" "));
                    document.add(new Paragraph(edu.getDegree() + " in " + edu.getField(), boldFont));
                    document.add(new Paragraph(edu.getInstitution() + " | " + edu.getEndDate(), normalFont));
                }
                document.add(Chunk.NEWLINE);
            }

            // Projects
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                Paragraph title = new Paragraph("PROJECTS", sectionFont);
                document.add(title);
                document.add(thickLine);

                for (ResumeDTO.Project proj : resume.getProjects()) {
                    document.add(new Paragraph(" "));
                    document.add(new Paragraph(proj.getName(), boldFont));
                    if (proj.getDescription() != null)
                        document.add(new Paragraph(proj.getDescription(), normalFont));
                }
                document.add(Chunk.NEWLINE);
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                Paragraph title = new Paragraph("CERTIFICATIONS & LICENSES", sectionFont);
                document.add(title);
                document.add(thickLine);
                document.add(new Paragraph(" "));

                com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
                list.setListSymbol("•");
                list.setSymbolIndent(12);
                list.setIndentationLeft(10);
                for (String c : resume.getCertifications())
                    list.add(new ListItem(c, normalFont));
                document.add(list);
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    private byte[] generateCreativeTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 30, 30, 30, 30);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Color purple600 = new Color(147, 51, 234);
            Color purple100 = new Color(243, 232, 255);

            Font nameFont = new Font(Font.HELVETICA, 24, Font.BOLD, Color.WHITE);
            Font contactFont = new Font(Font.HELVETICA, 10, Font.NORMAL, purple100);
            Font sectionFont = new Font(Font.HELVETICA, 12, Font.BOLD, purple600);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
            Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);

            // 1. Header with Background
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);

            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(purple600);
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setPadding(20);

            Paragraph name = new Paragraph(resume.getFullName(), nameFont);
            headerCell.addElement(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null)
                contact.append(resume.getEmail()).append(" • ");
            if (resume.getPhone() != null)
                contact.append(resume.getPhone()).append(" • ");
            if (resume.getLocation() != null)
                contact.append(resume.getLocation());
            String contactStr = contact.toString();
            if (contactStr.endsWith(" • "))
                contactStr = contactStr.substring(0, contactStr.length() - 3);

            headerCell.addElement(new Paragraph(contactStr, contactFont));

            headerTable.addCell(headerCell);
            document.add(headerTable);
            document.add(Chunk.NEWLINE);

            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                Font italicFont = new Font(Font.HELVETICA, 11, Font.ITALIC, Color.DARK_GRAY);
                Paragraph summary = new Paragraph("\"" + resume.getSummary() + "\"", italicFont);
                summary.setSpacingAfter(15);
                document.add(summary);
            }

            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                document.add(new Paragraph(String.join(" • ", resume.getSkills()), normalFont));
                document.add(Chunk.NEWLINE);
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                Paragraph title = new Paragraph("Experience", sectionFont);
                title.setSpacingAfter(5);
                document.add(title);

                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    document.add(new Paragraph(" "));

                    // Left border simulation? iText makes this hard without tables.
                    // We'll stick to clean indentation.
                    Paragraph role = new Paragraph();
                    role.add(new Chunk(exp.getPosition(), boldFont));
                    role.add(new Chunk(" | " + exp.getCompany(), normalFont));
                    document.add(role);

                    document.add(new Paragraph(
                            exp.getStartDate() + " - " + (exp.getEndDate() != null ? exp.getEndDate() : "Present"),
                            new Font(Font.HELVETICA, 9, Font.ITALIC, Color.GRAY)));

                    if (exp.getDescription() != null)
                        document.add(new Paragraph(exp.getDescription(), normalFont));

                    if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                        com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
                        list.setListSymbol("•");
                        list.setSymbolIndent(12);
                        list.setIndentationLeft(10);
                        for (String h : exp.getHighlights())
                            list.add(new ListItem(h, normalFont));
                        document.add(list);
                    }
                }
                document.add(Chunk.NEWLINE);
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                Paragraph title = new Paragraph("Education", sectionFont);
                document.add(title);

                for (ResumeDTO.Education edu : resume.getEducation()) {
                    document.add(new Paragraph(" "));
                    document.add(new Paragraph(edu.getDegree() + " in " + edu.getField(), boldFont));
                    document.add(new Paragraph(edu.getInstitution() + " | " + edu.getEndDate(), normalFont));
                }
                document.add(Chunk.NEWLINE);
            }

            // Projects
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                Paragraph title = new Paragraph("Projects", sectionFont);
                document.add(title);

                for (ResumeDTO.Project proj : resume.getProjects()) {
                    document.add(new Paragraph(" "));
                    document.add(new Paragraph(proj.getName(), boldFont));
                    if (proj.getDescription() != null && !proj.getDescription().isEmpty()) {
                        document.add(new Paragraph(proj.getDescription(), normalFont));
                    }
                }
                document.add(Chunk.NEWLINE);
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                Paragraph title = new Paragraph("Certifications", sectionFont);
                document.add(title);
                document.add(new Paragraph(String.join(" | ", resume.getCertifications()), normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    // ATS Template - Simple, parseable format, 1-page optimized
    private byte[] generateAtsTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 35, 35, 30, 30);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD, Color.BLACK);
            Font headingFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.BLACK);
            Font normalFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.BLACK);
            Font smallFont = new Font(Font.HELVETICA, 7, Font.NORMAL, Color.DARK_GRAY);

            // Simple header
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null)
                contact.append(resume.getEmail());
            if (resume.getPhone() != null)
                contact.append(" | ").append(resume.getPhone());
            if (resume.getLocation() != null)
                contact.append(" | ").append(resume.getLocation());
            document.add(new Paragraph(contact.toString(), smallFont));

            if (resume.getLinkedIn() != null || resume.getGithub() != null) {
                StringBuilder links = new StringBuilder();
                if (resume.getLinkedIn() != null)
                    links.append(resume.getLinkedIn());
                if (resume.getGithub() != null)
                    links.append(" | ").append(resume.getGithub());
                document.add(new Paragraph(links.toString(), smallFont));
            }

            addClassicLine(document, Color.GRAY);

            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                document.add(new Paragraph("SUMMARY", headingFont));
                document.add(new Paragraph(resume.getSummary(), normalFont));
                document.add(Chunk.NEWLINE);
            }

            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                document.add(new Paragraph("SKILLS", headingFont));
                document.add(new Paragraph(String.join(", ", resume.getSkills()), normalFont));
                document.add(Chunk.NEWLINE);
            }

            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                document.add(new Paragraph("PROFESSIONAL EXPERIENCE", headingFont));
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    Font boldFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.BLACK);
                    String endDate = exp.getEndDate() != null ? exp.getEndDate() : "Present";
                    document.add(new Paragraph(exp.getPosition() + " | " + exp.getCompany() + " (" + exp.getStartDate()
                            + " - " + endDate + ")", boldFont));
                    if (exp.getHighlights() != null) {
                        int count = 0;
                        for (String h : exp.getHighlights()) {
                            if (count >= MAX_HIGHLIGHTS)
                                break;
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("• " + h.trim(), normalFont));
                                count++;
                            }
                        }
                    }
                }
            }

            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                document.add(new Paragraph("EDUCATION", headingFont));
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    Font boldFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.BLACK);
                    String eduLine = edu.getDegree() + " in " + edu.getField() + " - " + edu.getInstitution() + " ("
                            + edu.getStartDate() + " - " + edu.getEndDate() + ")";
                    if (edu.getGpa() != null && !edu.getGpa().isEmpty())
                        eduLine += " | GPA: " + edu.getGpa();
                    document.add(new Paragraph(eduLine, normalFont));
                }
            }

            // Projects
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                document.add(new Paragraph("PROJECTS", headingFont));
                for (ResumeDTO.Project proj : resume.getProjects()) {
                    Font boldFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.BLACK);
                    document.add(new Paragraph(proj.getName(), boldFont));
                    if (proj.getDescription() != null && !proj.getDescription().isEmpty()) {
                        document.add(new Paragraph(proj.getDescription(), normalFont));
                    }
                }
            }

            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                document.add(new Paragraph("CERTIFICATIONS", headingFont));
                document.add(new Paragraph(String.join(" | ", resume.getCertifications()), normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    // ATS Clean - Centered header, serif font, traditional look
    private byte[] generateAtsCleanTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 40, 40);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.TIMES_ROMAN, 16, Font.BOLD, Color.BLACK);
            Font headingFont = new Font(Font.TIMES_ROMAN, 11, Font.BOLD, Color.BLACK);
            Font normalFont = new Font(Font.TIMES_ROMAN, 10, Font.NORMAL, Color.BLACK);
            Font smallFont = new Font(Font.TIMES_ROMAN, 9, Font.NORMAL, Color.DARK_GRAY);

            // Centered header
            Paragraph name = new Paragraph(resume.getFullName().toUpperCase(), titleFont);
            name.setAlignment(Element.ALIGN_CENTER);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getLocation() != null)
                contact.append(resume.getLocation());
            if (resume.getPhone() != null)
                contact.append(" • ").append(resume.getPhone());
            if (resume.getEmail() != null)
                contact.append(" • ").append(resume.getEmail());

            Paragraph contactPara = new Paragraph(contact.toString(), smallFont);
            contactPara.setAlignment(Element.ALIGN_CENTER);
            document.add(contactPara);

            if (resume.getLinkedIn() != null || resume.getGithub() != null) {
                StringBuilder links = new StringBuilder();
                if (resume.getLinkedIn() != null)
                    links.append(resume.getLinkedIn());
                if (resume.getGithub() != null)
                    links.append(" • ").append(resume.getGithub());
                Paragraph linksPara = new Paragraph(links.toString(), smallFont);
                linksPara.setAlignment(Element.ALIGN_CENTER);
                document.add(linksPara);
            }

            addClassicLine(document, Color.DARK_GRAY);

            // Summary
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                document.add(new Paragraph("PROFESSIONAL SUMMARY", headingFont));
                addThinLine(document);
                document.add(new Paragraph(resume.getSummary(), normalFont));
                document.add(Chunk.NEWLINE);
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                document.add(new Paragraph("WORK EXPERIENCE", headingFont));
                addThinLine(document);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    Font boldFont = new Font(Font.TIMES_ROMAN, 10, Font.BOLD, Color.BLACK);
                    Paragraph title = new Paragraph();
                    title.add(new Chunk(exp.getPosition(), boldFont));
                    title.add(new Chunk("  " + exp.getStartDate() + " - "
                            + (exp.getEndDate() != null ? exp.getEndDate() : "Present"), smallFont));
                    document.add(title);
                    document.add(new Paragraph(exp.getCompany(),
                            new Font(Font.TIMES_ROMAN, 10, Font.ITALIC, Color.DARK_GRAY)));
                    if (exp.getHighlights() != null) {
                        com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
                        list.setListSymbol("• ");
                        for (String h : exp.getHighlights()) {
                            if (h != null && !h.trim().isEmpty()) {
                                list.add(new ListItem(h.trim(), normalFont));
                            }
                        }
                        document.add(list);
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                document.add(new Paragraph("EDUCATION", headingFont));
                addThinLine(document);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    Font boldFont = new Font(Font.TIMES_ROMAN, 10, Font.BOLD, Color.BLACK);
                    Paragraph degree = new Paragraph();
                    degree.add(new Chunk(edu.getDegree() + " in " + edu.getField(), boldFont));
                    degree.add(new Chunk("  " + edu.getEndDate(), smallFont));
                    document.add(degree);
                    document.add(new Paragraph(edu.getInstitution(), normalFont));
                    if (edu.getGpa() != null) {
                        document.add(new Paragraph("GPA: " + edu.getGpa(), smallFont));
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            // Skills
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                document.add(new Paragraph("SKILLS", headingFont));
                addThinLine(document);
                document.add(new Paragraph(String.join(", ", resume.getSkills()), normalFont));
                document.add(Chunk.NEWLINE);
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                document.add(new Paragraph("CERTIFICATIONS", headingFont));
                addThinLine(document);
                com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
                list.setListSymbol("• ");
                for (String cert : resume.getCertifications()) {
                    if (cert != null && !cert.trim().isEmpty()) {
                        list.add(new ListItem(cert.trim(), normalFont));
                    }
                }
                document.add(list);
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    // ATS Bold - Bold section headers with gray background
    private byte[] generateAtsBoldTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 45, 45, 40, 40);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD, Color.BLACK);
            Font headingFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK);
            Font normalFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);
            Font smallFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.GRAY);

            // Left-aligned header
            Paragraph name = new Paragraph(resume.getFullName().toUpperCase(), titleFont);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null)
                contact.append(resume.getEmail());
            if (resume.getPhone() != null)
                contact.append(" | ").append(resume.getPhone());
            if (resume.getLocation() != null)
                contact.append(" | ").append(resume.getLocation());
            document.add(new Paragraph(contact.toString(), smallFont));

            if (resume.getLinkedIn() != null || resume.getGithub() != null) {
                StringBuilder links = new StringBuilder();
                if (resume.getLinkedIn() != null)
                    links.append(resume.getLinkedIn());
                if (resume.getGithub() != null)
                    links.append(" | ").append(resume.getGithub());
                document.add(new Paragraph(links.toString(), smallFont));
            }

            // Bold line separator
            LineSeparator boldLine = new LineSeparator(2f, 100, Color.BLACK, Element.ALIGN_CENTER, -2);
            document.add(new Chunk(boldLine));
            document.add(Chunk.NEWLINE);

            // Summary
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                addBoldSection(document, "SUMMARY", headingFont);
                document.add(new Paragraph(resume.getSummary(), normalFont));
                document.add(Chunk.NEWLINE);
            }

            // Skills - Grid style (as text)
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                addBoldSection(document, "CORE COMPETENCIES", headingFont);
                StringBuilder skillsText = new StringBuilder();
                for (int i = 0; i < resume.getSkills().size(); i++) {
                    skillsText.append("• ").append(resume.getSkills().get(i));
                    if ((i + 1) % 3 == 0)
                        skillsText.append("\n");
                    else
                        skillsText.append("    ");
                }
                document.add(new Paragraph(skillsText.toString().trim(), normalFont));
                document.add(Chunk.NEWLINE);
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addBoldSection(document, "PROFESSIONAL EXPERIENCE", headingFont);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    Font boldFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.BLACK);
                    document.add(new Paragraph(exp.getPosition(), boldFont));
                    document.add(new Paragraph(exp.getCompany() + "  |  " + exp.getStartDate() + " – "
                            + (exp.getEndDate() != null ? exp.getEndDate() : "Present"), smallFont));
                    if (exp.getHighlights() != null) {
                        for (String h : exp.getHighlights()) {
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("► " + h.trim(), normalFont));
                            }
                        }
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addBoldSection(document, "EDUCATION", headingFont);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    Font boldFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.BLACK);
                    document.add(new Paragraph(edu.getInstitution(), boldFont));
                    String eduDetails = edu.getDegree() + " in " + edu.getField() + " | " + edu.getEndDate();
                    if (edu.getGpa() != null)
                        eduDetails += " | GPA: " + edu.getGpa();
                    document.add(new Paragraph(eduDetails, normalFont));
                    document.add(Chunk.NEWLINE);
                }
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                addBoldSection(document, "CERTIFICATIONS", headingFont);
                document.add(new Paragraph(String.join(" • ", resume.getCertifications()), normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    // ATS Compact - Dense single page format
    private byte[] generateAtsCompactTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 35, 35);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 12, Font.BOLD, Color.BLACK);
            Font headingFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.BLACK);
            Font normalFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.BLACK);
            Font smallFont = new Font(Font.HELVETICA, 7, Font.NORMAL, Color.DARK_GRAY);

            // Compact centered header
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            name.setAlignment(Element.ALIGN_CENTER);
            document.add(name);

            StringBuilder allContact = new StringBuilder();
            if (resume.getEmail() != null)
                allContact.append(resume.getEmail());
            if (resume.getPhone() != null)
                allContact.append(" | ").append(resume.getPhone());
            if (resume.getLocation() != null)
                allContact.append(" | ").append(resume.getLocation());
            if (resume.getLinkedIn() != null)
                allContact.append(" | ").append(resume.getLinkedIn());
            if (resume.getGithub() != null)
                allContact.append(" | ").append(resume.getGithub());

            Paragraph contactPara = new Paragraph(allContact.toString(), smallFont);
            contactPara.setAlignment(Element.ALIGN_CENTER);
            contactPara.setSpacingAfter(5);
            document.add(contactPara);

            // Summary
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                addCompactSection(document, "Summary", headingFont);
                document.add(new Paragraph(resume.getSummary(), normalFont));
            }

            // Skills
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                addCompactSection(document, "Technical Skills", headingFont);
                document.add(new Paragraph(String.join(" • ", resume.getSkills()), normalFont));
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addCompactSection(document, "Experience", headingFont);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    Font boldFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.BLACK);
                    Paragraph expLine = new Paragraph();
                    expLine.add(new Chunk(exp.getPosition() + ", " + exp.getCompany(), boldFont));
                    expLine.add(new Chunk(
                            "  " + exp.getStartDate() + "-" + (exp.getEndDate() != null ? exp.getEndDate() : "Present"),
                            smallFont));
                    document.add(expLine);
                    if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                        for (int i = 0; i < Math.min(3, exp.getHighlights().size()); i++) {
                            String h = exp.getHighlights().get(i);
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("• " + h.trim(), normalFont));
                            }
                        }
                    }
                }
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addCompactSection(document, "Education", headingFont);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    Font boldFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.BLACK);
                    Paragraph eduLine = new Paragraph();
                    eduLine.add(new Chunk(edu.getDegree() + " in " + edu.getField() + ", " + edu.getInstitution(),
                            boldFont));
                    String details = "  " + edu.getEndDate();
                    if (edu.getGpa() != null)
                        details += " (GPA: " + edu.getGpa() + ")";
                    eduLine.add(new Chunk(details, smallFont));
                    document.add(eduLine);
                }
            }

            // Projects
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                addCompactSection(document, "Projects", headingFont);
                for (ResumeDTO.Project proj : resume.getProjects()) {
                    Font boldFont = new Font(Font.HELVETICA, 8, Font.BOLD, Color.BLACK);
                    Paragraph projLine = new Paragraph();
                    projLine.add(new Chunk(proj.getName(), boldFont));
                    if (proj.getTechnologies() != null && !proj.getTechnologies().isEmpty()) {
                        projLine.add(new Chunk(" (" + String.join(", ", proj.getTechnologies()) + ")", smallFont));
                    }
                    if (proj.getDescription() != null) {
                        projLine.add(new Chunk(" - " + proj.getDescription(), normalFont));
                    }
                    document.add(projLine);
                }
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                addCompactSection(document, "Certifications", headingFont);
                document.add(new Paragraph(String.join(" | ", resume.getCertifications()), normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    private void addThinLine(Document document) throws DocumentException {
        LineSeparator line = new LineSeparator(0.3f, 100, Color.GRAY, Element.ALIGN_LEFT, -2);
        document.add(new Chunk(line));
        document.add(Chunk.NEWLINE);
    }

    private void addBoldSection(Document document, String title, Font font) throws DocumentException {
        Paragraph section = new Paragraph(title, font);
        section.setSpacingBefore(5);
        document.add(section);
        LineSeparator line = new LineSeparator(1f, 100, Color.DARK_GRAY, Element.ALIGN_LEFT, 0);
        document.add(new Chunk(line));
        document.add(Chunk.NEWLINE);
    }

    private void addCompactSection(Document document, String title, Font font) throws DocumentException {
        Paragraph section = new Paragraph(title.toUpperCase(), font);
        section.setSpacingBefore(4);
        document.add(section);
        LineSeparator line = new LineSeparator(0.5f, 100, Color.BLACK, Element.ALIGN_LEFT, 0);
        document.add(new Chunk(line));
    }

    // Two Column and Developer templates use Modern as base (PDF layout complexity)
    private byte[] generateTwoColumnTemplate(ResumeDTO resume) {
        return generateModernTemplate(resume); // Complex layout, fallback to modern
    }

    private byte[] generateDeveloperTemplate(ResumeDTO resume) {
        return generateModernTemplate(resume); // Complex layout, fallback to modern
    }

    // Helper to count content items for dynamic font sizing
    private int countContentItems(ResumeDTO resume) {
        int count = 0;
        if (resume.getSummary() != null && !resume.getSummary().isEmpty())
            count += 2;
        if (resume.getExperience() != null) {
            for (var exp : resume.getExperience()) {
                count += 2; // Company + title
                if (exp.getHighlights() != null)
                    count += Math.min(exp.getHighlights().size(), 4);
                if (exp.getClientProjects() != null)
                    count += exp.getClientProjects().size() * 3;
            }
        }
        if (resume.getEducation() != null)
            count += resume.getEducation().size();
        if (resume.getSkills() != null)
            count += 1;
        if (resume.getProjects() != null)
            count += resume.getProjects().size();
        if (resume.getCertifications() != null)
            count += 1;
        return count;
    }
}
