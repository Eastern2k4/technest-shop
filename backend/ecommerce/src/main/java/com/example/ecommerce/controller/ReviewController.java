package com.example.ecommerce.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.ecommerce.dto.ReviewDtos.CreateReviewRequest;
import com.example.ecommerce.dto.ReviewDtos.PendingReviewByProductResponse;
import com.example.ecommerce.dto.ReviewDtos.PendingReviewCountResponse;
import com.example.ecommerce.dto.ReviewDtos.ReplyReviewRequest;
import com.example.ecommerce.dto.ReviewDtos.ReviewMutationResponse;
import com.example.ecommerce.dto.ReviewDtos.ReviewResponse;
import com.example.ecommerce.service.ReviewService;
import com.example.ecommerce.user.User;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/product/{productId}")
    public List<ReviewResponse> getProductReviews(@PathVariable Long productId) {
        return reviewService.getProductReviews(productId);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @GetMapping("/pending-count")
    public PendingReviewCountResponse getPendingReviewCount() {
        return reviewService.getPendingReviewCount();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @GetMapping("/pending-by-product")
    public List<PendingReviewByProductResponse> getPendingByProduct() {
        return reviewService.getPendingByProduct();
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/product/{productId}")
    public ReviewMutationResponse createReview(
            @PathVariable Long productId,
            @RequestBody CreateReviewRequest reviewData,
            @AuthenticationPrincipal User user) {
        return reviewService.createReview(productId, reviewData, user);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @PostMapping("/{reviewId}/reply")
    public ReviewMutationResponse replyToReview(
            @PathVariable Long reviewId,
            @RequestBody ReplyReviewRequest replyData,
            @AuthenticationPrincipal User staff) {
        return reviewService.replyToReview(reviewId, replyData, staff);
    }
}
