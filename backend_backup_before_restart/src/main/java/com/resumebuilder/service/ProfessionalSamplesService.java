package com.resumebuilder.service;

import com.resumebuilder.dto.ResumeDTO;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ProfessionalSamplesService {

    public List<Map<String, Object>> getAllProfessionalSamples() {
        return List.of(
            createSampleEntry("software-engineer", "Software Engineer", "Tech & Development", "💻"),
            createSampleEntry("data-scientist", "Data Scientist", "Data & Analytics", "📊"),
            createSampleEntry("product-manager", "Product Manager", "Product & Strategy", "🎯"),
            createSampleEntry("ux-designer", "UX Designer", "Design & Creative", "🎨"),
            createSampleEntry("marketing-manager", "Marketing Manager", "Marketing & Sales", "📈"),
            createSampleEntry("financial-analyst", "Financial Analyst", "Finance & Banking", "💰"),
            createSampleEntry("hr-manager", "HR Manager", "Human Resources", "👥"),
            createSampleEntry("project-manager", "Project Manager", "Management", "📋"),
            createSampleEntry("devops-engineer", "DevOps Engineer", "Tech & Infrastructure", "⚙️"),
            createSampleEntry("business-analyst", "Business Analyst", "Business & Strategy", "📑")
        );
    }

    private Map<String, Object> createSampleEntry(String id, String title, String category, String icon) {
        Map<String, Object> entry = new HashMap<>();
        entry.put("id", id);
        entry.put("title", title);
        entry.put("category", category);
        entry.put("icon", icon);
        return entry;
    }

    public ResumeDTO getSampleByProfession(String professionId) {
        return switch (professionId) {
            case "software-engineer" -> getSoftwareEngineerSample();
            case "data-scientist" -> getDataScientistSample();
            case "product-manager" -> getProductManagerSample();
            case "ux-designer" -> getUxDesignerSample();
            case "marketing-manager" -> getMarketingManagerSample();
            case "financial-analyst" -> getFinancialAnalystSample();
            case "hr-manager" -> getHrManagerSample();
            case "project-manager" -> getProjectManagerSample();
            case "devops-engineer" -> getDevOpsEngineerSample();
            case "business-analyst" -> getBusinessAnalystSample();
            default -> getSoftwareEngineerSample();
        };
    }

    private ResumeDTO getSoftwareEngineerSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Alex Chen");
        resume.setEmail("alex.chen@email.com");
        resume.setPhone("+1 (555) 123-4567");
        resume.setLocation("San Francisco, CA");
        resume.setLinkedIn("linkedin.com/in/alexchen");
        resume.setGithub("github.com/alexchen");
        resume.setSummary("Senior Software Engineer with 6+ years of experience building scalable web applications and distributed systems. Expertise in Java, Python, and cloud technologies. Passionate about clean code, system design, and mentoring junior developers.");
        resume.setTemplate("modern");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Google");
        exp1.setPosition("Senior Software Engineer");
        exp1.setStartDate("Jan 2022");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Led development of microservices architecture serving 10M+ daily active users",
            "Reduced API latency by 40% through optimization and caching strategies",
            "Mentored team of 4 junior engineers, conducting code reviews and pair programming",
            "Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes"
        ));
        experiences.add(exp1);

        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
        exp2.setCompany("Amazon");
        exp2.setPosition("Software Engineer");
        exp2.setStartDate("Jun 2019");
        exp2.setEndDate("Dec 2021");
        exp2.setHighlights(List.of(
            "Built real-time inventory management system handling 50K transactions/second",
            "Designed and implemented RESTful APIs consumed by 20+ internal services",
            "Improved system reliability from 99.5% to 99.99% uptime"
        ));
        experiences.add(exp2);
        resume.setExperience(experiences);

        List<ResumeDTO.Education> education = new ArrayList<>();
        ResumeDTO.Education edu = new ResumeDTO.Education();
        edu.setInstitution("Stanford University");
        edu.setDegree("Master of Science");
        edu.setField("Computer Science");
        edu.setStartDate("2017");
        edu.setEndDate("2019");
        edu.setGpa("3.9");
        education.add(edu);
        resume.setEducation(education);

        resume.setSkills(List.of("Java", "Python", "Go", "Kubernetes", "AWS", "Docker", "PostgreSQL", "Redis", "Kafka", "React", "System Design", "Microservices"));
        resume.setCertifications(List.of("AWS Solutions Architect Professional", "Google Cloud Professional Developer"));

        List<ResumeDTO.Project> projects = new ArrayList<>();
        ResumeDTO.Project proj = new ResumeDTO.Project();
        proj.setName("Distributed Task Scheduler");
        proj.setDescription("Open-source distributed task scheduling system with 2K+ GitHub stars");
        proj.setTechnologies(List.of("Go", "Redis", "gRPC", "Kubernetes"));
        projects.add(proj);
        resume.setProjects(projects);

        return resume;
    }

    private ResumeDTO getDataScientistSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Dr. Sarah Johnson");
        resume.setEmail("sarah.johnson@email.com");
        resume.setPhone("+1 (555) 234-5678");
        resume.setLocation("New York, NY");
        resume.setLinkedIn("linkedin.com/in/sarahjohnson");
        resume.setGithub("github.com/sarahj-ds");
        resume.setSummary("Data Scientist with 5+ years of experience in machine learning, statistical modeling, and AI. PhD in Statistics with expertise in NLP, deep learning, and predictive analytics. Proven track record of delivering data-driven solutions that generate $10M+ in business value.");
        resume.setTemplate("modern");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Meta");
        exp1.setPosition("Senior Data Scientist");
        exp1.setStartDate("Mar 2021");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Developed recommendation algorithm improving user engagement by 25%",
            "Built NLP models for content moderation processing 1B+ posts daily",
            "Led A/B testing framework used by 50+ teams across the organization",
            "Published 3 papers in top-tier ML conferences (NeurIPS, ICML)"
        ));
        experiences.add(exp1);

        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
        exp2.setCompany("Netflix");
        exp2.setPosition("Data Scientist");
        exp2.setStartDate("Aug 2019");
        exp2.setEndDate("Feb 2021");
        exp2.setHighlights(List.of(
            "Created personalization models increasing watch time by 15%",
            "Designed experimentation platform for 200M+ subscriber base",
            "Reduced customer churn by 8% through predictive modeling"
        ));
        experiences.add(exp2);
        resume.setExperience(experiences);

        List<ResumeDTO.Education> education = new ArrayList<>();
        ResumeDTO.Education edu = new ResumeDTO.Education();
        edu.setInstitution("MIT");
        edu.setDegree("Ph.D.");
        edu.setField("Statistics");
        edu.setStartDate("2015");
        edu.setEndDate("2019");
        education.add(edu);
        resume.setEducation(education);

        resume.setSkills(List.of("Python", "TensorFlow", "PyTorch", "SQL", "Spark", "R", "Deep Learning", "NLP", "Computer Vision", "A/B Testing", "Statistical Modeling", "MLOps"));
        resume.setCertifications(List.of("Google Professional ML Engineer", "AWS Machine Learning Specialty"));

        return resume;
    }

    private ResumeDTO getProductManagerSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Michael Roberts");
        resume.setEmail("michael.roberts@email.com");
        resume.setPhone("+1 (555) 345-6789");
        resume.setLocation("Seattle, WA");
        resume.setLinkedIn("linkedin.com/in/michaelroberts");
        resume.setSummary("Product Manager with 7+ years of experience driving product strategy and execution at scale. Led products from 0 to $50M ARR. Expert in B2B SaaS, platform products, and data-driven decision making. Strong technical background with MBA from Wharton.");
        resume.setTemplate("executive");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Microsoft");
        exp1.setPosition("Senior Product Manager");
        exp1.setStartDate("Feb 2021");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Launched Azure DevOps feature used by 500K+ developers globally",
            "Grew product revenue from $20M to $50M ARR in 18 months",
            "Managed roadmap and backlog for team of 25 engineers",
            "Conducted 100+ customer interviews to inform product strategy"
        ));
        experiences.add(exp1);

        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
        exp2.setCompany("Salesforce");
        exp2.setPosition("Product Manager");
        exp2.setStartDate("Jun 2018");
        exp2.setEndDate("Jan 2021");
        exp2.setHighlights(List.of(
            "Owned end-to-end product lifecycle for CRM analytics module",
            "Increased NPS from 32 to 58 through user experience improvements",
            "Defined and tracked KPIs resulting in 40% improvement in user retention"
        ));
        experiences.add(exp2);
        resume.setExperience(experiences);

        List<ResumeDTO.Education> education = new ArrayList<>();
        ResumeDTO.Education edu = new ResumeDTO.Education();
        edu.setInstitution("Wharton School, UPenn");
        edu.setDegree("MBA");
        edu.setField("Technology Management");
        edu.setStartDate("2016");
        edu.setEndDate("2018");
        education.add(edu);
        resume.setEducation(education);

        resume.setSkills(List.of("Product Strategy", "Roadmap Planning", "Agile/Scrum", "User Research", "A/B Testing", "SQL", "JIRA", "Figma", "Data Analysis", "Stakeholder Management", "Go-to-Market"));
        resume.setCertifications(List.of("Certified Scrum Product Owner (CSPO)", "Pragmatic Marketing Certified"));

        return resume;
    }

    private ResumeDTO getUxDesignerSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Emily Zhang");
        resume.setEmail("emily.zhang@email.com");
        resume.setPhone("+1 (555) 456-7890");
        resume.setLocation("Austin, TX");
        resume.setLinkedIn("linkedin.com/in/emilyzhang");
        resume.setWebsite("emilyzhang.design");
        resume.setSummary("UX Designer with 5+ years crafting intuitive digital experiences for Fortune 500 companies. Expertise in user research, interaction design, and design systems. Passionate about accessible design and creating products that delight users.");
        resume.setTemplate("creative");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Apple");
        exp1.setPosition("Senior UX Designer");
        exp1.setStartDate("Apr 2021");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Led redesign of Apple Music playlist experience for 100M+ users",
            "Created and maintained design system used by 200+ designers",
            "Conducted usability studies with 500+ participants across 8 countries",
            "Increased task completion rate by 35% through UX improvements"
        ));
        experiences.add(exp1);

        ResumeDTO.Experience exp2 = new ResumeDTO.Experience();
        exp2.setCompany("Airbnb");
        exp2.setPosition("UX Designer");
        exp2.setStartDate("Aug 2019");
        exp2.setEndDate("Mar 2021");
        exp2.setHighlights(List.of(
            "Designed booking flow improvements increasing conversion by 22%",
            "Built accessibility guidelines achieving WCAG 2.1 AA compliance",
            "Mentored 3 junior designers in user research methodologies"
        ));
        experiences.add(exp2);
        resume.setExperience(experiences);

        List<ResumeDTO.Education> education = new ArrayList<>();
        ResumeDTO.Education edu = new ResumeDTO.Education();
        edu.setInstitution("Rhode Island School of Design");
        edu.setDegree("BFA");
        edu.setField("Graphic Design");
        edu.setStartDate("2015");
        edu.setEndDate("2019");
        education.add(edu);
        resume.setEducation(education);

        resume.setSkills(List.of("Figma", "Sketch", "Adobe XD", "Prototyping", "User Research", "Usability Testing", "Design Systems", "Wireframing", "Information Architecture", "Accessibility", "HTML/CSS"));
        resume.setCertifications(List.of("Google UX Design Certificate", "Nielsen Norman Group UX Certification"));

        return resume;
    }

    private ResumeDTO getMarketingManagerSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Jennifer Williams");
        resume.setEmail("jennifer.williams@email.com");
        resume.setPhone("+1 (555) 567-8901");
        resume.setLocation("Chicago, IL");
        resume.setLinkedIn("linkedin.com/in/jenniferwilliams");
        resume.setSummary("Marketing Manager with 8+ years of experience driving growth for B2B and B2C brands. Expertise in digital marketing, brand strategy, and marketing automation. Generated $25M+ in pipeline through integrated marketing campaigns.");
        resume.setTemplate("executive");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("HubSpot");
        exp1.setPosition("Senior Marketing Manager");
        exp1.setStartDate("May 2020");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Managed $5M annual marketing budget across digital and offline channels",
            "Launched campaign generating 10K+ qualified leads in first quarter",
            "Increased organic traffic by 150% through SEO and content strategy",
            "Built marketing team from 3 to 12 members"
        ));
        experiences.add(exp1);
        resume.setExperience(experiences);

        resume.setSkills(List.of("Digital Marketing", "SEO/SEM", "Marketing Automation", "Content Strategy", "Brand Management", "Google Analytics", "HubSpot", "Salesforce", "Social Media Marketing", "Email Marketing", "Budget Management"));

        return resume;
    }

    private ResumeDTO getFinancialAnalystSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("David Park");
        resume.setEmail("david.park@email.com");
        resume.setPhone("+1 (555) 678-9012");
        resume.setLocation("New York, NY");
        resume.setLinkedIn("linkedin.com/in/davidpark");
        resume.setSummary("Financial Analyst with 5+ years at top investment banks. CFA charterholder with expertise in financial modeling, valuation, and M&A analysis. Track record of supporting $2B+ in successful transactions.");
        resume.setTemplate("classic");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Goldman Sachs");
        exp1.setPosition("Senior Financial Analyst");
        exp1.setStartDate("Jul 2021");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Built financial models for M&A deals totaling $1.5B in transaction value",
            "Conducted due diligence and valuation analysis for 15+ companies",
            "Prepared investment memoranda and board presentations",
            "Mentored 4 junior analysts in financial modeling best practices"
        ));
        experiences.add(exp1);
        resume.setExperience(experiences);

        resume.setSkills(List.of("Financial Modeling", "Valuation", "M&A", "Excel", "Bloomberg", "Capital IQ", "SQL", "Python", "Financial Reporting", "Due Diligence", "DCF Analysis"));
        resume.setCertifications(List.of("CFA Charterholder", "Financial Modeling & Valuation Analyst (FMVA)"));

        return resume;
    }

    private ResumeDTO getHrManagerSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Lisa Thompson");
        resume.setEmail("lisa.thompson@email.com");
        resume.setPhone("+1 (555) 789-0123");
        resume.setLocation("Denver, CO");
        resume.setLinkedIn("linkedin.com/in/lisathompson");
        resume.setSummary("HR Manager with 7+ years of experience in talent acquisition, employee engagement, and HR operations. SHRM-SCP certified with expertise in building high-performing teams and fostering inclusive workplace cultures.");
        resume.setTemplate("classic");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Deloitte");
        exp1.setPosition("HR Manager");
        exp1.setStartDate("Mar 2020");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Managed full-cycle recruitment for 200+ positions annually",
            "Reduced time-to-hire by 30% through process optimization",
            "Implemented HRIS system serving 5,000+ employees",
            "Led DEI initiatives increasing diverse hiring by 40%"
        ));
        experiences.add(exp1);
        resume.setExperience(experiences);

        resume.setSkills(List.of("Talent Acquisition", "Employee Relations", "HRIS", "Performance Management", "Compensation & Benefits", "Workday", "ADP", "Diversity & Inclusion", "Employment Law", "Onboarding", "Training & Development"));
        resume.setCertifications(List.of("SHRM-SCP", "PHR Certified"));

        return resume;
    }

    private ResumeDTO getProjectManagerSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Robert Anderson");
        resume.setEmail("robert.anderson@email.com");
        resume.setPhone("+1 (555) 890-1234");
        resume.setLocation("Boston, MA");
        resume.setLinkedIn("linkedin.com/in/robertanderson");
        resume.setSummary("PMP-certified Project Manager with 10+ years leading cross-functional teams on complex projects. Expertise in Agile and Waterfall methodologies. Successfully delivered $50M+ in projects on time and within budget.");
        resume.setTemplate("executive");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("IBM");
        exp1.setPosition("Senior Project Manager");
        exp1.setStartDate("Jan 2019");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Led digital transformation project with $20M budget and 50+ team members",
            "Delivered 95% of projects on time and 100% within budget",
            "Implemented PMO best practices adopted by 200+ project managers",
            "Managed stakeholder relationships with C-suite executives"
        ));
        experiences.add(exp1);
        resume.setExperience(experiences);

        resume.setSkills(List.of("Project Management", "Agile/Scrum", "Waterfall", "Risk Management", "Stakeholder Management", "MS Project", "JIRA", "Budget Management", "Resource Planning", "PMP", "Six Sigma"));
        resume.setCertifications(List.of("PMP", "Certified Scrum Master (CSM)", "Six Sigma Green Belt"));

        return resume;
    }

    private ResumeDTO getDevOpsEngineerSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Kevin Martinez");
        resume.setEmail("kevin.martinez@email.com");
        resume.setPhone("+1 (555) 901-2345");
        resume.setLocation("Portland, OR");
        resume.setLinkedIn("linkedin.com/in/kevinmartinez");
        resume.setGithub("github.com/kevinm-devops");
        resume.setSummary("DevOps Engineer with 6+ years automating infrastructure and CI/CD pipelines at scale. Expert in Kubernetes, Terraform, and cloud platforms. Reduced deployment frequency from monthly to hourly while maintaining 99.99% uptime.");
        resume.setTemplate("developer");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Spotify");
        exp1.setPosition("Senior DevOps Engineer");
        exp1.setStartDate("Jun 2021");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Managed Kubernetes clusters serving 400M+ monthly active users",
            "Built CI/CD pipelines reducing deployment time from 2 hours to 10 minutes",
            "Implemented infrastructure as code managing 1000+ cloud resources",
            "Reduced cloud costs by 35% through optimization and right-sizing"
        ));
        experiences.add(exp1);
        resume.setExperience(experiences);

        resume.setSkills(List.of("Kubernetes", "Docker", "Terraform", "AWS", "GCP", "Jenkins", "GitLab CI", "Ansible", "Prometheus", "Grafana", "Python", "Bash", "Linux"));
        resume.setCertifications(List.of("CKA (Certified Kubernetes Administrator)", "AWS DevOps Engineer Professional", "HashiCorp Terraform Associate"));

        return resume;
    }

    private ResumeDTO getBusinessAnalystSample() {
        ResumeDTO resume = new ResumeDTO();
        resume.setFullName("Amanda Foster");
        resume.setEmail("amanda.foster@email.com");
        resume.setPhone("+1 (555) 012-3456");
        resume.setLocation("Atlanta, GA");
        resume.setLinkedIn("linkedin.com/in/amandafoster");
        resume.setSummary("Business Analyst with 6+ years translating business requirements into technical solutions. CBAP certified with expertise in process improvement, data analysis, and stakeholder management. Track record of delivering projects that drive operational efficiency.");
        resume.setTemplate("classic");

        List<ResumeDTO.Experience> experiences = new ArrayList<>();
        
        ResumeDTO.Experience exp1 = new ResumeDTO.Experience();
        exp1.setCompany("Accenture");
        exp1.setPosition("Senior Business Analyst");
        exp1.setStartDate("Aug 2020");
        exp1.setEndDate("Present");
        exp1.setHighlights(List.of(
            "Led requirements gathering for $10M ERP implementation",
            "Created process maps reducing operational costs by 25%",
            "Facilitated workshops with 50+ stakeholders across 5 departments",
            "Developed KPI dashboards used by executive leadership"
        ));
        experiences.add(exp1);
        resume.setExperience(experiences);

        resume.setSkills(List.of("Requirements Analysis", "Process Mapping", "SQL", "Tableau", "Power BI", "JIRA", "Agile/Scrum", "User Stories", "UAT", "Stakeholder Management", "Data Analysis"));
        resume.setCertifications(List.of("CBAP (Certified Business Analysis Professional)", "Lean Six Sigma Yellow Belt"));

        return resume;
    }
}

