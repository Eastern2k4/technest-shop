package com.example.ecommerce.review;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(Long productId);
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);
    long countByIsApprovedTrue();
    long countByIsApprovedFalse();
    List<Review> findByIsApprovedTrueOrderByCreatedAtDesc();
    List<Review> findByIsApprovedFalseOrderByCreatedAtDesc();
    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
