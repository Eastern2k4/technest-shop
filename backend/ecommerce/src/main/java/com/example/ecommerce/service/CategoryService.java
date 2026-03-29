package com.example.ecommerce.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.CategoryDTO;
import com.example.ecommerce.model.Category;
import com.example.ecommerce.repository.CategoryRepository;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryDTO> list() {
        return categoryRepository.findAll(Sort.by("name").ascending()).stream()
                .map(this::toDto)
                .toList();
    }

    public CategoryDTO get(Long id) {
        return toDto(loadCategory(id));
    }

    @Transactional
    public CategoryDTO create(CategoryDTO dto) {
        String name = requireName(dto.name());

        categoryRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists: " + name);
        });

        Category category = new Category();
        category.setName(name);
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryDTO dto) {
        Category category = loadCategory(id);
        String name = requireName(dto.name());

        categoryRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists: " + name);
            }
        });

        category.setName(name);
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private Category loadCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found: " + id));
    }

    private CategoryDTO toDto(Category category) {
        return new CategoryDTO(category.getId(), category.getName());
    }

    private String requireName(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required");
        }
        return value.trim();
    }
}
