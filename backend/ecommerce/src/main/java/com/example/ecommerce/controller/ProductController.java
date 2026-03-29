package com.example.ecommerce.controller;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;

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
import com.example.ecommerce.service.ProductService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
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
        return productService.list(
                new ProductService.ProductListRequest(categoryId, cat, q, minPrice, maxPrice, brand),
                pageable);
    }

    @GetMapping("/{id}")
    public ProductDTO get(@PathVariable Long id) {
        return productService.getDetails(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDTO create(@RequestBody @Valid ProductDTO dto) {
        return productService.create(dto);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PutMapping("/{id}")
    public ProductDTO update(@PathVariable Long id, @RequestBody @Valid ProductDTO dto) {
        return productService.update(id, dto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }
}
