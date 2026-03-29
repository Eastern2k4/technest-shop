package com.example.ecommerce.service;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.ProductDTO;
import com.example.ecommerce.mapper.ProductMapper;
import com.example.ecommerce.model.Category;
import com.example.ecommerce.product.Product;
import com.example.ecommerce.product.ProductRepository;
import com.example.ecommerce.repository.CategoryRepository;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepo, CategoryRepository categoryRepository) {
        this.productRepo = productRepo;
        this.categoryRepository = categoryRepository;
    }

    public record ProductListRequest(
            Long categoryId,
            String cat,
            String q,
            String minPrice,
            String maxPrice,
            String brand) {
    }

    public List<ProductDTO> list(ProductListRequest request, Pageable pageable) {
        Long categoryId = resolveCategoryId(request.categoryId(), request.cat());
        if (request.cat() != null && !request.cat().isBlank() && !"all".equalsIgnoreCase(request.cat()) && categoryId == null) {
            return List.of();
        }

        Page<Product> productPage = list(
                categoryId,
                request.q(),
                parsePrice(request.minPrice()),
                parsePrice(request.maxPrice()),
                request.brand(),
                pageable);

        return toProductDtos(productPage.getContent());
    }

    public ProductDTO getDetails(Long id) {
        return toProductDto(get(id));
    }

    public ProductDTO create(ProductDTO dto) {
        Product product = new Product();
        applyDto(product, dto);
        return toProductDto(create(product));
    }

    public ProductDTO update(Long id, ProductDTO dto) {
        Product product = get(id);
        applyDto(product, dto);
        return toProductDto(update(product));
    }

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

    public Product get(Long id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
    }

    public Product create(Product p) {
        validate(p);
        p.setId(null);
        return productRepo.save(p);
    }

    public Product update(Product p) {
        if (p.getId() == null || !productRepo.existsById(p.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + p.getId());
        }
        validate(p);
        return productRepo.save(p);
    }

    public void delete(Long id) {
        if (!productRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id);
        }
        productRepo.deleteById(id);
    }

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
    }

    private Long resolveCategoryId(Long categoryId, String cat) {
        if (cat == null || cat.isBlank()) {
            return categoryId;
        }
        if ("all".equalsIgnoreCase(cat)) {
            return null;
        }

        Long resolved = categoryRepository.findByNameIgnoreCase(cat)
                .map(Category::getId)
                .orElse(null);
        if (resolved != null) {
            return resolved;
        }

        if (cat.length() > 0) {
            String[] variations = {
                    cat.length() > 1 ? cat.substring(0, 1).toUpperCase() + cat.substring(1).toLowerCase() : cat.toUpperCase(),
                    cat.toLowerCase(),
                    cat.toUpperCase()
            };
            for (String variation : variations) {
                resolved = categoryRepository.findByNameIgnoreCase(variation)
                        .map(Category::getId)
                        .orElse(null);
                if (resolved != null) {
                    return resolved;
                }
            }
        }

        String mappedName = mapCategoryAlias(cat);
        if (mappedName == null) {
            return null;
        }

        return categoryRepository.findByNameIgnoreCase(mappedName)
                .map(Category::getId)
                .orElse(null);
    }

    private String mapCategoryAlias(String value) {
        String normalizedCat = value == null ? null : value.trim().toLowerCase(Locale.ROOT);
        if (normalizedCat == null || normalizedCat.isEmpty()) {
            return null;
        }
        if (normalizedCat.equals("phone") || normalizedCat.equals("phones")
                || normalizedCat.equals("smartphone") || normalizedCat.equals("smartphones")) {
            return "Phone";
        }
        if (normalizedCat.equals("laptop") || normalizedCat.equals("laptops")
                || normalizedCat.equals("notebook") || normalizedCat.equals("notebooks")) {
            return "Laptop";
        }
        if (normalizedCat.equals("screen") || normalizedCat.equals("screens")
                || normalizedCat.equals("monitor") || normalizedCat.equals("monitors")) {
            return "Screen";
        }
        if (normalizedCat.equals("headphone") || normalizedCat.equals("headphones")
                || normalizedCat.equals("earphone") || normalizedCat.equals("earphones")) {
            return "Headphone";
        }
        if (normalizedCat.equals("accessories") || normalizedCat.equals("accessory")) {
            return "Accessories";
        }
        return null;
    }

    private BigDecimal parsePrice(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }
        try {
            return new BigDecimal(normalized);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private List<ProductDTO> toProductDtos(List<Product> products) {
        Map<Long, String> categoryMap = loadCategoryMap(products);
        return products.stream()
                .map(product -> mapProduct(product, categoryMap))
                .toList();
    }

    private ProductDTO toProductDto(Product product) {
        return mapProduct(product, loadCategoryMap(List.of(product)));
    }

    private Map<Long, String> loadCategoryMap(List<Product> products) {
        return categoryRepository.findAllByIdIn(products.stream()
                .map(Product::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new))).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));
    }

    private ProductDTO mapProduct(Product product, Map<Long, String> categoryMap) {
        String categoryName = product.getCategoryId() != null
                ? categoryMap.getOrDefault(product.getCategoryId(), "")
                : "";
        return ProductMapper.toDTO(product, categoryName);
    }

    private void applyDto(Product product, ProductDTO dto) {
        product.setName(dto.name());
        product.setBrand(dto.brand());
        product.setPrice(dto.price());
        product.setImageUrl(dto.imageUrl());
        product.setCategoryId(dto.categoryId());
        product.setQuantity(dto.quantity());
        product.setDescriptionShort(dto.descriptionShort());
        product.setDescriptionLong(dto.descriptionLong());
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
