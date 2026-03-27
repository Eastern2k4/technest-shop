package com.example.ecommerce.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Sort;
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
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.CategoryDTO;
import com.example.ecommerce.model.Category;
import com.example.ecommerce.repository.CategoryRepository;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepo;

    // 👇 Constructor thủ công – loại bỏ lỗi “variable ... not initialized”
    public CategoryController(CategoryRepository categoryRepo) {
        this.categoryRepo = categoryRepo;
    }

    @GetMapping
    public List<CategoryDTO> list() {
        return categoryRepo.findAll(Sort.by("name").ascending())
                .stream()
                .map(c -> new CategoryDTO(c.getId(), c.getName()))
                .toList();
    }

    @GetMapping("/{id}")
    public CategoryDTO get(@PathVariable Long id) {
        Category c = categoryRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found: " + id));
        return new CategoryDTO(c.getId(), c.getName());
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDTO create(@RequestBody @Valid CategoryDTO dto) {
        String name = safeName(dto.name());
        categoryRepo.findByNameIgnoreCase(name).ifPresent(x -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists: " + name);
        });
        Category c = new Category();
        c.setName(name);
        c = categoryRepo.save(c);
        return new CategoryDTO(c.getId(), c.getName());
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PutMapping("/{id}")
    public CategoryDTO update(@PathVariable Long id, @RequestBody @Valid CategoryDTO dto) {
        Category c = categoryRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found: " + id));

        String name = safeName(dto.name());
        categoryRepo.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists: " + name);
            }
        });

        c.setName(name);
        c = categoryRepo.save(c);
        return new CategoryDTO(c.getId(), c.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!categoryRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found: " + id);
        }
        categoryRepo.deleteById(id);
    }

    private String safeName(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required");
        }
        return name.trim();
    }
}
