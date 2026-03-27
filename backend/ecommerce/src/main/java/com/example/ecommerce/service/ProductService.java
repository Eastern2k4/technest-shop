// src/main/java/com/example/ecommerce/service/ProductService.java
package com.example.ecommerce.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
        return productRepo.findAll(buildSpecification(categoryId, q, minPrice, maxPrice, brand), pageable);
    }

    private Specification<Product> buildSpecification(
            Long categoryId,
            String q,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String brand) {
        Specification<Product> spec = Specification.where(null);

        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("categoryId"), categoryId));
        }
        if (q != null && !q.isBlank()) {
            String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern));
        }
        if (minPrice != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }
        if (brand != null && !brand.isBlank()) {
            List<String> brandKeywords = brandKeywords(brand);
            spec = spec.and((root, query, cb) -> {
                List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
                for (String keyword : brandKeywords) {
                    predicates.add(cb.like(cb.lower(root.get("name")), "%" + keyword + "%"));
                }
                return cb.or(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
            });
        }

        return spec;
    }

    private List<String> brandKeywords(String brand) {
        String brandLower = brand.trim().toLowerCase(Locale.ROOT);
        List<String> keywords = new ArrayList<>();
        keywords.add(brandLower);

        switch (brandLower) {
            case "apple" -> keywords.addAll(List.of("iphone", "ipad", "macbook", "airpods", "apple watch", "imac", "mac pro", "mac mini"));
            case "samsung" -> keywords.add("galaxy");
            case "xiaomi" -> keywords.addAll(List.of("redmi", "mi "));
            case "asus" -> keywords.addAll(List.of("rog", "tuf"));
            case "hp" -> keywords.addAll(List.of("hp ", "hp spectre", "hp pavilion", "hp envy"));
            case "lg" -> keywords.addAll(List.of("lg ", "ultragear"));
            case "sony" -> keywords.add("wh-");
            case "razer" -> keywords.add("blackshark");
            case "logitech" -> keywords.add("mx master");
            default -> {
            }
        }

        return keywords.stream().distinct().toList();
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
