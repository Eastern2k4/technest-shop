package com.example.ecommerce.review;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {
    Optional<ReviewReply> findByReviewId(Long reviewId);
    List<ReviewReply> findByReviewIdIn(List<Long> reviewIds);
    void deleteByReviewId(Long reviewId);
    @Query("select count(distinct r.reviewId) from ReviewReply r")
    long countDistinctReviewId();
}
