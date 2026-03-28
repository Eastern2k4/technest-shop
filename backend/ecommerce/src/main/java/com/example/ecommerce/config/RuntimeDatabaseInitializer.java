package com.example.ecommerce.config;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class RuntimeDatabaseInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    private static final String MODE_AUTO = "auto";
    private static final String MODE_H2 = "h2";
    private static final String MODE_MYSQL = "mysql";

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        String mode = determineMode(environment);

        Map<String, Object> overrides = new LinkedHashMap<>();
        overrides.put("app.runtime.database-mode", mode);

        if (MODE_MYSQL.equals(mode)) {
            configureMySql(environment, overrides);
        } else {
            configureH2(environment, overrides);
        }

        environment.getPropertySources().addFirst(new MapPropertySource("runtimeDatabaseDefaults", overrides));
    }

    private String determineMode(ConfigurableEnvironment environment) {
        String configuredMode = normalize(environment.getProperty("app.database.mode"));
        if (MODE_H2.equals(configuredMode) || hasProfile(environment, MODE_H2)) {
            return MODE_H2;
        }
        if (MODE_MYSQL.equals(configuredMode) || hasProfile(environment, MODE_MYSQL)) {
            return MODE_MYSQL;
        }

        String mysqlPassword = normalizeSecret(firstNonBlank(
                environment.getProperty("DB_PASSWORD"),
                environment.getProperty("MYSQL_ROOT_PASSWORD"),
                environment.getProperty("MYSQL_PASSWORD")));
        if (mysqlPassword != null) {
            return MODE_MYSQL;
        }

        return MODE_H2;
    }

    private void configureMySql(ConfigurableEnvironment environment, Map<String, Object> overrides) {
        String url = firstNonBlank(
                environment.getProperty("DB_URL"),
                environment.getProperty("spring.datasource.url"),
                defaultMySqlUrl(environment));
        String username = firstNonBlank(
                environment.getProperty("DB_USERNAME"),
                environment.getProperty("MYSQL_USERNAME"),
                environment.getProperty("spring.datasource.username"),
                "root");
        String password = normalizeSecret(firstNonBlank(
                environment.getProperty("DB_PASSWORD"),
                environment.getProperty("MYSQL_ROOT_PASSWORD"),
                environment.getProperty("MYSQL_PASSWORD"),
                environment.getProperty("spring.datasource.password")));

        if (password == null) {
            throw new IllegalStateException(
                    "MySQL runtime was selected but no usable database password was provided. "
                            + "Set DB_PASSWORD or MYSQL_ROOT_PASSWORD in .env, or remove APP_DATABASE_MODE/mysql profile to use local H2 seed data.");
        }

        overrides.put("spring.datasource.url", url);
        overrides.put("spring.datasource.username", username);
        overrides.put("spring.datasource.password", password);
        overrides.put("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
        overrides.put("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        overrides.put("spring.sql.init.mode", "never");
    }

    private void configureH2(ConfigurableEnvironment environment, Map<String, Object> overrides) {
        boolean bootstrapLocalData = environment.getProperty("app.bootstrap.local-data", Boolean.class, true);
        String url = firstNonBlank(
                environment.getProperty("spring.datasource.url"),
                "jdbc:h2:mem:ecommerce-dev;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        String username = firstNonBlank(environment.getProperty("spring.datasource.username"), "sa");
        String password = environment.getProperty("spring.datasource.password", "");

        overrides.put("spring.datasource.url", url);
        overrides.put("spring.datasource.username", username);
        overrides.put("spring.datasource.password", password);
        overrides.put("spring.datasource.driver-class-name", "org.h2.Driver");
        overrides.put("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.H2Dialect");
        overrides.put("app.bootstrap.local-data", Boolean.toString(bootstrapLocalData));
        overrides.put("spring.sql.init.mode", bootstrapLocalData ? "always" : "never");

        if (bootstrapLocalData) {
            overrides.put("spring.sql.init.data-locations", "classpath:data-h2.sql");
        }
    }

    private boolean hasProfile(ConfigurableEnvironment environment, String profile) {
        for (String activeProfile : environment.getActiveProfiles()) {
            if (profile.equalsIgnoreCase(activeProfile)) {
                return true;
            }
        }
        return false;
    }

    private String defaultMySqlUrl(ConfigurableEnvironment environment) {
        String databaseName = firstNonBlank(environment.getProperty("MYSQL_DATABASE"), "ecommerce_slim");
        return "jdbc:mysql://127.0.0.1:3306/" + databaseName
                + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toLowerCase(Locale.ROOT);
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSecret(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String normalized = trimmed.toLowerCase(Locale.ROOT);
        if (normalized.startsWith("change-this-")) {
            return null;
        }
        return trimmed;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
