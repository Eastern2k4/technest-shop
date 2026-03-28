package com.example.ecommerce.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @EntityGraph(attributePaths = { "user", "items", "items.product" })
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findDetailById(@Param("id") Long id);

    @EntityGraph(attributePaths = { "user", "items", "items.product" })
    @Query("select o from Order o where o.id = :id and o.user.id = :userId")
    Optional<Order> findDetailByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @EntityGraph(attributePaths = { "user", "items", "items.product" })
    List<Order> findByUserIdOrderByPlacedAtDesc(Long userId);

    List<Order> findAllByUserId(Long userId);

    void deleteByUserId(Long userId);

    @EntityGraph(attributePaths = { "user", "items", "items.product" })
    @Query("""
            select distinct o from Order o
            left join o.user u
            left join o.items i
            where (:status is null or o.status = :status)
              and (:fromDate is null or o.placedAt >= :fromDate)
              and (:toDate is null or o.placedAt < :toDate)
              and (
                    :q is null
                    or lower(coalesce(o.orderNumber, '')) like lower(concat('%', :q, '%'))
                    or lower(coalesce(u.email, '')) like lower(concat('%', :q, '%'))
                    or lower(coalesce(u.fullName, '')) like lower(concat('%', :q, '%'))
                  )
            order by o.placedAt desc
            """)
    List<Order> searchAdminOrders(
            @Param("status") Order.OrderStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("q") String q);

    long countByStatus(Order.OrderStatus status);

    long countByPaymentStatus(Order.PaymentStatus paymentStatus);

    long countByStatusAndPaymentStatus(Order.OrderStatus status, Order.PaymentStatus paymentStatus);

    @Query("""
            select coalesce(sum(o.grandTotal), 0)
            from Order o
            where o.status = :status and o.paymentStatus = :paymentStatus
            """)
    BigDecimal sumGrandTotalByStatusAndPaymentStatus(
            @Param("status") Order.OrderStatus status,
            @Param("paymentStatus") Order.PaymentStatus paymentStatus);

    @EntityGraph(attributePaths = { "user", "items", "items.product" })
    List<Order> findByStatusAndPaymentStatusAndPlacedAtIsNotNullOrderByPlacedAtAsc(
            Order.OrderStatus status,
            Order.PaymentStatus paymentStatus);

    @EntityGraph(attributePaths = { "user", "items", "items.product" })
    List<Order> findByStatusAndPaymentStatusAndPlacedAtGreaterThanEqualAndPlacedAtLessThanOrderByPlacedAtAsc(
            Order.OrderStatus status,
            Order.PaymentStatus paymentStatus,
            LocalDateTime fromDate,
            LocalDateTime toDate);

    @Query("select count(o) > 0 from Order o join o.items i " +
            "where o.user.id = :userId and i.product.id = :productId " +
            "and o.status = :status and o.paymentStatus = :paymentStatus")
    boolean hasDeliveredPaidItem(@Param("userId") Long userId,
            @Param("productId") Long productId,
            @Param("status") Order.OrderStatus status,
            @Param("paymentStatus") Order.PaymentStatus paymentStatus);

}
