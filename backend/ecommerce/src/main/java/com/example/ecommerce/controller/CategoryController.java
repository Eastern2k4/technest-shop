package com.example.ecommerce.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.ecommerce.dto.CategoryDTO;
import com.example.ecommerce.service.CategoryService;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryDTO> list() {
        return categoryService.list();
    }

    @GetMapping("/{id}")
    public CategoryDTO get(@PathVariable Long id) {
        return categoryService.get(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDTO create(@RequestBody @Valid CategoryDTO dto) {
        return categoryService.create(dto);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PutMapping("/{id}")
    public CategoryDTO update(@PathVariable Long id, @RequestBody @Valid CategoryDTO dto) {
        return categoryService.update(id, dto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        categoryService.delete(id);
    }
}
