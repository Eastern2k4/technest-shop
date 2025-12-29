// src/main/java/com/example/ecommerce/service/ProductService.java
package com.example.ecommerce.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.product.Product;
import com.example.ecommerce.product.ProductRepository;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepo;

    // 👇 Constructor thủ công (vì không dùng Lombok)
    public ProductService(ProductRepository productRepo) {
        this.productRepo = productRepo;
    }

    /** List có filter theo categoryId, q (search theo name), price range, và brand */
    public Page<Product> list(Long categoryId, String q, BigDecimal minPrice, BigDecimal maxPrice, String brand, Pageable pageable) {
        // Get base result set - fetch larger page to allow filtering
        Pageable largePage = org.springframework.data.domain.PageRequest.of(0, 10000, pageable.getSort());
        Page<Product> result;
        
        // Priority: categoryId > text search > all products
        if (categoryId != null) {
            result = productRepo.findAllByCategoryId(categoryId, largePage);
        } else if (q != null && !q.isBlank()) {
            result = productRepo.findByNameContainingIgnoreCase(q, largePage);
        } else {
            result = productRepo.findAll(largePage);
        }
        
        // Apply all filters in memory
        List<Product> filtered = new java.util.ArrayList<>(result.getContent());
        
        // Apply text search if category is specified (combine filters)
        if (q != null && !q.isBlank() && categoryId != null) {
            String queryLower = q.toLowerCase();
            filtered = filtered.stream()
                .filter(p -> p.getName().toLowerCase().contains(queryLower))
                .toList();
        }
        
        // Apply price range filter
        if (minPrice != null || maxPrice != null) {
            filtered = filtered.stream()
                .filter(p -> {
                    if (minPrice != null && p.getPrice().compareTo(minPrice) < 0) {
                        return false;
                    }
                    if (maxPrice != null && p.getPrice().compareTo(maxPrice) > 0) {
                        return false;
                    }
                    return true;
                })
                .toList();
        }
        
        // Apply brand filter (extract from product name)
        if (brand != null && !brand.isBlank()) {
            String brandLower = brand.toLowerCase();
            filtered = filtered.stream()
                .filter(p -> {
                    String name = p.getName().toLowerCase();
                    // Check if product matches the brand
                    return matchesBrand(name, brandLower);
                })
                .toList();
        }
        
        // Convert filtered list back to Page
        // Calculate pagination with safety checks
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filtered.size());
        
        if (start >= filtered.size() || filtered.isEmpty()) {
            return new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0);
        }
        
        List<Product> pagedContent = filtered.subList(start, end);
        
        return new org.springframework.data.domain.PageImpl<>(pagedContent, pageable, filtered.size());
    }
    
    /** Check if product name matches the given brand */
    private boolean matchesBrand(String productNameLower, String brandLower) {
        // Direct brand name match
        if (productNameLower.contains(brandLower) || 
            productNameLower.startsWith(brandLower + " ")) {
            return true;
        }
        
        // Brand-specific product patterns
        switch (brandLower) {
            case "apple":
                // Apple products: iPhone, iPad, MacBook, AirPods, Apple Watch, iMac, etc.
                return productNameLower.contains("iphone") ||
                       productNameLower.contains("ipad") ||
                       productNameLower.contains("macbook") ||
                       productNameLower.contains("airpods") ||
                       productNameLower.contains("apple watch") ||
                       productNameLower.contains("imac") ||
                       productNameLower.contains("mac pro") ||
                       productNameLower.contains("mac mini");
            
            case "samsung":
                return productNameLower.contains("samsung") ||
                       productNameLower.contains("galaxy");
            
            case "xiaomi":
                return productNameLower.contains("xiaomi") ||
                       productNameLower.contains("redmi") ||
                       productNameLower.contains("mi ");
            
            case "asus":
                return productNameLower.contains("asus") ||
                       productNameLower.contains("rog") ||
                       productNameLower.contains("tuf");
            
            case "hp":
                return productNameLower.contains("hp ") ||
                       productNameLower.contains("hp spectre") ||
                       productNameLower.contains("hp pavilion") ||
                       productNameLower.contains("hp envy") ||
                       productNameLower.startsWith("hp");
            
            case "lg":
                return productNameLower.contains("lg ") ||
                       productNameLower.contains("ultragear") ||
                       productNameLower.startsWith("lg");
            
            case "sony":
                return productNameLower.contains("sony") ||
                       productNameLower.contains("wh-");
            
            case "razer":
                return productNameLower.contains("razer") ||
                       productNameLower.contains("blackshark");
            
            case "logitech":
                return productNameLower.contains("logitech") ||
                       productNameLower.contains("mx master");
            
            default:
                // For other brands, check if brand name appears in product name
                return productNameLower.contains(brandLower);
        }
    }
    
    /** Extract brand from product name (simple heuristic) */
    private String extractBrandFromName(String name) {
        // Common brands to check
        String[] brands = {"apple", "samsung", "xiaomi", "oppo", "vivo", "realme", 
                          "huawei", "sony", "lg", "asus", "acer", "dell", "hp", 
                          "lenovo", "msi", "razer", "logitech", "jbl", "bose"};
        String nameLower = name.toLowerCase();
        for (String b : brands) {
            if (nameLower.startsWith(b + " ") || nameLower.contains(" " + b + " ")) {
                return b;
            }
        }
        // Check for Apple products
        if (nameLower.contains("iphone") || nameLower.contains("ipad") || 
            nameLower.contains("macbook") || nameLower.contains("airpods")) {
            return "apple";
        }
        return "";
    }

    /** Lấy 1 sản phẩm, 404 nếu không có */
    public Product get(Long id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
    }

    /** Tạo mới (validate cơ bản) */
    public Product create(Product p) {
        validate(p);
        p.setId(null);
        return productRepo.save(p);
    }

    /** Cập nhật (validate + tồn tại) */
    public Product update(Product p) {
        if (p.getId() == null || !productRepo.existsById(p.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + p.getId());
        }
        validate(p);
        return productRepo.save(p);
    }

    /** Xoá theo id (404 nếu không có) */
    public void delete(Long id) {
        if (!productRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id);
        }
        productRepo.deleteById(id);
    }

    // --- Validate dữ liệu tối thiểu ---
    private void validate(Product p) {
        if (p.getName() == null || p.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (p.getPrice() == null || p.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be >= 0");
        }
        if (p.getQuantity() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be >= 0");
        }
        // Nếu bắt buộc categoryId:
        // if (p.getCategoryId() == null) throw new
        // ResponseStatusException(HttpStatus.BAD_REQUEST, "categoryId is required");
    }
}
