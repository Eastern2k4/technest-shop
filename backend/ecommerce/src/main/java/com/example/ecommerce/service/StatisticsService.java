package com.example.ecommerce.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;

import com.example.ecommerce.dto.StatisticsDtos.RevenueDetailsResponse;
import com.example.ecommerce.dto.StatisticsDtos.RevenuePointByDateResponse;
import com.example.ecommerce.dto.StatisticsDtos.RevenuePointByMonthResponse;
import com.example.ecommerce.dto.StatisticsDtos.StatisticsSummaryResponse;
import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.Order.PaymentStatus;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.product.ProductRepository;
import com.example.ecommerce.user.UserRepository;

@Service
public class StatisticsService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public StatisticsService(
            OrderRepository orderRepository,
            UserRepository userRepository,
            ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public StatisticsSummaryResponse getStatistics() {
        BigDecimal totalRevenue = orderRepository.sumGrandTotalByStatusAndPaymentStatus(
                Order.OrderStatus.DELIVERED,
                PaymentStatus.PAID);
        long totalOrders = orderRepository.count();
        long deliveredOrders = orderRepository.countByStatus(Order.OrderStatus.DELIVERED);
        long paidDeliveredOrders = orderRepository.countByStatusAndPaymentStatus(
                Order.OrderStatus.DELIVERED,
                PaymentStatus.PAID);
        long failedPaymentOrders = orderRepository.countByPaymentStatus(PaymentStatus.FAILED);

        BigDecimal avgOrderValue = paidDeliveredOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(paidDeliveredOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        double deliveredRate = totalOrders > 0 ? (double) deliveredOrders / totalOrders : 0.0;
        double cancelRate = totalOrders > 0 ? (double) failedPaymentOrders / totalOrders : 0.0;

        return new StatisticsSummaryResponse(
                totalRevenue,
                totalOrders,
                userRepository.count(),
                productRepository.count(),
                deliveredOrders,
                deliveredRate,
                avgOrderValue,
                cancelRate);
    }

    public RevenueDetailsResponse getRevenueDetails() {
        List<Order> orders = orderRepository.findByStatusAndPaymentStatusAndPlacedAtIsNotNullOrderByPlacedAtAsc(
                Order.OrderStatus.DELIVERED,
                PaymentStatus.PAID);

        LocalDate today = LocalDate.now();
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDate firstDayOfYear = today.withDayOfYear(1);

        BigDecimal dayRevenue = BigDecimal.ZERO;
        BigDecimal monthRevenue = BigDecimal.ZERO;
        BigDecimal yearRevenue = BigDecimal.ZERO;
        Map<LocalDate, BigDecimal> dailyMap = new TreeMap<>();
        Map<YearMonth, BigDecimal> monthlyMap = new TreeMap<>();

        for (Order order : orders) {
            LocalDateTime placedAt = order.getPlacedAt();
            if (placedAt == null
                    || order.getStatus() != Order.OrderStatus.DELIVERED
                    || order.getPaymentStatus() != PaymentStatus.PAID) {
                continue;
            }

            BigDecimal amount = order.getGrandTotal() != null ? order.getGrandTotal() : BigDecimal.ZERO;
            LocalDate date = placedAt.toLocalDate();

            if (date.equals(today)) {
                dayRevenue = dayRevenue.add(amount);
            }
            if (!date.isBefore(firstDayOfMonth)) {
                monthRevenue = monthRevenue.add(amount);
            }
            if (!date.isBefore(firstDayOfYear)) {
                yearRevenue = yearRevenue.add(amount);
            }

            dailyMap.merge(date, amount, BigDecimal::add);
            monthlyMap.merge(YearMonth.from(date), amount, BigDecimal::add);
        }

        List<RevenuePointByDateResponse> dailySeries = java.util.stream.IntStream.rangeClosed(0, 6)
                .mapToObj(i -> today.minusDays(6L - i))
                .map(date -> new RevenuePointByDateResponse(date.toString(), dailyMap.getOrDefault(date, BigDecimal.ZERO)))
                .toList();

        YearMonth current = YearMonth.from(today);
        List<RevenuePointByMonthResponse> monthlySeries = java.util.stream.IntStream.rangeClosed(0, 11)
                .mapToObj(i -> current.minusMonths(11L - i))
                .map(month -> new RevenuePointByMonthResponse(month.toString(), monthlyMap.getOrDefault(month, BigDecimal.ZERO)))
                .toList();

        return new RevenueDetailsResponse(dayRevenue, monthRevenue, yearRevenue, dailySeries, monthlySeries);
    }

    public String exportRevenueCsv(LocalDate fromDate, LocalDate toDate) {
        Map<LocalDate, BigDecimal> dailyMap = new TreeMap<>();

        for (Order order : orderRepository.findByStatusAndPaymentStatusAndPlacedAtGreaterThanEqualAndPlacedAtLessThanOrderByPlacedAtAsc(
                Order.OrderStatus.DELIVERED,
                PaymentStatus.PAID,
                fromDate.atStartOfDay(),
                toDate.plusDays(1).atStartOfDay())) {
            LocalDate date = order.getPlacedAt().toLocalDate();
            BigDecimal amount = order.getGrandTotal() != null ? order.getGrandTotal() : BigDecimal.ZERO;
            dailyMap.merge(date, amount, BigDecimal::add);
        }

        StringBuilder csv = new StringBuilder();
        csv.append("date,revenue\n");
        LocalDate cursor = fromDate;
        while (!cursor.isAfter(toDate)) {
            csv.append(cursor)
                    .append(",")
                    .append(dailyMap.getOrDefault(cursor, BigDecimal.ZERO))
                    .append("\n");
            cursor = cursor.plusDays(1);
        }
        return csv.toString();
    }
}
