package com.example.ecommerce.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class RuntimeDatabaseReporter implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(RuntimeDatabaseReporter.class);

    private final String mode;
    private final String url;

    public RuntimeDatabaseReporter(
            @Value("${app.runtime.database-mode}") String mode,
            @Value("${spring.datasource.url}") String url) {
        this.mode = mode;
        this.url = url;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Runtime database mode: {} ({})", mode, sanitize(url));
    }

    private String sanitize(String jdbcUrl) {
        return jdbcUrl.replaceAll("(?i)(password=)[^&]+", "$1****");
    }
}
