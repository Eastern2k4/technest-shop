package com.example.ecommerce.dto;

import java.math.BigDecimal;

public record ProductDTO(
                Long id,
                String name,
                BigDecimal price,
                String imageUrl,
                Long categoryId,
                String categoryName,
                Integer quantity,
                String descriptionShort,
                String descriptionLong) {
}
