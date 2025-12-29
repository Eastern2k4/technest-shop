package com.example.ecommerce.dto;

import java.math.BigDecimal;

public record ProductDTO(
                Long id,
                String name,
                BigDecimal price,
                String imageUrl,
                Long categoryId,
                Integer quantity,
                String image,
                String specs,
                String categoryName,
                String descriptionShort,
                String descriptionLong) {
}
