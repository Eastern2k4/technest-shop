package com.example.ecommerce.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.Order.PaymentStatus;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.product.ProductRepository;
import com.example.ecommerce.user.UserRepository;

@RestController
@RequestMapping("/api/admin")
public class StatisticsController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public StatisticsController(
            OrderRepository orderRepository,
            UserRepository userRepository,
            ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    // API cũ dashboard: tổng doanh thu, đơn, user, sản phẩm
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        List<Order> orders = orderRepository.findAll();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOrders = 0;
        long deliveredOrders = 0;
        long paidDeliveredOrders = 0;
        long failedPaymentOrders = 0;

        for (Order order : orders) {
            if (order.getStatus() == Order.OrderStatus.DELIVERED) {
                deliveredOrders++;
            }
            if (order.getPaymentStatus() == PaymentStatus.FAILED) {
                failedPaymentOrders++;
            }
            if (order.getStatus() == Order.OrderStatus.DELIVERED
                    && order.getPaymentStatus() == PaymentStatus.PAID
                    && order.getGrandTotal() != null) {
                totalRevenue = totalRevenue.add(order.getGrandTotal());
                paidDeliveredOrders++;
            }
            totalOrders++;
        }

        BigDecimal avgOrderValue = paidDeliveredOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(paidDeliveredOrders), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        double deliveredRate = totalOrders > 0 ? (double) deliveredOrders / totalOrders : 0.0;
        double cancelRate = totalOrders > 0 ? (double) failedPaymentOrders / totalOrders : 0.0;

        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();

        Map<String, Object> response = new HashMap<>();
        response.put("totalRevenue", totalRevenue);
        response.put("totalOrders", totalOrders);
        response.put("totalUsers", totalUsers);
        response.put("totalProducts", totalProducts);
        response.put("deliveredOrders", deliveredOrders);
        response.put("deliveredRate", deliveredRate);
        response.put("avgOrderValue", avgOrderValue);
        response.put("cancelRate", cancelRate);

        return ResponseEntity.ok(response);
    }

    // API mới: chi tiết doanh thu + data cho biểu đồ
    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getRevenueDetails() {
        List<Order> orders = orderRepository.findAll();

        LocalDate today = LocalDate.now();
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDate firstDayOfYear = today.withDayOfYear(1);

        BigDecimal dayRevenue = BigDecimal.ZERO;
        BigDecimal monthRevenue = BigDecimal.ZERO;
        BigDecimal yearRevenue = BigDecimal.ZERO;

        // Map để build series cho biểu đồ
        Map<LocalDate, BigDecimal> dailyMap = new TreeMap<>();
        Map<YearMonth, BigDecimal> monthlyMap = new TreeMap<>();

        for (Order order : orders) {
            LocalDateTime placedAt = order.getPlacedAt();
            if (placedAt == null)
                continue;

            // chỉ tính đơn đã giao hàng và đã thanh toán
            if (order.getStatus() != Order.OrderStatus.DELIVERED
                    || order.getPaymentStatus() != PaymentStatus.PAID)
                continue;

            BigDecimal amount = order.getGrandTotal() != null
                    ? order.getGrandTotal()
                    : BigDecimal.ZERO;

            LocalDate date = placedAt.toLocalDate();

            // hôm nay
            if (date.equals(today)) {
                dayRevenue = dayRevenue.add(amount);
            }
            // trong tháng này
            if (!date.isBefore(firstDayOfMonth)) {
                monthRevenue = monthRevenue.add(amount);
            }
            // trong năm nay
            if (!date.isBefore(firstDayOfYear)) {
                yearRevenue = yearRevenue.add(amount);
            }

            // map theo ngày
            dailyMap.merge(date, amount, BigDecimal::add);

            // map theo tháng
            YearMonth ym = YearMonth.from(date);
            monthlyMap.merge(ym, amount, BigDecimal::add);
        }

        // Series 7 ngày gần nhất
        List<Map<String, Object>> dailySeries = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            BigDecimal v = dailyMap.getOrDefault(d, BigDecimal.ZERO);

            Map<String, Object> point = new HashMap<>();
            point.put("date", d.toString());
            point.put("revenue", v);
            dailySeries.add(point);
        }

        // Series 12 tháng gần nhất
        List<Map<String, Object>> monthlySeries = new ArrayList<>();
        YearMonth current = YearMonth.from(today);
        for (int i = 11; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            BigDecimal v = monthlyMap.getOrDefault(ym, BigDecimal.ZERO);

            Map<String, Object> point = new HashMap<>();
            point.put("month", ym.toString()); // ví dụ: 2025-11
            point.put("revenue", v);
            monthlySeries.add(point);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("dayRevenue", dayRevenue);
        response.put("monthRevenue", monthRevenue);
        response.put("yearRevenue", yearRevenue);
        response.put("dailySeries", dailySeries);
        response.put("monthlySeries", monthlySeries);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/revenue/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportRevenueCsv(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        List<Order> orders = orderRepository.findAll();

        LocalDate today = LocalDate.now();
        LocalDate fromDate = parseDateParam(from);
        LocalDate toDate = parseDateParam(to);
        if (toDate == null) {
            toDate = today;
        }
        if (fromDate == null) {
            fromDate = toDate.minusDays(29);
        }

        Map<LocalDate, BigDecimal> dailyMap = new TreeMap<>();

        for (Order order : orders) {
            LocalDateTime placedAt = order.getPlacedAt();
            if (placedAt == null) {
                continue;
            }
            if (order.getStatus() != Order.OrderStatus.DELIVERED
                    || order.getPaymentStatus() != PaymentStatus.PAID) {
                continue;
            }
            LocalDate date = placedAt.toLocalDate();
            if (date.isBefore(fromDate) || date.isAfter(toDate)) {
                continue;
            }

            BigDecimal amount = order.getGrandTotal() != null
                    ? order.getGrandTotal()
                    : BigDecimal.ZERO;
            dailyMap.merge(date, amount, BigDecimal::add);
        }

        StringBuilder csv = new StringBuilder();
        csv.append("date,revenue\n");
        LocalDate cursor = fromDate;
        while (!cursor.isAfter(toDate)) {
            BigDecimal v = dailyMap.getOrDefault(cursor, BigDecimal.ZERO);
            csv.append(cursor).append(",").append(v).append("\n");
            cursor = cursor.plusDays(1);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"revenue.csv\"")
                .contentType(MediaType.valueOf("text/csv"))
                .body(csv.toString());
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
