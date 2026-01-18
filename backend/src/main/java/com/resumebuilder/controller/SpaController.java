package com.resumebuilder.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
public class SpaController {

    private Path getIndexPath() {
        // Docker path
        Path dockerPath = Paths.get("/app/static/index.html");
        if (Files.exists(dockerPath)) {
            return dockerPath;
        }

        // Local development path
        String userDir = System.getProperty("user.dir");
        Path localPath = Paths.get(userDir, "../frontend/dist/index.html");
        if (Files.exists(localPath)) {
            return localPath;
        }

        return null;
    }

    @GetMapping(value = { "/", "/login", "/editor", "/editor/**", "/templates", "/job-match", "/admin",
            "/admin/**" }, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> serveIndex() {
        Path indexPath = getIndexPath();

        if (indexPath != null && Files.exists(indexPath)) {
            Resource resource = new FileSystemResource(indexPath);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        }

        return ResponseEntity.notFound().build();
    }
}
