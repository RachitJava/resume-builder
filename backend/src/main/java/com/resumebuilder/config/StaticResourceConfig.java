package com.resumebuilder.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Determine static file location
        String staticPath = "/app/static";
        
        // Check if Docker path exists, otherwise use local path
        if (!Files.exists(Paths.get(staticPath))) {
            String userDir = System.getProperty("user.dir");
            staticPath = Paths.get(userDir, "../frontend/dist").toAbsolutePath().toString();
            
            // If local path also doesn't exist, use classpath
            if (!Files.exists(Paths.get(staticPath))) {
                staticPath = null;
            }
        }
        
        if (staticPath != null) {
            // Serve static files from file system
            registry.addResourceHandler("/**")
                .addResourceLocations("file:" + staticPath + "/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        
                        // If file exists, return it
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        
                        // For React Router: serve index.html for all non-API routes
                        if (!resourcePath.startsWith("api/")) {
                            Resource indexResource = location.createRelative("index.html");
                            if (indexResource.exists() && indexResource.isReadable()) {
                                return indexResource;
                            }
                        }
                        
                        return null;
                    }
                });
        } else {
            // Fallback: serve from classpath
            registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true);
        }
    }
}

