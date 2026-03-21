package com.example.ecommerce.dto;

import java.math.BigDecimal;
import java.util.List;

public final class StatisticsDtos {
    private StatisticsDtos() {
    }

    public record StatisticsSummaryResponse(
            BigDecimal totalRevenue,
            long totalOrders,
            long totalUsers,
            long totalProducts,
            long deliveredOrders,
            double deliveredRate,
            BigDecimal avgOrderValue,
            double cancelRate) {
    }

    public record RevenuePointByDateResponse(
            String date,
            BigDecimal revenue) {
    }

    public record RevenuePointByMonthResponse(
            String month,
            BigDecimal revenue) {
    }

    public record RevenueDetailsResponse(
            BigDecimal dayRevenue,
            BigDecimal monthRevenue,
            BigDecimal yearRevenue,
            List<RevenuePointByDateResponse> dailySeries,
            List<RevenuePointByMonthResponse> monthlySeries) {
    }
}
