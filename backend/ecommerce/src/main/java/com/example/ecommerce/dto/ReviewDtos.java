package com.example.ecommerce.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ReviewDtos {
    private ReviewDtos() {
    }

    public record ReviewUserResponse(
            Long id,
            String fullName,
            String email,
            String avatarUrl) {
    }

    public record ReviewReplyResponse(
            Long id,
            Long staffId,
            String body) {
    }

    public record ReviewResponse(
            Long id,
            Long userId,
            String userName,
            String userAvatar,
            Integer rating,
            String title,
            String body,
            Boolean isApproved,
            String createdAt,
            ReviewReplyResponse reply) {
    }

    public record PendingReviewCountResponse(
            long pendingReviews) {
    }

    public record PendingReviewByProductResponse(
            Long productId,
            long pendingReviews) {
    }

    public record CreateReviewRequest(
            @NotNull(message = "Rating is required")
            @Min(value = 1, message = "Rating must be between 1 and 5")
            @Max(value = 5, message = "Rating must be between 1 and 5")
            Integer rating,
            @Size(max = 150, message = "Review title must be at most 150 characters")
            String title,
            @NotBlank(message = "Review body is required")
            @Size(max = 2000, message = "Review body must be at most 2000 characters")
            String body) {
    }

    public record ReplyReviewRequest(
            @NotBlank(message = "Reply body is required")
            @Size(max = 2000, message = "Reply body must be at most 2000 characters")
            String body) {
    }

    public record ModerateReviewRequest(
            @NotNull(message = "Approved flag is required")
            Boolean approved) {
    }

    public record ReviewMutationResponse(
            Long id,
            String message) {
    }

    public record ProductReviewListResponse(
            List<ReviewResponse> reviews) {
    }
}
