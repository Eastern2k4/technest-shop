// src/main/java/com/example/ecommerce/service/ProductService.java
package com.example.ecommerce.service;

import java.math.BigDecimal;
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
        String normalizedQuery = normalizeNullable(q);
        String normalizedBrand = normalizeNullable(brand);

        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("categoryId"), categoryId));
        }
        if (normalizedQuery != null) {
            String pattern = "%" + normalizedQuery.toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(cb.coalesce(root.get("name"), "")), pattern),
                    cb.like(cb.lower(cb.coalesce(root.get("brand"), "")), pattern),
                    cb.like(cb.lower(cb.coalesce(root.get("descriptionShort"), "")), pattern)));
        }
        if (minPrice != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }
        if (normalizedBrand != null) {
            String pattern = normalizedBrand.toLowerCase(Locale.ROOT);
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(cb.coalesce(root.get("brand"), "")), pattern));
        }

        return spec;
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
        p.setName(p.getName() != null ? p.getName().trim() : null);
        p.setBrand(normalizeNullable(p.getBrand()));

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

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
