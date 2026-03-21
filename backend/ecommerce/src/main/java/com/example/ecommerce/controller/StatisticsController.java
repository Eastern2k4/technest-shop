package com.example.ecommerce.controller;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.ecommerce.dto.StatisticsDtos.RevenueDetailsResponse;
import com.example.ecommerce.dto.StatisticsDtos.StatisticsSummaryResponse;
import com.example.ecommerce.service.StatisticsService;

@RestController
@RequestMapping("/api/admin")
public class StatisticsController {
    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StatisticsSummaryResponse> getStatistics() {
        return ResponseEntity.ok(statisticsService.getStatistics());
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RevenueDetailsResponse> getRevenueDetails() {
        return ResponseEntity.ok(statisticsService.getRevenueDetails());
    }

    @GetMapping("/revenue/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportRevenueCsv(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate today = LocalDate.now();
        LocalDate fromDate = parseDateParam(from);
        LocalDate toDate = parseDateParam(to);
        if (toDate == null) {
            toDate = today;
        }
        if (fromDate == null) {
            fromDate = toDate.minusDays(29);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"revenue.csv\"")
                .contentType(MediaType.valueOf("text/csv"))
                .body(statisticsService.exportRevenueCsv(fromDate, toDate));
    }

    private LocalDate parseDateParam(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Invalid date: " + value);
        }
    }
}
