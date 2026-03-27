package com.example.ecommerce.dto;

import java.util.Map;

public record ApiErrorResponse(
        String message,
        int status,
        String error,
        Map<String, String> validationErrors) {

    public ApiErrorResponse(String message, int status, String error) {
        this(message, status, error, null);
    }
}
