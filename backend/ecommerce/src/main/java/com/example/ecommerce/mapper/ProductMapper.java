package com.example.ecommerce.mapper;

import com.example.ecommerce.dto.ProductDTO;
import com.example.ecommerce.product.Product;

public class ProductMapper {
    public static ProductDTO toDTO(Product p, String categoryName) {
        return new ProductDTO(
                p.getId(),
                p.getName(),
                p.getPrice(),
                p.getImageUrl(),
                p.getCategoryId(),
                p.getQuantity(),
                p.getImageUrl(), // image field (alias for imageUrl)
                p.getDescriptionShort() != null ? p.getDescriptionShort() : "", // specs field uses descriptionShort
                categoryName != null ? categoryName : "",
                p.getDescriptionShort() != null ? p.getDescriptionShort() : "",
                p.getDescriptionLong() != null ? p.getDescriptionLong() : "");
    }

    // Overload for backward compatibility (defaults to empty category name)
    public static ProductDTO toDTO(Product p) {
        return toDTO(p, null);
    }
}
