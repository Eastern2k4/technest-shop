package com.example.ecommerce.controller;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.ecommerce.dto.ProductDTO;
import com.example.ecommerce.mapper.ProductMapper;
import com.example.ecommerce.model.Category;
import com.example.ecommerce.product.Product;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.service.ProductService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final CategoryRepository categoryRepository;
    // 👇 Constructor thủ công – bắt buộc khi không dùng Lombok
    public ProductController(ProductService productService, CategoryRepository categoryRepository) {
        this.productService = productService;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<ProductDTO> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String cat,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String minPrice,
            @RequestParam(required = false) String maxPrice,
            @RequestParam(required = false) String brand,
            @PageableDefault(size = 1000, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        // Handle category name parameter (cat)
        if (cat != null && !cat.isBlank()) {
            if ("all".equalsIgnoreCase(cat)) {
                // Return all products
                categoryId = null;
            } else {
                // Convert category name to categoryId - try multiple variations
                // First try exact match (case-insensitive)
                categoryId = categoryRepository.findByNameIgnoreCase(cat)
                        .map(Category::getId)
                        .orElse(null);

                // If not found, try common variations
                if (categoryId == null && cat.length() > 0) {
                    String[] variations = {
                            cat.length() > 1 ? cat.substring(0, 1).toUpperCase() + cat.substring(1).toLowerCase()
                                    : cat.toUpperCase(), // Capitalize first letter
                            cat.toLowerCase(),
                            cat.toUpperCase()
                    };
                    for (String variation : variations) {
                        categoryId = categoryRepository.findByNameIgnoreCase(variation)
                                .map(Category::getId)
                                .orElse(null);
                        if (categoryId != null)
                            break;
                    }
                }

                // If still not found, try mapping common category names
                if (categoryId == null) {
                    String normalizedCat = cat.toLowerCase();
                    String mappedName = null;
                    if (normalizedCat.equals("phone") || normalizedCat.equals("phones") ||
                            normalizedCat.equals("smartphone") || normalizedCat.equals("smartphones")) {
                        mappedName = "Phone";
                    } else if (normalizedCat.equals("laptop") || normalizedCat.equals("laptops") ||
                            normalizedCat.equals("notebook") || normalizedCat.equals("notebooks")) {
                        mappedName = "Laptop";
                    } else if (normalizedCat.equals("screen") || normalizedCat.equals("screens") ||
                            normalizedCat.equals("monitor") || normalizedCat.equals("monitors")) {
                        mappedName = "Screen";
                    } else if (normalizedCat.equals("headphone") || normalizedCat.equals("headphones") ||
                            normalizedCat.equals("earphone") || normalizedCat.equals("earphones")) {
                        mappedName = "Headphone";
                    } else if (normalizedCat.equals("accessories") || normalizedCat.equals("accessory")) {
                        mappedName = "Accessories";
                    }

                    if (mappedName != null) {
                        categoryId = categoryRepository.findByNameIgnoreCase(mappedName)
                                .map(Category::getId)
                                .orElse(null);
                    }
                }

                // If category still not found, return empty list
                // (Don't throw error to avoid 401/404)
                if (categoryId == null) {
                    return List.of();
                }
            }
        }

        // Convert price strings to BigDecimal safely
        BigDecimal minPriceBD = null;
        BigDecimal maxPriceBD = null;
        try {
            if (minPrice != null && !minPrice.isBlank()) {
                minPriceBD = new BigDecimal(minPrice);
            }
            if (maxPrice != null && !maxPrice.isBlank()) {
                maxPriceBD = new BigDecimal(maxPrice);
            }
        } catch (NumberFormatException e) {
            // Invalid price format, ignore price filters
        }

        Page<Product> productPage = productService.list(categoryId, q, minPriceBD, maxPriceBD, brand, pageable);

        Map<Long, String> categoryMap = categoryRepository.findAllByIdIn(productPage.getContent().stream()
                .map(Product::getCategoryId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new))).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));

        // Map products with category names
        List<ProductDTO> dtos = productPage.getContent().stream()
                .map(p -> {
                    String categoryName = p.getCategoryId() != null ? categoryMap.getOrDefault(p.getCategoryId(), "")
                            : "";
                    return ProductMapper.toDTO(p, categoryName);
                })
                .collect(Collectors.toList());

        return dtos;
    }

    @GetMapping("/{id}")
    public ProductDTO get(@PathVariable Long id) {
        Product product = productService.get(id);
        String categoryName = product.getCategoryId() != null ? categoryRepository.findById(product.getCategoryId())
                .map(Category::getName)
                .orElse("") : "";
        return ProductMapper.toDTO(product, categoryName);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDTO create(@RequestBody @Valid ProductDTO dto) {
        Product p = new Product();
        p.setName(dto.name());
        p.setPrice(dto.price());
        p.setImageUrl(dto.imageUrl());
        p.setCategoryId(dto.categoryId());
        p.setQuantity(dto.quantity());
        p.setDescriptionShort(dto.descriptionShort());
        p.setDescriptionLong(dto.descriptionLong());
        Product created = productService.create(p);
        String categoryName = created.getCategoryId() != null ? categoryRepository.findById(created.getCategoryId())
                .map(Category::getName)
                .orElse("") : "";
        return ProductMapper.toDTO(created, categoryName);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PutMapping("/{id}")
    public ProductDTO update(@PathVariable Long id, @RequestBody @Valid ProductDTO dto) {
        Product p = productService.get(id);
        p.setName(dto.name());
        p.setPrice(dto.price());
        p.setImageUrl(dto.imageUrl());
        p.setCategoryId(dto.categoryId());
        p.setQuantity(dto.quantity());
        p.setDescriptionShort(dto.descriptionShort());
        p.setDescriptionLong(dto.descriptionLong());
        Product updated = productService.update(p);
        String categoryName = updated.getCategoryId() != null ? categoryRepository.findById(updated.getCategoryId())
                .map(Category::getName)
                .orElse("") : "";
        return ProductMapper.toDTO(updated, categoryName);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }
}
