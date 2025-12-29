package com.example.ecommerce.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // 🔹 Lấy danh sách theo category (phân trang)
    Page<Product> findAllByCategoryId(Long categoryId, Pageable pageable);

    // 🔹 Tìm kiếm theo tên (phân trang, không phân biệt hoa thường)
    Page<Product> findByNameContainingIgnoreCase(String q, Pageable pageable);
}
