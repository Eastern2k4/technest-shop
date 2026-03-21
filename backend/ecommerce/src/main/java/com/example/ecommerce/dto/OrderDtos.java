package com.example.ecommerce.dto;

import java.math.BigDecimal;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {
    }

    public record OrderItemRequest(
            Long id,
            Integer qty) {
    }

    public record OrderRequest(
            List<OrderItemRequest> items,
            List<String> address,
            String payment) {
    }

    public record OrderStatusUpdateRequest(
            String status,
            String paymentStatus) {
    }

    public record OrderItemResponse(
            Long id,
            String name,
            Integer qty,
            BigDecimal price) {
    }

    public record OrderSummaryResponse(
            Long id,
            String orderNumber,
            String customerName,
            String customerEmail,
            Integer itemCount,
            BigDecimal subtotal,
            BigDecimal shipping,
            BigDecimal total,
            String paymentMethod,
            String status,
            String paymentStatus,
            String placedAt) {
    }

    public record OrderDetailResponse(
            Long id,
            String orderNumber,
            String customerName,
            String customerEmail,
            List<OrderItemResponse> items,
            Integer itemCount,
            BigDecimal subtotal,
            BigDecimal shipping,
            BigDecimal total,
            String paymentMethod,
            String status,
            String paymentStatus,
            String placedAt) {
    }
}
