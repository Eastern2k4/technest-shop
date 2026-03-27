package com.example.ecommerce.config;

import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.ApiErrorResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        if (status.is4xxClientError()) {
            log.debug("Client error {}: {}", status.value(), ex.getReason());
        } else {
            log.error("Server-side ResponseStatusException {}", status.value(), ex);
        }
        return ResponseEntity.status(status).body(toErrorResponse(status, ex.getReason()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidJson(HttpMessageNotReadableException ex) {
        log.debug("Invalid JSON payload", ex);
        return ResponseEntity.badRequest().body(toErrorResponse(HttpStatus.BAD_REQUEST, "Invalid request body"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        ex.getBindingResult().getGlobalErrors().forEach(error -> errors.putIfAbsent(error.getObjectName(), error.getDefaultMessage()));

        log.debug("Validation failed: {}", errors);
        return ResponseEntity.badRequest().body(toValidationErrorResponse(errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String path = violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "request";
            int lastDot = path.lastIndexOf('.');
            String field = lastDot >= 0 ? path.substring(lastDot + 1) : path;
            errors.putIfAbsent(field, violation.getMessage());
        });

        log.debug("Constraint violation: {}", errors);
        return ResponseEntity.badRequest().body(toValidationErrorResponse(errors));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        log.debug("Access denied", ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(toErrorResponse(HttpStatus.FORBIDDEN, "You do not have permission to perform this action."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(toErrorResponse(HttpStatus.CONFLICT, "Request conflicts with existing data"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        log.error("Unexpected exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(toErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"));
    }

    private ApiErrorResponse toErrorResponse(HttpStatus status, String message) {
        return new ApiErrorResponse(
                message != null && !message.isBlank() ? message : status.getReasonPhrase(),
                status.value(),
                status.getReasonPhrase());
    }

    private ApiErrorResponse toValidationErrorResponse(Map<String, String> errors) {
        return new ApiErrorResponse(
                "Validation failed",
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                errors);
    }
}
