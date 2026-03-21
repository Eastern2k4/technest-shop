package com.example.ecommerce.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.stream.Collectors;

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
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.OrderItem;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.product.Product;
import com.example.ecommerce.product.ProductRepository;
import com.example.ecommerce.user.User;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderController(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody OrderRequest request,
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

        if (user == null || user.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "User not found. Please log in again.");
        }

        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order must contain at least one item");
        }
        if (request.address() == null || request.address().stream().anyMatch(part -> part == null || part.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipping address is required");
        }

        Order order = new Order();
        order.setUser(user);
        order.setPaymentMethod(request.payment());
        order.setShippingAddressText(String.join(", ", request.address()));

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.items()) {
            if (itemReq.id() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product ID is required");
            }
            if (itemReq.qty() == null || itemReq.qty() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Quantity must be greater than 0 for product: " + itemReq.id());
            }

            Product product = productRepository.findById(itemReq.id())
                    .orElseThrow(() -> {
                        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Product not found: " + itemReq.id());
                    });

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
            productRepository.save(product);
        }

        BigDecimal shippingFee = subtotal.compareTo(BigDecimal.ZERO) > 0
                ? new BigDecimal("30000")
                : BigDecimal.ZERO;
        BigDecimal grandTotal = subtotal.add(shippingFee);

        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setGrandTotal(grandTotal);
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(toOrderResponse(savedOrder));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    public ResponseEntity<Map<String, Object>> getOrder(
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

        List<Map<String, Object>> itemsResponse = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", item.getProduct().getId());
            itemMap.put("name", item.getNameSnapshot());
            itemMap.put("qty", item.getQuantity());
            itemMap.put("price", item.getUnitPrice());
            itemsResponse.add(itemMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", order.getId());
        response.put("orderNumber", order.getOrderNumber());
        response.put("customerEmail", order.getUser().getEmail());
        response.put("customerName", order.getUser().getFullName());
        response.put("items", itemsResponse);
        response.put("subtotal", order.getSubtotal());
        response.put("shipping", order.getShippingFee());
        response.put("total", order.getGrandTotal());
        response.put("paymentMethod",
                order.getPaymentMethod() != null ? order.getPaymentMethod() : "cod");
        response.put("status", order.getStatus().name());
        response.put("paymentStatus", order.getPaymentStatus().name());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<Map<String, Object>>> getMyOrders(
            Authentication authentication) {

        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        User user = (User) authentication.getPrincipal();
        List<Order> orders = orderRepository.findByUserIdOrderByPlacedAtDesc(user.getId());

        List<Map<String, Object>> ordersResponse = new ArrayList<>();
        for (Order order : orders) {
            List<Map<String, Object>> itemsResponse = new ArrayList<>();
            for (OrderItem item : order.getItems()) {
                itemsResponse.add(Map.of(
                        "id", item.getProduct().getId(),
                        "name", item.getNameSnapshot(),
                        "qty", item.getQuantity(),
                        "price", item.getUnitPrice()));
            }

            Map<String, Object> orderMap = new java.util.HashMap<>();
            orderMap.put("id", order.getId());
            orderMap.put("orderNumber", order.getOrderNumber());
            orderMap.put("items", itemsResponse);
            orderMap.put("subtotal", order.getSubtotal());
            orderMap.put("shipping", order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO);
            orderMap.put("total", order.getGrandTotal());
            orderMap.put("paymentMethod", order.getPaymentMethod() != null ? order.getPaymentMethod() : "cod");
            orderMap.put("status", order.getStatus().name());
            orderMap.put("paymentStatus", order.getPaymentStatus().name());
            orderMap.put("createdAt", order.getPlacedAt() != null ? order.getPlacedAt().toString() : "");
            ordersResponse.add(orderMap);
        }

        return ResponseEntity.ok(ordersResponse);
    }

    // DTOs for request/response
    public record OrderRequest(
            List<OrderItemRequest> items,
            List<String> address,
            String payment) {
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<Map<String, Object>>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String q) {
        List<Order> orders = orderRepository.findAll();

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

        if (statusFilter != null || fromDate != null || toDate != null || (qLower != null && !qLower.isBlank())) {
            orders = orders.stream()
                    .filter(o -> {
                        if (statusFilter != null && o.getStatus() != statusFilter) {
                            return false;
                        }
                        if (fromDate != null) {
                            if (o.getPlacedAt() == null || o.getPlacedAt().toLocalDate().isBefore(fromDate)) {
                                return false;
                            }
                        }
                        if (toDate != null) {
                            if (o.getPlacedAt() == null || o.getPlacedAt().toLocalDate().isAfter(toDate)) {
                                return false;
                            }
                        }
                        if (qLower != null && !qLower.isBlank()) {
                            String orderNumber = o.getOrderNumber() != null ? o.getOrderNumber().toLowerCase(Locale.ROOT) : "";
                            String email = o.getUser() != null && o.getUser().getEmail() != null
                                    ? o.getUser().getEmail().toLowerCase(Locale.ROOT)
                                    : "";
                            String name = o.getUser() != null && o.getUser().getFullName() != null
                                    ? o.getUser().getFullName().toLowerCase(Locale.ROOT)
                                    : "";
                            return orderNumber.contains(qLower) || email.contains(qLower) || name.contains(qLower);
                        }
                        return true;
                    })
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> ordersResponse = new ArrayList<>();
        for (Order order : orders) {
            User user = order.getUser();
            Map<String, Object> orderMap = new java.util.HashMap<>();
            orderMap.put("id", order.getId());
            orderMap.put("orderNumber", order.getOrderNumber());
            orderMap.put("customerName", user.getFullName() != null ? user.getFullName() : user.getEmail());
            orderMap.put("customerEmail", user.getEmail());
            orderMap.put("total", order.getGrandTotal());
            orderMap.put("status", order.getStatus().name());
            orderMap.put("paymentStatus", order.getPaymentStatus().name());
            orderMap.put("paymentMethod", order.getPaymentMethod() != null ? order.getPaymentMethod() : "cod");
            orderMap.put("placedAt", order.getPlacedAt() != null ? order.getPlacedAt().toString() : "");
            ordersResponse.add(orderMap);
        }

        return ResponseEntity.ok(ordersResponse);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CUSTOMER')")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
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

        String newStatus = request.get("status");
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

        String newPaymentStatus = request.get("paymentStatus");
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
        return ResponseEntity.ok(toOrderResponse(saved));
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

    public record OrderItemRequest(
            Long id,
            Integer qty) {
    }

    private Map<String, Object> toOrderResponse(Order order) {
        List<Map<String, Object>> itemsResponse = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            itemsResponse.add(Map.of(
                    "id", item.getProduct().getId(),
                    "name", item.getNameSnapshot(),
                    "qty", item.getQuantity(),
                    "price", item.getUnitPrice()));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", order.getId());
        response.put("orderNumber", order.getOrderNumber());
        response.put("items", itemsResponse);
        response.put("subtotal", order.getSubtotal());
        response.put("shipping", order.getShippingFee());
        response.put("total", order.getGrandTotal());
        response.put("paymentMethod", order.getPaymentMethod() != null ? order.getPaymentMethod() : "cod");
        response.put("status", order.getStatus().name());
        response.put("paymentStatus", order.getPaymentStatus().name());
        return response;
    }
}
