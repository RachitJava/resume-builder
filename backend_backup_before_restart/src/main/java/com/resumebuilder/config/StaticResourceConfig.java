package com.resumebuilder.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files; // Kept because it's used by Files.exists
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    private String getStaticPath() {
        String staticPath = "/app/static";

        if (!Files.exists(Paths.get(staticPath))) {
            String userDir = System.getProperty("user.dir");
            staticPath = Paths.get(userDir, "../frontend/dist").toAbsolutePath().toString();

            if (!Files.exists(Paths.get(staticPath))) {
                return null;
            }
        }
        return staticPath;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String staticPath = getStaticPath();

        if (staticPath != null) {
            // Serve static assets (js, css, images)
            registry.addResourceHandler("/assets/**")
                    .addResourceLocations("file:" + staticPath + "/assets/");

            // Serve other static files (favicon, etc) but NOT api routes
            registry.addResourceHandler("/*.js", "/*.css", "/*.ico", "/*.png", "/*.svg", "/*.json")
                    .addResourceLocations("file:" + staticPath + "/");
        }
    }

}
