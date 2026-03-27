package com.example.ecommerce.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.ReviewDtos.CreateReviewRequest;
import com.example.ecommerce.dto.ReviewDtos.PendingReviewByProductResponse;
import com.example.ecommerce.dto.ReviewDtos.PendingReviewCountResponse;
import com.example.ecommerce.dto.ReviewDtos.ReplyReviewRequest;
import com.example.ecommerce.dto.ReviewDtos.ReviewMutationResponse;
import com.example.ecommerce.dto.ReviewDtos.ReviewReplyResponse;
import com.example.ecommerce.dto.ReviewDtos.ReviewResponse;
import com.example.ecommerce.dto.ReviewDtos.ReviewUserResponse;
import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.review.Review;
import com.example.ecommerce.review.ReviewReply;
import com.example.ecommerce.review.ReviewReplyRepository;
import com.example.ecommerce.review.ReviewRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReviewReplyRepository reviewReplyRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            ReviewReplyRepository reviewReplyRepository,
            UserRepository userRepository,
            OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.reviewReplyRepository = reviewReplyRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    public List<ReviewResponse> getProductReviews(Long productId) {
        return mapReviews(reviewRepository.findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId));
    }

    public List<ReviewResponse> getManagementReviews(Long productId) {
        return mapReviews(reviewRepository.findByProductIdOrderByCreatedAtDesc(productId));
    }

    public PendingReviewCountResponse getPendingReviewCount() {
        return new PendingReviewCountResponse(reviewRepository.countByIsApprovedFalse());
    }

    public List<PendingReviewByProductResponse> getPendingByProduct() {
        List<Review> reviews = reviewRepository.findByIsApprovedFalseOrderByCreatedAtDesc();
        if (reviews.isEmpty()) {
            return List.of();
        }

        Map<Long, Long> counts = new HashMap<>();
        for (Review review : reviews) {
            counts.merge(review.getProductId(), 1L, Long::sum);
        }

        return counts.entrySet().stream()
                .map(entry -> new PendingReviewByProductResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    @Transactional
    public ReviewMutationResponse createReview(Long productId, CreateReviewRequest request, User user) {
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
        review.setRating(request.rating());
        review.setTitle(normalizeText(request.title()));
        review.setBody(normalizeText(request.body()));
        review.setIsApproved(false);

        Review saved;
        try {
            saved = reviewRepository.save(review);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bạn đã đánh giá sản phẩm này rồi.");
        }

        return new ReviewMutationResponse(
                saved.getId(),
                "Review submitted successfully and is pending approval.");
    }

    @Transactional
    public ReviewMutationResponse moderateReview(Long reviewId, boolean approved) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        review.setIsApproved(approved);
        reviewRepository.save(review);
        return new ReviewMutationResponse(
                review.getId(),
                approved ? "Review approved successfully" : "Review moved back to pending");
    }

    @Transactional
    public ReviewMutationResponse deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        reviewReplyRepository.deleteByReviewId(reviewId);
        reviewRepository.delete(review);
        return new ReviewMutationResponse(reviewId, "Review deleted successfully");
    }

    @Transactional
    public ReviewMutationResponse replyToReview(Long reviewId, ReplyReviewRequest request, User staff) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        if (!Boolean.TRUE.equals(review.getIsApproved())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review must be approved before replying");
        }

        ReviewReply reply = reviewReplyRepository.findByReviewId(reviewId).orElseGet(() -> {
            ReviewReply created = new ReviewReply();
            created.setReviewId(reviewId);
            return created;
        });
        reply.setStaffId(staff.getId());
        reply.setBody(normalizeText(request.body()));

        ReviewReply saved = reviewReplyRepository.save(reply);
        return new ReviewMutationResponse(saved.getId(), "Reply posted successfully");
    }

    private List<ReviewResponse> mapReviews(List<Review> reviews) {
        if (reviews.isEmpty()) {
            return List.of();
        }

        List<Long> reviewIds = reviews.stream().map(Review::getId).toList();
        Map<Long, ReviewReply> replyMap = reviewReplyRepository.findByReviewIdIn(reviewIds).stream()
                .collect(Collectors.toMap(
                        ReviewReply::getReviewId,
                        reply -> reply,
                        (existing, replacement) -> replacement));

        List<Long> userIds = reviews.stream().map(Review::getUserId).distinct().toList();
        Map<Long, ReviewUserResponse> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(user -> userMap.put(
                    user.getId(),
                    new ReviewUserResponse(
                            user.getId(),
                            user.getFullName() != null ? user.getFullName() : user.getEmail(),
                            user.getEmail(),
                            user.getAvatarUrl() != null ? user.getAvatarUrl() : "")));
        }

        return reviews.stream()
                .map(review -> toReviewResponse(review, userMap.get(review.getUserId()), replyMap.get(review.getId())))
                .toList();
    }

    private ReviewResponse toReviewResponse(Review review, ReviewUserResponse user, ReviewReply reply) {
        return new ReviewResponse(
                review.getId(),
                review.getUserId(),
                user != null ? user.fullName() : "Anonymous",
                user != null ? user.avatarUrl() : "",
                review.getRating(),
                review.getTitle() != null ? review.getTitle() : "",
                review.getBody() != null ? review.getBody() : "",
                review.getIsApproved(),
                review.getCreatedAt() != null ? review.getCreatedAt().toString() : "",
                reply != null
                        ? new ReviewReplyResponse(reply.getId(), reply.getStaffId(), reply.getBody())
                        : null);
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}
