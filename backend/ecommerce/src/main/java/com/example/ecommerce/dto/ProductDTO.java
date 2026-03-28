package com.example.ecommerce.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ProductDTO(
                Long id,
                @NotBlank(message = "Product name is required")
                @Size(max = 180, message = "Product name must be at most 180 characters")
                String name,
                @Size(max = 120, message = "Brand must be at most 120 characters")
                String brand,
                @NotNull(message = "Price is required")
                @DecimalMin(value = "0.0", inclusive = true, message = "Price must be greater than or equal to 0")
                BigDecimal price,
                @Size(max = 255, message = "Image URL must be at most 255 characters")
                String imageUrl,
                @Positive(message = "Category ID must be greater than 0")
                Long categoryId,
                String categoryName,
                @NotNull(message = "Quantity is required")
                @PositiveOrZero(message = "Quantity must be greater than or equal to 0")
                Integer quantity,
                @Size(max = 2000, message = "Short description must be at most 2000 characters")
                String descriptionShort,
                @Size(max = 10000, message = "Long description must be at most 10000 characters")
                String descriptionLong) {
}
