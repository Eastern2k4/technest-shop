package com.example.ecommerce.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.OrderDtos.OrderDetailResponse;
import com.example.ecommerce.dto.OrderDtos.OrderItemRequest;
import com.example.ecommerce.dto.OrderDtos.OrderItemResponse;
import com.example.ecommerce.dto.OrderDtos.OrderRequest;
import com.example.ecommerce.dto.OrderDtos.OrderStatusUpdateRequest;
import com.example.ecommerce.dto.OrderDtos.OrderSummaryResponse;
import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.OrderItem;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.product.Product;
import com.example.ecommerce.product.ProductRepository;
import com.example.ecommerce.user.User;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public record ActorAccess(boolean admin, boolean staff, boolean customer) {
        public boolean canManageOrders() {
            return admin || staff;
        }
    }

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public OrderDetailResponse createOrderResponse(User user, OrderRequest request) {
        return toOrderDetailResponse(createOrder(user, request));
    }

    @Transactional
    public Order createOrder(User user, OrderRequest request) {
        requireAuthenticatedUser(user);

        Order order = new Order();
        order.setUser(user);
        order.setPaymentMethod(request.payment());
        order.setShippingAddressText(String.join(", ", request.address()));

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.items()) {
            Product product = productRepository.findByIdForUpdate(itemReq.id())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Product not found: " + itemReq.id()));

            if (product.getQuantity() < itemReq.qty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Insufficient stock for product: " + product.getName());
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.qty()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setNameSnapshot(product.getName());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setQuantity(itemReq.qty());
            orderItem.setLineTotal(lineTotal);
            orderItems.add(orderItem);

            product.setQuantity(product.getQuantity() - itemReq.qty());
        }

        BigDecimal shippingFee = subtotal.compareTo(BigDecimal.ZERO) > 0
                ? new BigDecimal("30000")
                : BigDecimal.ZERO;

        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setGrandTotal(subtotal.add(shippingFee));
        order.setItems(orderItems);

        return orderRepository.save(order);
    }

    public OrderDetailResponse getOrderDetails(Long id, User actor, ActorAccess access) {
        User currentUser = requireAuthenticatedUser(actor);
        Order order = access.canManageOrders()
                ? orderRepository.findDetailById(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"))
                : orderRepository.findDetailByIdAndUserId(id, currentUser.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return toOrderDetailResponse(order);
    }

    public List<OrderSummaryResponse> getMyOrders(User actor) {
        User currentUser = requireAuthenticatedUser(actor);
        return orderRepository.findByUserIdOrderByPlacedAtDesc(currentUser.getId()).stream()
                .map(this::toOrderSummaryResponse)
                .toList();
    }

    public List<OrderSummaryResponse> searchOrders(String status, String from, String to, String q) {
        LocalDate fromDate = parseDateParam(from);
        LocalDate toDate = parseDateParam(to);
        Order.OrderStatus statusFilter = parseOrderStatus(status);
        String normalizedQuery = normalizeNullable(q);

        List<Order> orders = orderRepository.searchAdminOrders(
                statusFilter,
                fromDate != null ? fromDate.atStartOfDay() : null,
                toDate != null ? toDate.plusDays(1).atStartOfDay() : null,
                normalizedQuery != null ? normalizedQuery.toLowerCase(Locale.ROOT) : null);

        return orders.stream()
                .map(this::toOrderSummaryResponse)
                .toList();
    }

    @Transactional
    public OrderDetailResponse updateOrderStatus(Long id, OrderStatusUpdateRequest request, User actor, ActorAccess access) {
        User currentUser = requireAuthenticatedUser(actor);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        String newStatus = normalizeNullable(request.status());
        if (newStatus != null) {
            updateOrderStatus(order, currentUser, access, newStatus);
        }

        String newPaymentStatus = normalizeNullable(request.paymentStatus());
        if (newPaymentStatus != null) {
            updatePaymentStatus(order, access, newPaymentStatus);
        }

        return toOrderDetailResponse(orderRepository.save(order));
    }

    public OrderSummaryResponse toOrderSummaryResponse(Order order) {
        User user = order.getUser();
        return new OrderSummaryResponse(
                order.getId(),
                order.getOrderNumber(),
                user != null
                        ? (user.getFullName() != null ? user.getFullName() : user.getEmail())
                        : "",
                user != null ? user.getEmail() : "",
                order.getItems() != null ? order.getItems().stream().mapToInt(OrderItem::getQuantity).sum() : 0,
                order.getSubtotal(),
                order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO,
                order.getGrandTotal(),
                order.getPaymentMethod() != null ? order.getPaymentMethod() : "cod",
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                order.getPlacedAt() != null ? order.getPlacedAt().toString() : "");
    }

    public OrderDetailResponse toOrderDetailResponse(Order order) {
        List<OrderItemResponse> items = order.getItems() == null
                ? List.of()
                : order.getItems().stream()
                        .map(item -> new OrderItemResponse(
                                item.getProduct() != null ? item.getProduct().getId() : null,
                                item.getNameSnapshot(),
                                item.getQuantity(),
                                item.getUnitPrice()))
                        .toList();

        User user = order.getUser();
        return new OrderDetailResponse(
                order.getId(),
                order.getOrderNumber(),
                user != null
                        ? (user.getFullName() != null ? user.getFullName() : user.getEmail())
                        : "",
                user != null ? user.getEmail() : "",
                items,
                items.stream().mapToInt(OrderItemResponse::qty).sum(),
                order.getSubtotal(),
                order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO,
                order.getGrandTotal(),
                order.getPaymentMethod() != null ? order.getPaymentMethod() : "cod",
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                order.getPlacedAt() != null ? order.getPlacedAt().toString() : "");
    }

    private void updateOrderStatus(Order order, User actor, ActorAccess access, String rawStatus) {
        Order.OrderStatus status;
        try {
            status = Order.OrderStatus.valueOf(rawStatus.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + rawStatus);
        }

        if (status == Order.OrderStatus.DELIVERED) {
            if (access.canManageOrders()) {
                order.setStatus(status);
                return;
            }
            if (!access.customer()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can mark orders as delivered");
            }
            if (order.getUser() == null || !order.getUser().getId().equals(actor.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own orders");
            }
            if (order.getStatus() != Order.OrderStatus.SHIPPING) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Only shipping orders can be marked as delivered");
            }
            order.setStatus(status);
            return;
        }

        if (!access.canManageOrders()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only admin or staff can update order status to " + status.name());
        }
        if (status == Order.OrderStatus.SHIPPING && order.getStatus() != Order.OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only pending orders can be moved to shipping");
        }
        if (status == Order.OrderStatus.PENDING && order.getStatus() != Order.OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Order cannot be moved back to pending");
        }
        order.setStatus(status);
    }

    private void updatePaymentStatus(Order order, ActorAccess access, String rawPaymentStatus) {
        if (!access.canManageOrders()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only admin or staff can update payment status");
        }

        try {
            Order.PaymentStatus paymentStatus = Order.PaymentStatus.valueOf(rawPaymentStatus.toUpperCase(Locale.ROOT));
            order.setPaymentStatus(paymentStatus);
            order.setPaidAt(paymentStatus == Order.PaymentStatus.PAID ? LocalDateTime.now() : null);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid payment status: " + rawPaymentStatus);
        }
    }

    private Order.OrderStatus parseOrderStatus(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }
        try {
            return Order.OrderStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + value);
        }
    }

    private LocalDate parseDateParam(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }
        try {
            return LocalDate.parse(normalized);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date: " + value);
        }
    }

    private User requireAuthenticatedUser(User user) {
        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication required. Please log in again.");
        }
        return user;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
