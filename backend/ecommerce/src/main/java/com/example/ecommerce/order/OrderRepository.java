package com.example.ecommerce.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    List<Order> findByUserIdOrderByPlacedAtDesc(Long userId);

    void deleteByUserId(Long userId);

    @Query("select count(o) > 0 from Order o join o.items i " +
            "where o.user.id = :userId and i.product.id = :productId " +
            "and o.status = :status and o.paymentStatus = :paymentStatus")
    boolean hasDeliveredPaidItem(@Param("userId") Long userId,
            @Param("productId") Long productId,
            @Param("status") Order.OrderStatus status,
            @Param("paymentStatus") Order.PaymentStatus paymentStatus);

}
