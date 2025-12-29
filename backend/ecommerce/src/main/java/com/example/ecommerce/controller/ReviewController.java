package com.example.ecommerce.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.review.Review;
import com.example.ecommerce.review.ReviewReply;
import com.example.ecommerce.review.ReviewReplyRepository;
import com.example.ecommerce.review.ReviewRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;
import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.OrderRepository;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ReviewReplyRepository reviewReplyRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public ReviewController(ReviewRepository reviewRepository, ReviewReplyRepository reviewReplyRepository,
            UserRepository userRepository, OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.reviewReplyRepository = reviewReplyRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/product/{productId}")
    public List<Map<String, Object>> getProductReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId);
        List<Long> reviewIds = reviews.stream().map(Review::getId).collect(Collectors.toList());
        List<ReviewReply> replies = reviewReplyRepository.findByReviewIdIn(reviewIds);
        Map<Long, ReviewReply> replyMap = replies.stream()
                .collect(Collectors.toMap(ReviewReply::getReviewId, r -> r));

        // Get user IDs and fetch user info
        List<Long> userIds = reviews.stream().map(Review::getUserId).distinct().collect(Collectors.toList());
        Map<Long, Map<String, Object>> userMap = new java.util.HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(user -> {
                java.util.Map<String, Object> userInfo = new java.util.HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("name", user.getFullName() != null ? user.getFullName() : user.getEmail());
                userInfo.put("email", user.getEmail());
                userInfo.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");
                userMap.put(user.getId(), userInfo);
            });
        }

        return reviews.stream().map(review -> {
            ReviewReply reply = replyMap.get(review.getId());
            Map<String, Object> userInfo = userMap.get(review.getUserId());
            
            java.util.Map<String, Object> reviewMap = new java.util.HashMap<>();
            reviewMap.put("id", review.getId());
            reviewMap.put("userId", review.getUserId());
            reviewMap.put("userName", userInfo != null ? userInfo.get("name") : "Anonymous");
            reviewMap.put("userAvatar", userInfo != null ? userInfo.get("avatarUrl") : "");
            reviewMap.put("rating", review.getRating());
            reviewMap.put("title", review.getTitle() != null ? review.getTitle() : "");
            reviewMap.put("body", review.getBody() != null ? review.getBody() : "");
            reviewMap.put("isApproved", review.getIsApproved());
            reviewMap.put("createdAt", review.getCreatedAt() != null ? review.getCreatedAt().toString() : "");
            if (reply != null) {
                reviewMap.put("reply", Map.of(
                        "id", reply.getId(),
                        "staffId", reply.getStaffId(),
                        "body", reply.getBody()
                ));
            } else {
                reviewMap.put("reply", null);
            }
            return reviewMap;
        }).collect(Collectors.toList());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @GetMapping("/pending-count")
    public Map<String, Object> getPendingReviewCount() {
        long totalApproved = reviewRepository.countByIsApprovedTrue();
        long totalReplies = reviewReplyRepository.count();
        long pending = Math.max(0, totalApproved - totalReplies);
        return Map.of("pendingReplies", pending);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @GetMapping("/pending-by-product")
    public List<Map<String, Object>> getPendingByProduct() {
        List<Review> reviews = reviewRepository.findByIsApprovedTrueOrderByCreatedAtDesc();
        if (reviews.isEmpty()) {
            return List.of();
        }
        List<Long> reviewIds = reviews.stream().map(Review::getId).collect(Collectors.toList());
        List<ReviewReply> replies = reviewReplyRepository.findByReviewIdIn(reviewIds);
        java.util.Set<Long> repliedIds = replies.stream()
                .map(ReviewReply::getReviewId)
                .collect(Collectors.toSet());

        Map<Long, Long> counts = new java.util.HashMap<>();
        for (Review r : reviews) {
            if (!repliedIds.contains(r.getId())) {
                counts.merge(r.getProductId(), 1L, Long::sum);
            }
        }

        return counts.entrySet().stream()
                .map(e -> {
                    Map<String, Object> row = new java.util.HashMap<>();
                    row.put("productId", e.getKey());
                    row.put("pendingReplies", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/product/{productId}")
    public Map<String, Object> createReview(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> reviewData,
            @AuthenticationPrincipal User user) {
        boolean eligible = orderRepository.hasDeliveredPaidItem(
                user.getId(),
                productId,
                Order.OrderStatus.DELIVERED,
                Order.PaymentStatus.PAID);
        if (!eligible) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only delivered and paid orders can be reviewed");
        }

        if (reviewRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bạn đã đánh giá sản phẩm này rồi.");
        }
        
        Review review = new Review();
        review.setProductId(productId);
        review.setUserId(user.getId());
        review.setRating((Integer) reviewData.get("rating"));
        review.setTitle((String) reviewData.get("title"));
        review.setBody((String) reviewData.get("body"));
        review.setIsApproved(true); // Auto-approve reviews for faster feedback

        Review saved;
        try {
            saved = reviewRepository.save(review);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bạn đã đánh giá sản phẩm này rồi.");
        }

        return Map.of(
                "id", saved.getId(),
                "message", "Review submitted successfully. It will be visible after approval."
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @PostMapping("/{reviewId}/reply")
    public Map<String, Object> replyToReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> replyData,
            @AuthenticationPrincipal User staff) {
        
        // Verify review exists
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }

        ReviewReply reply = new ReviewReply();
        reply.setReviewId(reviewId);
        reply.setStaffId(staff.getId());
        reply.setBody(replyData.get("body"));

        ReviewReply saved = reviewReplyRepository.save(reply);

        return Map.of(
                "id", saved.getId(),
                "message", "Reply posted successfully"
        );
    }
}
