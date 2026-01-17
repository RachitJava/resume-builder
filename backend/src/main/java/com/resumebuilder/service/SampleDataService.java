package com.resumebuilder.service;

import com.resumebuilder.dto.ResumeDTO;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SampleDataService {

    public List<Map<String, Object>> getTemplates() {
        return List.of(
            createTemplate("modern-us", "Modern US", "usa", "Clean, ATS-friendly format popular in USA tech companies", "modern"),
            createTemplate("classic-us", "Classic US", "usa", "Traditional chronological format for corporate USA roles", "classic"),
            createTemplate("minimal-us", "Minimal US", "usa", "Ultra-clean design for creative US positions", "minimal"),
            createTemplate("modern-aus", "Modern Australia", "australia", "Contemporary format following Australian standards", "modern"),
            createTemplate("gov-aus", "Government Australia", "australia", "Detailed format for Australian public sector", "classic"),
            createTemplate("modern-uk", "Modern UK", "uk", "Professional UK format with personal statement", "modern"),
            createTemplate("academic-uk", "Academic UK", "uk", "CV format for UK academic positions", "classic"),
            createTemplate("modern-india", "Modern India", "india", "Contemporary format for Indian IT sector", "modern"),
            createTemplate("detailed-india", "Detailed India", "india", "Comprehensive format with all sections", "classic"),
            createTemplate("euro-minimal", "EU Minimal", "europe", "Europass-inspired minimal format", "minimal")
        );
    }

    private Map<String, Object> createTemplate(String id, String name, String country, String description, String baseStyle) {
        Map<String, Object> template = new HashMap<>();
        template.put("id", id);
        template.put("name", name);
        template.put("country", country);
        template.put("description", description);
        template.put("baseStyle", baseStyle);
        template.put("sample", getSampleForTemplate(id));
        return template;
    }

    public ResumeDTO getSampleForTemplate(String templateId) {
        return switch (templateId) {
            case "modern-us", "classic-us", "minimal-us" -> getUsSample();
            case "modern-aus", "gov-aus" -> getAustraliaSample();
            case "modern-uk", "academic-uk" -> getUkSample();
            case "modern-india", "detailed-india" -> getIndiaSample();
            default -> getUsSample();
        };
    }

    private ResumeDTO getUsSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Alex Johnson");
        resume.setEmail("alex.johnson@email.com");
        resume.setPhone("+1 (555) 123-4567");
        resume.setLocation("San Francisco, CA");
        resume.setLinkedIn("linkedin.com/in/alexjohnson");
        resume.setGithub("github.com/alexjohnson");
        resume.setWebsite("alexjohnson.dev");
        resume.setSummary("Senior Software Engineer with 8+ years of experience building scalable web applications and leading cross-functional teams. Expertise in React, Node.js, and cloud architecture. Passionate about clean code, mentoring developers, and delivering exceptional user experiences.");
        resume.setTemplate("modern");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Tech Giants Inc.");
        exp1.setPosition("Senior Software Engineer");
        exp1.setStartDate("Jan 2021");
        exp1.setEndDate("Present");
        exp1.setDescription("Lead development of customer-facing applications");
        exp1.setHighlights(List.of(
            "Led a team of 5 engineers to deliver a new product feature that increased user engagement by 40%",
            "Architected and implemented microservices infrastructure reducing deployment time by 60%",
            "Mentored 3 junior developers, resulting in their promotion within 18 months"
        ));
        experiences.add(exp1);

        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
        exp2.setCompany("StartupXYZ");
        exp2.setPosition("Full Stack Developer");
        exp2.setStartDate("Mar 2018");
        exp2.setEndDate("Dec 2020");
        exp2.setHighlights(List.of(
            "Built React-based dashboard serving 100K+ daily active users",
            "Implemented CI/CD pipeline reducing release cycles from 2 weeks to 2 days",
            "Optimized database queries improving API response time by 70%"
        ));
        experiences.add(exp2);
        resume.setExperience(experiences);

        List<ResumeDTO.Education> education = new ArrayList<>();
        ResumeDTO.Education edu = new ResumeDTO.Education();
        edu.setInstitution("Stanford University");
        edu.setDegree("Master of Science");
        edu.setField("Computer Science");
        edu.setStartDate("2014");
        edu.setEndDate("2016");
        edu.setGpa("3.9");
        education.add(edu);
        resume.setEducation(education);

        resume.setSkills(List.of("JavaScript", "TypeScript", "React", "Node.js", "Python", "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "GraphQL", "CI/CD"));
        resume.setCertifications(List.of("AWS Solutions Architect Professional", "Google Cloud Professional Developer"));

        List<ResumeDTO.Project> projects = new ArrayList<>();
        ResumeDTO.Project proj = new ResumeDTO.Project();
        proj.setName("Open Source Analytics Platform");
        proj.setDescription("Created an open-source real-time analytics platform with 2K+ GitHub stars");
        proj.setUrl("github.com/alexjohnson/analytics");
        proj.setTechnologies(List.of("React", "Node.js", "ClickHouse", "Redis"));
        projects.add(proj);
        resume.setProjects(projects);

        return resume;
    }

    private ResumeDTO getAustraliaSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Sarah Mitchell");
        resume.setEmail("sarah.mitchell@email.com.au");
        resume.setPhone("+61 4 1234 5678");
        resume.setLocation("Sydney, NSW 2000");
        resume.setLinkedIn("linkedin.com/in/sarahmitchell");
        resume.setSummary("Accomplished IT Professional with 7 years of experience in enterprise software development. Strong background in Agile methodologies and stakeholder management. Australian citizen with full working rights. Demonstrated ability to deliver complex projects on time and within budget.");
        resume.setTemplate("modern");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Commonwealth Bank of Australia");
        exp1.setPosition("Senior Developer");
        exp1.setStartDate("Feb 2020");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Delivered digital banking transformation project serving 5M+ customers",
            "Led API modernisation initiative reducing integration time by 50%",
            "Collaborated with cross-functional teams across Sydney and Melbourne offices"
        ));
        experiences.add(exp1);

        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
        exp2.setCompany("Atlassian");
        exp2.setPosition("Software Developer");
        exp2.setStartDate("Jul 2017");
        exp2.setEndDate("Jan 2020");
        exp2.setHighlights(List.of(
            "Contributed to Jira Cloud platform used by millions globally",
            "Implemented accessibility features achieving WCAG 2.1 AA compliance",
            "Participated in company hackathons, winning 'Best Innovation' award"
        ));
        experiences.add(exp2);
        resume.setExperience(experiences);

        List<ResumeDTO.Education> education = new ArrayList<>();
        ResumeDTO.Education edu = new ResumeDTO.Education();
        edu.setInstitution("University of Sydney");
        edu.setDegree("Bachelor of Engineering (Honours)");
        edu.setField("Software Engineering");
        edu.setStartDate("2013");
        edu.setEndDate("2017");
        edu.setGpa("Distinction Average");
        education.add(edu);
        resume.setEducation(education);

        resume.setSkills(List.of("Java", "Kotlin", "Spring Boot", "React", "AWS", "Azure", "PostgreSQL", "Agile/Scrum", "Stakeholder Management", "Technical Leadership"));
        resume.setCertifications(List.of("AWS Certified Developer", "Certified Scrum Master (CSM)", "ITIL Foundation"));

        return resume;
    }

    private ResumeDTO getUkSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("James Williams");
        resume.setEmail("james.williams@email.co.uk");
        resume.setPhone("+44 7700 900123");
        resume.setLocation("London, UK");
        resume.setLinkedIn("linkedin.com/in/jameswilliams");
        resume.setSummary("Chartered IT Professional with 6 years of experience in fintech and enterprise solutions. MBCS member with proven track record of delivering secure, scalable applications. Strong communicator adept at translating complex technical concepts for diverse stakeholders.");
        resume.setTemplate("modern");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Barclays");
        exp1.setPosition("Lead Software Engineer");
        exp1.setStartDate("Sept 2021");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Lead a team of 8 engineers delivering mobile banking features to 10M+ users",
            "Implemented PSD2 compliance features ahead of regulatory deadline",
            "Reduced system downtime by 80% through improved monitoring and alerting"
        ));
        experiences.add(exp1);

        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
        exp2.setCompany("Revolut");
        exp2.setPosition("Backend Engineer");
        exp2.setStartDate("Mar 2018");
        exp2.setEndDate("Aug 2021");
        exp2.setHighlights(List.of(
            "Built payment processing system handling £1B+ monthly transactions",
            "Developed fraud detection algorithms reducing fraudulent transactions by 35%",
            "Mentored graduate engineers as part of company's early careers programme"
        ));
        experiences.add(exp2);
        resume.setExperience(experiences);

        List<ResumeDTO.Education> education = new ArrayList<>();
        ResumeDTO.Education edu = new ResumeDTO.Education();
        edu.setInstitution("Imperial College London");
        edu.setDegree("MEng");
        edu.setField("Computing");
        edu.setStartDate("2014");
        edu.setEndDate("2018");
        edu.setGpa("First Class Honours");
        education.add(edu);
        resume.setEducation(education);

        resume.setSkills(List.of("Java", "Kotlin", "Python", "Spring Boot", "Microservices", "AWS", "Kafka", "PostgreSQL", "Kubernetes", "TDD/BDD"));
        resume.setCertifications(List.of("MBCS Chartered IT Professional", "AWS Solutions Architect", "Certified Kubernetes Administrator"));

        return resume;
    }

    private ResumeDTO getIndiaSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Priya Sharma");
        resume.setEmail("priya.sharma@email.com");
        resume.setPhone("+91 98765 43210");
        resume.setLocation("Bangalore, Karnataka");
        resume.setLinkedIn("linkedin.com/in/priyasharma");
        resume.setGithub("github.com/priyasharma");
        resume.setSummary("Dynamic Software Engineer with 5+ years of experience in full-stack development and cloud technologies. Proven expertise in building scalable microservices architecture and leading Agile teams. Strong academic background from premier institution with consistent track record of exceeding performance metrics.");
        resume.setTemplate("modern");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Infosys Ltd.");
        exp1.setPosition("Technology Lead");
        exp1.setStartDate("Apr 2022");
        exp1.setEndDate("Present");
        exp1.setDescription("Leading digital transformation initiatives for Fortune 500 clients");
        exp1.setHighlights(List.of(
            "Spearheaded migration of legacy systems to cloud-native architecture for US banking client",
            "Managed team of 12 developers across Bangalore and Pune delivery centres",
            "Achieved 98% client satisfaction score and secured contract extension worth $2M"
        ));
        experiences.add(exp1);

        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
        exp2.setCompany("Flipkart");
        exp2.setPosition("Senior Software Engineer");
        exp2.setStartDate("Jul 2019");
        exp2.setEndDate("Mar 2022");
        exp2.setHighlights(List.of(
            "Developed high-throughput order processing system handling 10L+ orders during Big Billion Days",
            "Optimised search algorithms improving product discovery by 25%",
            "Received 'Star Performer' award for three consecutive quarters"
        ));
        experiences.add(exp2);
        resume.setExperience(experiences);

        List<ResumeDTO.Education> education = new ArrayList<>();
        ResumeDTO.Education edu = new ResumeDTO.Education();
        edu.setInstitution("Indian Institute of Technology (IIT) Bombay");
        edu.setDegree("Bachelor of Technology");
        edu.setField("Computer Science and Engineering");
        edu.setStartDate("2015");
        edu.setEndDate("2019");
        edu.setGpa("8.5/10 CGPA");
        education.add(edu);
        resume.setEducation(education);

        resume.setSkills(List.of("Java", "Python", "Spring Boot", "React", "Angular", "AWS", "GCP", "Microservices", "Kafka", "MySQL", "MongoDB", "Docker", "Kubernetes"));
        resume.setCertifications(List.of("AWS Certified Solutions Architect", "Google Cloud Professional Data Engineer", "Oracle Certified Java Programmer"));

        List<ResumeDTO.Project> projects = new ArrayList<>();
        ResumeDTO.Project proj = new ResumeDTO.Project();
        proj.setName("E-Commerce Platform");
        proj.setDescription("Built end-to-end e-commerce solution with payment gateway integration");
        proj.setTechnologies(List.of("React", "Node.js", "MongoDB", "Razorpay"));
        projects.add(proj);
        resume.setProjects(projects);

        return resume;
    }

    public Map<String, String> getCountryInfo() {
        Map<String, String> countries = new LinkedHashMap<>();
        countries.put("usa", "United States");
        countries.put("australia", "Australia");
        countries.put("uk", "United Kingdom");
        countries.put("india", "India");
        countries.put("europe", "Europe (EU)");
        return countries;
    }
}

