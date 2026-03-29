package com.example.ecommerce.controller;

import java.time.LocalDate;
import java.util.List;

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
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.OrderDtos.OrderDetailResponse;
import com.example.ecommerce.dto.OrderDtos.OrderRequest;
import com.example.ecommerce.dto.OrderDtos.OrderStatusUpdateRequest;
import com.example.ecommerce.dto.OrderDtos.OrderSummaryResponse;
import com.example.ecommerce.service.OrderService;
import com.example.ecommerce.user.User;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderDetailResponse> createOrder(
            @RequestBody @Valid OrderRequest request,
            Authentication authentication) {
        User user = requireAuthenticatedUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrderResponse(user, request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<OrderDetailResponse> getOrder(
            @PathVariable Long id,
            Authentication authentication) {
        User user = requireAuthenticatedUser(authentication);
        return ResponseEntity.ok(orderService.getOrderDetails(id, user, toActorAccess(authentication)));
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrderSummaryResponse>> getMyOrders(
            Authentication authentication) {
        return ResponseEntity.ok(orderService.getMyOrders(requireAuthenticatedUser(authentication)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<OrderSummaryResponse>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(orderService.searchOrders(status, from, to, q));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<OrderDetailResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody @Valid OrderStatusUpdateRequest request,
            Authentication authentication) {
        User actor = requireAuthenticatedUser(authentication);
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request, actor, toActorAccess(authentication)));
    }

    private OrderService.ActorAccess toActorAccess(Authentication authentication) {
        return new OrderService.ActorAccess(
                hasRole(authentication, "ADMIN"),
                hasRole(authentication, "STAFF"),
                hasRole(authentication, "CUSTOMER"));
    }

    private User requireAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return (User) authentication.getPrincipal();
    }

    private boolean hasRole(Authentication authentication, String role) {
        String authority = "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }
}
