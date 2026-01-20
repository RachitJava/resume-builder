package com.resumebuilder.config;

import com.resumebuilder.entity.AiProviderConfig;
import com.resumebuilder.entity.QuestionBank;
import com.resumebuilder.entity.Template;
import com.resumebuilder.entity.User;
import com.resumebuilder.repository.AiProviderConfigRepository;
import com.resumebuilder.repository.ApiKeyRepository;
import com.resumebuilder.repository.QuestionBankRepository;
import com.resumebuilder.repository.TemplateRepository;
import com.resumebuilder.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final TemplateRepository templateRepository;
    private final AiProviderConfigRepository aiProviderConfigRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final QuestionBankRepository questionBankRepository;
    private final UserRepository userRepository;

    public DatabaseInitializer(JdbcTemplate jdbcTemplate, TemplateRepository templateRepository,
            AiProviderConfigRepository aiProviderConfigRepository, ApiKeyRepository apiKeyRepository,
            QuestionBankRepository questionBankRepository, UserRepository userRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.templateRepository = templateRepository;
        this.aiProviderConfigRepository = aiProviderConfigRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.questionBankRepository = questionBankRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking database schema...");
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE");
            log.info("Successfully checked/updated users table with is_admin column.");
        } catch (Exception e) {
            log.error("Error updating database schema: " + e.getMessage());
        }

        initializeTemplates();
        initializeAiConfig();
        initializeGeneralKeys();
        initializeAdminUsers();
        initializeQuestionBanks();
    }

    @org.springframework.beans.factory.annotation.Value("${app.admin.emails:rachitbishnoi28@gmail.com,rachitbishnoi16@gmail.com}")
    private String adminEmailsStr;

    private void initializeAdminUsers() {
        if (adminEmailsStr != null && !adminEmailsStr.isEmpty()) {
            String[] emails = adminEmailsStr.split(",");
            for (String email : emails) {
                String cleanEmail = email.trim();
                jdbcTemplate.update("UPDATE users SET is_admin = TRUE WHERE email = ?", cleanEmail);
                log.info("Ensured admin access for: {}", cleanEmail);
            }
        }
    }

    private void initializeQuestionBanks() {
        if (questionBankRepository.count() == 0) {
            log.info("Seeding default Question Bank...");
            if (adminEmailsStr == null || adminEmailsStr.isEmpty())
                return;

            String mainAdminEmail = adminEmailsStr.split(",")[0].trim();
            Optional<User> adminUser = userRepository.findByEmail(mainAdminEmail);

            if (adminUser.isPresent()) {
                QuestionBank bank = new QuestionBank();
                bank.setName("Java Interview Questions");
                bank.setCategory("Technical");
                bank.setDescription("Default seeded question bank (System)");
                bank.setUser(adminUser.get());
                bank.setActive(true);
                bank.setQuestions(
                        "[{\"question\": \"What is the difference between JDK, JRE, and JVM?\", \"answer\": \"JDK is for development, JRE is for running, JVM executes the bytecode.\", \"difficulty\": \"medium\", \"tags\": [\"java\", \"basics\"], \"topic\": \"Java Fundamentals\"}, {\"question\": \"What is Polymorphism?\", \"answer\": \"Polymorphism is the ability of an object to take on many forms.\", \"difficulty\": \"medium\", \"tags\": [\"oop\", \"java\"], \"topic\": \"OOP\"}]");
                questionBankRepository.save(bank);
                log.info("Seeded 'Java Interview Questions' bank for {}", mainAdminEmail);
            } else {
                log.warn("Could not seed Question Bank: Admin user {} not found", mainAdminEmail);
            }
        }
    }

    private void initializeTemplates() {
        log.info("Ensuring default templates exist...");
        if (templateRepository.count() == 0) {
            List<Template> defaults = List.of(
                    new Template("modern-us", "Modern US", "usa",
                            "Clean, ATS-friendly format popular in USA tech companies", "modern", null),
                    new Template("classic-us", "Classic US", "usa",
                            "Traditional chronological format for corporate USA roles", "classic", null),
                    new Template("minimal-us", "Minimal US", "usa", "Ultra-clean design for creative US positions",
                            "minimal", null),
                    new Template("modern-india", "Modern India", "india", "Contemporary format for Indian IT sector",
                            "modern", null),
                    new Template("detailed-india", "Detailed India", "india", "Comprehensive format with all sections",
                            "classic", null),
                    // New Templates
                    new Template("modern-uk", "Modern UK", "uk", "Clean CV format preferred in United Kingdom",
                            "modern",
                            null),
                    new Template("professional-uk", "Professional UK", "uk", "Standard UK corporate CV layout",
                            "classic",
                            null),
                    new Template("eu-standard", "Europass Style", "europe",
                            "Standard format complying with EU guidelines",
                            "classic", null),
                    new Template("modern-eu", "Modern Europe", "europe", "Contemporary European design", "modern",
                            null),
                    new Template("modern-au", "Modern Australia", "australia", "Standard Australian resume format",
                            "modern", null));
            templateRepository.saveAll(defaults);
        }
    }

    private void initializeAiConfig() {
        // Aggressively remove any Gemini-related configurations
        List<AiProviderConfig> allConfigs = aiProviderConfigRepository.findAll();
        for (AiProviderConfig config : allConfigs) {
            String name = config.getProviderName().toLowerCase();
            if (name.contains("gemini") || name.contains("browser")) {
                log.info("Removing unauthorized AI configuration: {}", config.getProviderName());
                aiProviderConfigRepository.delete(config);
            }
        }

        // Ensure Groq is present and active in Strategy configs
        Optional<AiProviderConfig> groqOpt = aiProviderConfigRepository.findByProviderName("groq");
        if (groqOpt.isEmpty()) {
            log.info("Initializing default Groq AI Strategy...");
            AiProviderConfig groq = new AiProviderConfig();
            groq.setProviderName("groq");
            groq.setApiUrl("https://api.groq.com/openai/v1/chat/completions");
            groq.setModelName("llama-3.3-70b-versatile");
            groq.setActive(true);

            // Use environment variable or valid placeholder
            String initialKey = System.getenv("GROQ_API_KEY");
            if (initialKey == null || initialKey.isEmpty()) {
                initialKey = "gsk_placeholder_key_must_be_replaced";
            }
            groq.setApiKeys(new java.util.ArrayList<>(List.of(initialKey)));

            aiProviderConfigRepository.save(groq);
        } else {
            AiProviderConfig groq = groqOpt.get();
            if (!groq.isActive()) {
                groq.setActive(true);
                aiProviderConfigRepository.save(groq);
            }
        }
    }

    private void initializeGeneralKeys() {
        // Initialize Groq Key in api_keys table
        if (apiKeyRepository.findByProviderAndActiveOrderByPriorityAsc("groq", true).isEmpty()) {
            log.info("Initializing Groq API key in database...");
            com.resumebuilder.entity.ApiKey groqKey = new com.resumebuilder.entity.ApiKey();
            groqKey.setName("Default Groq Key");
            groqKey.setProvider("groq");

            String envKey = System.getenv("GROQ_API_KEY");
            groqKey.setApiKey(envKey != null ? envKey : "gsk_placeholder_key");

            groqKey.setActive(true);
            apiKeyRepository.save(groqKey);
        }

        // Initialize Mail Key in api_keys table
        if (apiKeyRepository.findByProviderAndActiveOrderByPriorityAsc("mail", true).isEmpty()) {
            log.info("Initializing Mail API key in database...");
            com.resumebuilder.entity.ApiKey mailKey = new com.resumebuilder.entity.ApiKey();
            mailKey.setName("Default Mail Key");
            mailKey.setProvider("mail");

            String envMail = System.getenv("MAIL_PASSWORD");
            mailKey.setApiKey(envMail != null ? envMail : "mail_password_placeholder");

            mailKey.setActive(true);
            apiKeyRepository.save(mailKey);
        }
    }
}
