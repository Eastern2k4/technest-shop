package com.example.ecommerce.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.OrderDtos.OrderDetailResponse;
import com.example.ecommerce.dto.OrderDtos.OrderItemRequest;
import com.example.ecommerce.dto.OrderDtos.OrderItemResponse;
import com.example.ecommerce.dto.OrderDtos.OrderRequest;
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

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Order createOrder(User user, OrderRequest request) {
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
                                item.getProduct().getId(),
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
}
