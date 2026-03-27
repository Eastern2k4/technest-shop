package com.example.ecommerce.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public final class OrderDtos {
    private OrderDtos() {
    }

    public record OrderItemRequest(
            @NotNull(message = "Product ID is required")
            @Positive(message = "Product ID must be greater than 0")
            Long id,
            @NotNull(message = "Quantity is required")
            @Positive(message = "Quantity must be greater than 0")
            Integer qty) {
    }

    public record OrderRequest(
            @NotEmpty(message = "Order must contain at least one item")
            List<@Valid OrderItemRequest> items,
            @NotNull(message = "Shipping address is required")
            @Size(min = 5, max = 5, message = "Shipping address must contain exactly 5 parts")
            List<
                    @NotBlank(message = "Shipping address fields must not be blank")
                    @Size(max = 120, message = "Shipping address fields must be at most 120 characters")
                    String> address,
            @NotBlank(message = "Payment method is required")
            @Pattern(regexp = "(?i)cod|bank|card", message = "Payment method must be COD, bank, or card")
            String payment) {
    }

    public record OrderStatusUpdateRequest(
            @Pattern(
                    regexp = "(?i)PENDING|SHIPPING|DELIVERED",
                    message = "Status must be PENDING, SHIPPING, or DELIVERED")
            String status,
            @Pattern(
                    regexp = "(?i)UNPAID|PAID|FAILED|REFUNDED",
                    message = "Payment status must be UNPAID, PAID, FAILED, or REFUNDED")
            String paymentStatus) {

        @AssertTrue(message = "At least one of status or paymentStatus is required")
        public boolean hasAnyUpdateField() {
            return hasText(status) || hasText(paymentStatus);
        }

        private boolean hasText(String value) {
            return value != null && !value.isBlank();
        }
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
