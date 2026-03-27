package com.example.ecommerce.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.OrderDtos.OrderDetailResponse;
import com.example.ecommerce.dto.OrderDtos.OrderRequest;
import com.example.ecommerce.dto.OrderDtos.OrderStatusUpdateRequest;
import com.example.ecommerce.dto.OrderDtos.OrderSummaryResponse;
import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.service.OrderService;
import com.example.ecommerce.user.User;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public OrderController(OrderRepository orderRepository, OrderService orderService) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderDetailResponse> createOrder(
            @RequestBody @Valid OrderRequest request,
            Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication required. Please log in again.");
        }

        if (!(authentication.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Invalid authentication. Please log in again.");
        }

        User user = (User) authentication.getPrincipal();

        Order savedOrder = orderService.createOrder(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.toOrderDetailResponse(savedOrder));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<OrderDetailResponse> getOrder(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication required. Please log in again.");
        }

        User user = (User) authentication.getPrincipal();

        boolean isAdminOrStaff = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth) || "ROLE_STAFF".equals(auth));

        Order order;
        if (isAdminOrStaff) {
            // Admin / Staff xem được mọi đơn
            order = orderRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        } else {
            // Customer chỉ xem được đơn của mình
            order = orderRepository.findByIdAndUserId(id, user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        }

        return ResponseEntity.ok(orderService.toOrderDetailResponse(order));
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrderSummaryResponse>> getMyOrders(
            Authentication authentication) {

        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        User user = (User) authentication.getPrincipal();
        List<Order> orders = orderRepository.findByUserIdOrderByPlacedAtDesc(user.getId());

        return ResponseEntity.ok(orders.stream().map(orderService::toOrderSummaryResponse).toList());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<OrderSummaryResponse>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String q) {
        final LocalDate fromDate = parseDateParam(from);
        final LocalDate toDate = parseDateParam(to);
        final String qLower = q != null ? q.trim().toLowerCase(Locale.ROOT) : null;
        final Order.OrderStatus statusFilter;
        if (status != null && !status.isBlank()) {
            try {
                statusFilter = Order.OrderStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
            }
        } else {
            statusFilter = null;
        }
        LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateExclusive = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;
        List<Order> orders = orderRepository.searchAdminOrders(
                statusFilter,
                fromDateTime,
                toDateExclusive,
                qLower != null && !qLower.isBlank() ? qLower : null);

        return ResponseEntity.ok(orders.stream().map(orderService::toOrderSummaryResponse).toList());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    @Transactional
    public ResponseEntity<OrderDetailResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody @Valid OrderStatusUpdateRequest request,
            Authentication authentication) {

        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        User actor = (User) authentication.getPrincipal();
        boolean isStaff = hasRole(authentication, "STAFF");
        boolean isCustomer = hasRole(authentication, "CUSTOMER");
        boolean isAdmin = hasRole(authentication, "ADMIN");
        boolean canManageOrders = isAdmin || isStaff;

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        String newStatus = request.status();
        if (newStatus != null) {
            try {
                Order.OrderStatus status = Order.OrderStatus.valueOf(newStatus.toUpperCase());
                if (status == Order.OrderStatus.DELIVERED) {
                    if (canManageOrders) {
                        order.setStatus(status);
                    } else {
                        if (!isCustomer) {
                            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                    "Only customers can mark orders as delivered");
                        }
                        if (order.getUser() == null || !order.getUser().getId().equals(actor.getId())) {
                            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                    "You can only update your own orders");
                        }
                        if (order.getStatus() != Order.OrderStatus.SHIPPING) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "Only shipping orders can be marked as delivered");
                        }
                        order.setStatus(status);
                    }
                } else {
                    if (!canManageOrders) {
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
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + newStatus);
            }
        }

        String newPaymentStatus = request.paymentStatus();
        if (newPaymentStatus != null) {
            if (!canManageOrders) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only admin or staff can update payment status");
            }
            try {
                Order.PaymentStatus paymentStatus = Order.PaymentStatus.valueOf(newPaymentStatus.toUpperCase());
                order.setPaymentStatus(paymentStatus);
                order.setPaidAt(paymentStatus == Order.PaymentStatus.PAID ? LocalDateTime.now() : null);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid payment status: " + newPaymentStatus);
            }
        }

        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(orderService.toOrderDetailResponse(saved));
    }

    private boolean hasRole(Authentication authentication, String role) {
        String authority = "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }

    private LocalDate parseDateParam(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date: " + value);
        }
    }
}
