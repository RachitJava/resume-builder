package com.resumebuilder.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.resumebuilder.dto.ResumeDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final ResumeService resumeService;

    public byte[] generatePdf(String resumeId, String template) {
        ResumeDTO resume = resumeService.getById(resumeId);
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

    private byte[] generateModernTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Color primaryColor = new Color(30, 58, 138);
            Font titleFont = new Font(Font.HELVETICA, 24, Font.BOLD, primaryColor);
            Font headingFont = new Font(Font.HELVETICA, 11, Font.BOLD, primaryColor);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);
            Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);

            // Header
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            name.setAlignment(Element.ALIGN_CENTER);
            document.add(name);

            // Contact info
            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null && !resume.getEmail().isEmpty()) 
                contact.append(resume.getEmail());
            if (resume.getPhone() != null && !resume.getPhone().isEmpty()) {
                if (contact.length() > 0) contact.append("  |  ");
                contact.append(resume.getPhone());
            }
            if (resume.getLocation() != null && !resume.getLocation().isEmpty()) {
                if (contact.length() > 0) contact.append("  |  ");
                contact.append(resume.getLocation());
            }
            
            if (contact.length() > 0) {
                Paragraph contactPara = new Paragraph(contact.toString(), smallFont);
                contactPara.setAlignment(Element.ALIGN_CENTER);
                contactPara.setSpacingAfter(3);
                document.add(contactPara);
            }

            // Links
            StringBuilder links = new StringBuilder();
            if (resume.getLinkedIn() != null && !resume.getLinkedIn().isEmpty()) 
                links.append(resume.getLinkedIn());
            if (resume.getGithub() != null && !resume.getGithub().isEmpty()) {
                if (links.length() > 0) links.append("  |  ");
                links.append(resume.getGithub());
            }
            if (resume.getWebsite() != null && !resume.getWebsite().isEmpty()) {
                if (links.length() > 0) links.append("  |  ");
                links.append(resume.getWebsite());
            }
            
            if (links.length() > 0) {
                Paragraph linksPara = new Paragraph(links.toString(), smallFont);
                linksPara.setAlignment(Element.ALIGN_CENTER);
                document.add(linksPara);
            }

            document.add(Chunk.NEWLINE);

            // Summary
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                addModernSection(document, "PROFESSIONAL SUMMARY", headingFont, primaryColor);
                Paragraph summaryPara = new Paragraph(resume.getSummary(), normalFont);
                summaryPara.setSpacingAfter(8);
                document.add(summaryPara);
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addModernSection(document, "EXPERIENCE", headingFont, primaryColor);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    Paragraph title = new Paragraph(exp.getPosition() + " at " + exp.getCompany(), boldFont);
                    document.add(title);
                    
                    String endDate = (exp.getEndDate() != null && !exp.getEndDate().isEmpty()) ? exp.getEndDate() : "Present";
                    String dates = exp.getStartDate() + " - " + endDate;
                    document.add(new Paragraph(dates, smallFont));
                    
                    // Check if service-based with client projects
                    if (exp.isServiceBased() && exp.getClientProjects() != null && !exp.getClientProjects().isEmpty()) {
                        for (ResumeDTO.ClientProject client : exp.getClientProjects()) {
                            Paragraph clientHeader = new Paragraph();
                            clientHeader.setIndentationLeft(15);
                            clientHeader.setSpacingBefore(5);
                            
                            Font clientBoldFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.DARK_GRAY);
                            clientHeader.add(new Chunk("Client: " + client.getClientName(), clientBoldFont));
                            if (client.getProjectName() != null && !client.getProjectName().isEmpty()) {
                                clientHeader.add(new Chunk(" (" + client.getProjectName() + ")", smallFont));
                            }
                            document.add(clientHeader);
                            
                            if (client.getRole() != null && !client.getRole().isEmpty()) {
                                Paragraph rolePara = new Paragraph(client.getRole(), smallFont);
                                rolePara.setIndentationLeft(15);
                                document.add(rolePara);
                            }
                            
                            String clientEndDate = (client.getEndDate() != null && !client.getEndDate().isEmpty()) ? client.getEndDate() : "Present";
                            Paragraph clientDates = new Paragraph(client.getStartDate() + " - " + clientEndDate, smallFont);
                            clientDates.setIndentationLeft(15);
                            document.add(clientDates);
                            
                            if (client.getHighlights() != null && !client.getHighlights().isEmpty()) {
                                com.lowagie.text.List clientList = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
                                clientList.setListSymbol(new Chunk("\u2022 ", normalFont));
                                clientList.setIndentationLeft(25);
                                for (String highlight : client.getHighlights()) {
                                    if (highlight != null && !highlight.trim().isEmpty()) {
                                        clientList.add(new ListItem(highlight.trim(), normalFont));
                                    }
                                }
                                document.add(clientList);
                            }
                        }
                    } else {
                        // Regular product-based experience
                        if (exp.getDescription() != null && !exp.getDescription().isEmpty()) {
                            Paragraph desc = new Paragraph(exp.getDescription(), normalFont);
                            desc.setSpacingBefore(3);
                            document.add(desc);
                        }
                        
                        if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                            com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
                            list.setListSymbol(new Chunk("\u2022 ", normalFont));
                            list.setIndentationLeft(10);
                            for (String highlight : exp.getHighlights()) {
                                if (highlight != null && !highlight.trim().isEmpty()) {
                                    list.add(new ListItem(highlight.trim(), normalFont));
                                }
                            }
                            document.add(list);
                        }
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addModernSection(document, "EDUCATION", headingFont, primaryColor);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    String degreeText = edu.getDegree();
                    if (edu.getField() != null && !edu.getField().isEmpty()) {
                        degreeText += " in " + edu.getField();
                    }
                    Paragraph degree = new Paragraph(degreeText, boldFont);
                    document.add(degree);
                    document.add(new Paragraph(edu.getInstitution(), normalFont));
                    
                    String endDate = (edu.getEndDate() != null && !edu.getEndDate().isEmpty()) ? edu.getEndDate() : "Present";
                    String dates = edu.getStartDate() + " - " + endDate;
                    if (edu.getGpa() != null && !edu.getGpa().isEmpty()) {
                        dates += "  |  GPA: " + edu.getGpa();
                    }
                    document.add(new Paragraph(dates, smallFont));
                    document.add(Chunk.NEWLINE);
                }
            }

            // Skills
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                addModernSection(document, "SKILLS", headingFont, primaryColor);
                String skillsText = String.join("  \u2022  ", resume.getSkills().stream()
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .map(String::trim)
                        .toList());
                Paragraph skills = new Paragraph(skillsText, normalFont);
                skills.setSpacingAfter(8);
                document.add(skills);
            }

            // Projects
            if (resume.getProjects() != null && !resume.getProjects().isEmpty()) {
                addModernSection(document, "PROJECTS", headingFont, primaryColor);
                for (ResumeDTO.Project proj : resume.getProjects()) {
                    Paragraph projName = new Paragraph(proj.getName(), boldFont);
                    document.add(projName);
                    
                    if (proj.getDescription() != null && !proj.getDescription().isEmpty()) {
                        document.add(new Paragraph(proj.getDescription(), normalFont));
                    }
                    
                    if (proj.getTechnologies() != null && !proj.getTechnologies().isEmpty()) {
                        String techText = "Technologies: " + String.join(", ", proj.getTechnologies());
                        document.add(new Paragraph(techText, smallFont));
                    }
                    
                    if (proj.getUrl() != null && !proj.getUrl().isEmpty()) {
                        document.add(new Paragraph(proj.getUrl(), smallFont));
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            // Certifications
            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                addModernSection(document, "CERTIFICATIONS", headingFont, primaryColor);
                com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
                list.setListSymbol(new Chunk("\u2022 ", normalFont));
                list.setIndentationLeft(10);
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

    private byte[] generateClassicTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.TIMES_ROMAN, 22, Font.BOLD, Color.BLACK);
            Font headingFont = new Font(Font.TIMES_ROMAN, 12, Font.BOLD, Color.BLACK);
            Font normalFont = new Font(Font.TIMES_ROMAN, 11, Font.NORMAL, Color.BLACK);
            Font smallFont = new Font(Font.TIMES_ROMAN, 10, Font.ITALIC, Color.DARK_GRAY);
            Font boldFont = new Font(Font.TIMES_ROMAN, 11, Font.BOLD, Color.BLACK);

            // Header
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            name.setAlignment(Element.ALIGN_CENTER);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null && !resume.getEmail().isEmpty()) 
                contact.append(resume.getEmail());
            if (resume.getPhone() != null && !resume.getPhone().isEmpty()) {
                if (contact.length() > 0) contact.append("  |  ");
                contact.append(resume.getPhone());
            }
            if (resume.getLocation() != null && !resume.getLocation().isEmpty()) {
                if (contact.length() > 0) contact.append("  |  ");
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

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addClassicSection(document, "Professional Experience", headingFont);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    document.add(new Paragraph(exp.getCompany() + " - " + exp.getPosition(), boldFont));
                    String endDate = (exp.getEndDate() != null && !exp.getEndDate().isEmpty()) ? exp.getEndDate() : "Present";
                    document.add(new Paragraph(exp.getStartDate() + " - " + endDate, smallFont));
                    
                    if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                        for (String h : exp.getHighlights()) {
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("\u2022 " + h.trim(), normalFont));
                            }
                        }
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addClassicSection(document, "Education", headingFont);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    document.add(new Paragraph(edu.getInstitution(), boldFont));
                    String degreeText = edu.getDegree();
                    if (edu.getField() != null && !edu.getField().isEmpty()) {
                        degreeText += " in " + edu.getField();
                    }
                    degreeText += " (" + edu.getStartDate() + " - " + edu.getEndDate() + ")";
                    document.add(new Paragraph(degreeText, normalFont));
                    document.add(Chunk.NEWLINE);
                }
            }

            // Skills
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                addClassicSection(document, "Skills", headingFont);
                String skillsText = String.join(", ", resume.getSkills().stream()
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .map(String::trim)
                        .toList());
                document.add(new Paragraph(skillsText, normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }

        return out.toByteArray();
    }

    private byte[] generateMinimalTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 60, 60, 50, 50);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Color grayColor = new Color(100, 100, 100);
            Font titleFont = new Font(Font.HELVETICA, 18, Font.NORMAL, Color.BLACK);
            Font headingFont = new Font(Font.HELVETICA, 9, Font.BOLD, grayColor);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.BLACK);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL, grayColor);
            Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK);

            // Simple header
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null && !resume.getEmail().isEmpty()) 
                contact.append(resume.getEmail());
            if (resume.getPhone() != null && !resume.getPhone().isEmpty()) {
                if (contact.length() > 0) contact.append(" / ");
                contact.append(resume.getPhone());
            }
            if (resume.getLocation() != null && !resume.getLocation().isEmpty()) {
                if (contact.length() > 0) contact.append(" / ");
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

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                Paragraph expHeading = new Paragraph("EXPERIENCE", headingFont);
                expHeading.setSpacingBefore(8);
                expHeading.setSpacingAfter(8);
                document.add(expHeading);
                
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    document.add(new Paragraph(exp.getPosition(), boldFont));
                    String endDate = (exp.getEndDate() != null && !exp.getEndDate().isEmpty()) ? exp.getEndDate() : "Present";
                    document.add(new Paragraph(exp.getCompany() + " | " + exp.getStartDate() + " - " + endDate, smallFont));
                    
                    if (exp.getHighlights() != null && !exp.getHighlights().isEmpty()) {
                        for (String h : exp.getHighlights()) {
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("- " + h.trim(), normalFont));
                            }
                        }
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            // Education
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                Paragraph eduHeading = new Paragraph("EDUCATION", headingFont);
                eduHeading.setSpacingBefore(8);
                eduHeading.setSpacingAfter(8);
                document.add(eduHeading);
                
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    String degreeText = edu.getDegree();
                    if (edu.getField() != null && !edu.getField().isEmpty()) {
                        degreeText += " in " + edu.getField();
                    }
                    document.add(new Paragraph(degreeText, boldFont));
                    document.add(new Paragraph(edu.getInstitution() + " | " + edu.getStartDate() + " - " + edu.getEndDate(), smallFont));
                    document.add(Chunk.NEWLINE);
                }
            }

            // Skills
            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                Paragraph skillsHeading = new Paragraph("SKILLS", headingFont);
                skillsHeading.setSpacingBefore(8);
                skillsHeading.setSpacingAfter(8);
                document.add(skillsHeading);
                
                String skillsText = String.join(" / ", resume.getSkills().stream()
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .map(String::trim)
                        .toList());
                document.add(new Paragraph(skillsText, normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }

        return out.toByteArray();
    }

    private void addModernSection(Document document, String title, Font font, Color lineColor) throws DocumentException {
        Paragraph section = new Paragraph(title, font);
        section.setSpacingBefore(8);
        section.setSpacingAfter(2);
        document.add(section);
        
        // Add a proper line separator
        LineSeparator line = new LineSeparator(0.5f, 100, lineColor, Element.ALIGN_LEFT, -2);
        document.add(new Chunk(line));
        document.add(Chunk.NEWLINE);
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

    // Executive Template - Corporate style with dark header
    private byte[] generateExecutiveTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Color slateColor = new Color(51, 65, 85);
            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, Color.WHITE);
            Font headingFont = new Font(Font.HELVETICA, 11, Font.BOLD, slateColor);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);

            // Header section
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            name.setSpacingAfter(5);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null) contact.append(resume.getEmail()).append("  |  ");
            if (resume.getPhone() != null) contact.append(resume.getPhone()).append("  |  ");
            if (resume.getLocation() != null) contact.append(resume.getLocation());

            Font contactFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);
            Paragraph contactPara = new Paragraph(contact.toString().replaceAll("  \\|  $", ""), contactFont);
            document.add(contactPara);

            document.add(Chunk.NEWLINE);
            addClassicLine(document, slateColor);

            // Summary
            if (resume.getSummary() != null && !resume.getSummary().isEmpty()) {
                Paragraph summary = new Paragraph(resume.getSummary(), normalFont);
                summary.setSpacingAfter(10);
                document.add(summary);
            }

            // Experience
            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addModernSection(document, "PROFESSIONAL EXPERIENCE", headingFont, slateColor);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, slateColor);
                    document.add(new Paragraph(exp.getPosition() + " | " + exp.getCompany(), boldFont));
                    document.add(new Paragraph(exp.getStartDate() + " - " + (exp.getEndDate() != null ? exp.getEndDate() : "Present"), smallFont));
                    if (exp.getHighlights() != null) {
                        for (String h : exp.getHighlights()) {
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("  ▸ " + h.trim(), normalFont));
                            }
                        }
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            // Education & Skills in columns would be complex, so keeping simple
            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addModernSection(document, "EDUCATION", headingFont, slateColor);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, slateColor);
                    document.add(new Paragraph(edu.getDegree() + " in " + edu.getField(), boldFont));
                    document.add(new Paragraph(edu.getInstitution() + " | " + edu.getEndDate(), smallFont));
                    document.add(Chunk.NEWLINE);
                }
            }

            if (resume.getSkills() != null && !resume.getSkills().isEmpty()) {
                addModernSection(document, "CORE COMPETENCIES", headingFont, slateColor);
                document.add(new Paragraph(String.join("  •  ", resume.getSkills()), normalFont));
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    // Creative Template - Colorful header
    private byte[] generateCreativeTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Color purpleColor = new Color(147, 51, 234);
            Font titleFont = new Font(Font.HELVETICA, 24, Font.BOLD, purpleColor);
            Font headingFont = new Font(Font.HELVETICA, 12, Font.BOLD, purpleColor);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);

            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null) contact.append(resume.getEmail());
            if (resume.getPhone() != null) contact.append(" • ").append(resume.getPhone());
            if (resume.getLocation() != null) contact.append(" • ").append(resume.getLocation());

            Paragraph contactPara = new Paragraph(contact.toString(), smallFont);
            contactPara.setSpacingAfter(15);
            document.add(contactPara);

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

            if (resume.getExperience() != null && !resume.getExperience().isEmpty()) {
                addModernSection(document, "Experience", headingFont, purpleColor);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);
                    document.add(new Paragraph(exp.getPosition(), boldFont));
                    Font companyFont = new Font(Font.HELVETICA, 9, Font.NORMAL, purpleColor);
                    document.add(new Paragraph(exp.getCompany() + " | " + exp.getStartDate() + " - " + (exp.getEndDate() != null ? exp.getEndDate() : "Present"), companyFont));
                    if (exp.getHighlights() != null) {
                        for (String h : exp.getHighlights()) {
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("• " + h.trim(), normalFont));
                            }
                        }
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                addModernSection(document, "Education", headingFont, purpleColor);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);
                    document.add(new Paragraph(edu.getDegree() + " in " + edu.getField(), boldFont));
                    document.add(new Paragraph(edu.getInstitution() + " • " + edu.getEndDate(), smallFont));
                }
            }

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
        return out.toByteArray();
    }

    // ATS Template - Simple, parseable format
    private byte[] generateAtsTemplate(ResumeDTO resume) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD, Color.BLACK);
            Font headingFont = new Font(Font.HELVETICA, 11, Font.BOLD, Color.BLACK);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.BLACK);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);

            // Simple header
            Paragraph name = new Paragraph(resume.getFullName(), titleFont);
            document.add(name);

            StringBuilder contact = new StringBuilder();
            if (resume.getEmail() != null) contact.append(resume.getEmail());
            if (resume.getPhone() != null) contact.append(" | ").append(resume.getPhone());
            if (resume.getLocation() != null) contact.append(" | ").append(resume.getLocation());
            document.add(new Paragraph(contact.toString(), smallFont));

            if (resume.getLinkedIn() != null || resume.getGithub() != null) {
                StringBuilder links = new StringBuilder();
                if (resume.getLinkedIn() != null) links.append(resume.getLinkedIn());
                if (resume.getGithub() != null) links.append(" | ").append(resume.getGithub());
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
                document.add(Chunk.NEWLINE);
                for (ResumeDTO.Experience exp : resume.getExperience()) {
                    Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK);
                    document.add(new Paragraph(exp.getPosition(), boldFont));
                    document.add(new Paragraph(exp.getCompany() + " | " + exp.getStartDate() + " - " + (exp.getEndDate() != null ? exp.getEndDate() : "Present"), normalFont));
                    if (exp.getHighlights() != null) {
                        for (String h : exp.getHighlights()) {
                            if (h != null && !h.trim().isEmpty()) {
                                document.add(new Paragraph("• " + h.trim(), normalFont));
                            }
                        }
                    }
                    document.add(Chunk.NEWLINE);
                }
            }

            if (resume.getEducation() != null && !resume.getEducation().isEmpty()) {
                document.add(new Paragraph("EDUCATION", headingFont));
                document.add(Chunk.NEWLINE);
                for (ResumeDTO.Education edu : resume.getEducation()) {
                    Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK);
                    document.add(new Paragraph(edu.getDegree() + " in " + edu.getField(), boldFont));
                    document.add(new Paragraph(edu.getInstitution() + " | " + edu.getStartDate() + " - " + edu.getEndDate(), normalFont));
                    if (edu.getGpa() != null) document.add(new Paragraph("GPA: " + edu.getGpa(), smallFont));
                    document.add(Chunk.NEWLINE);
                }
            }

            if (resume.getCertifications() != null && !resume.getCertifications().isEmpty()) {
                document.add(new Paragraph("CERTIFICATIONS", headingFont));
                document.add(new Paragraph(String.join(", ", resume.getCertifications()), normalFont));
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
            if (resume.getLocation() != null) contact.append(resume.getLocation());
            if (resume.getPhone() != null) contact.append(" • ").append(resume.getPhone());
            if (resume.getEmail() != null) contact.append(" • ").append(resume.getEmail());

            Paragraph contactPara = new Paragraph(contact.toString(), smallFont);
            contactPara.setAlignment(Element.ALIGN_CENTER);
            document.add(contactPara);

            if (resume.getLinkedIn() != null || resume.getGithub() != null) {
                StringBuilder links = new StringBuilder();
                if (resume.getLinkedIn() != null) links.append(resume.getLinkedIn());
                if (resume.getGithub() != null) links.append(" • ").append(resume.getGithub());
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
                    title.add(new Chunk("  " + exp.getStartDate() + " - " + (exp.getEndDate() != null ? exp.getEndDate() : "Present"), smallFont));
                    document.add(title);
                    document.add(new Paragraph(exp.getCompany(), new Font(Font.TIMES_ROMAN, 10, Font.ITALIC, Color.DARK_GRAY)));
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
            if (resume.getEmail() != null) contact.append(resume.getEmail());
            if (resume.getPhone() != null) contact.append(" | ").append(resume.getPhone());
            if (resume.getLocation() != null) contact.append(" | ").append(resume.getLocation());
            document.add(new Paragraph(contact.toString(), smallFont));

            if (resume.getLinkedIn() != null || resume.getGithub() != null) {
                StringBuilder links = new StringBuilder();
                if (resume.getLinkedIn() != null) links.append(resume.getLinkedIn());
                if (resume.getGithub() != null) links.append(" | ").append(resume.getGithub());
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
                    if ((i + 1) % 3 == 0) skillsText.append("\n");
                    else skillsText.append("    ");
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
                    document.add(new Paragraph(exp.getCompany() + "  |  " + exp.getStartDate() + " – " + (exp.getEndDate() != null ? exp.getEndDate() : "Present"), smallFont));
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
                    if (edu.getGpa() != null) eduDetails += " | GPA: " + edu.getGpa();
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
            if (resume.getEmail() != null) allContact.append(resume.getEmail());
            if (resume.getPhone() != null) allContact.append(" | ").append(resume.getPhone());
            if (resume.getLocation() != null) allContact.append(" | ").append(resume.getLocation());
            if (resume.getLinkedIn() != null) allContact.append(" | ").append(resume.getLinkedIn());
            if (resume.getGithub() != null) allContact.append(" | ").append(resume.getGithub());

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
                    expLine.add(new Chunk("  " + exp.getStartDate() + "-" + (exp.getEndDate() != null ? exp.getEndDate() : "Present"), smallFont));
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
                    eduLine.add(new Chunk(edu.getDegree() + " in " + edu.getField() + ", " + edu.getInstitution(), boldFont));
                    String details = "  " + edu.getEndDate();
                    if (edu.getGpa() != null) details += " (GPA: " + edu.getGpa() + ")";
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
}
