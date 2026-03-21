package com.example.ecommerce.dto;

import java.util.List;

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
            long pendingReplies) {
    }

    public record PendingReviewByProductResponse(
            Long productId,
            long pendingReplies) {
    }

    public record CreateReviewRequest(
            Integer rating,
            String title,
            String body) {
    }

    public record ReplyReviewRequest(
            String body) {
    }

    public record ReviewMutationResponse(
            Long id,
            String message) {
    }

    public record ProductReviewListResponse(
            List<ReviewResponse> reviews) {
    }
}
