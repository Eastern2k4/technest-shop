package com.example.ecommerce.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    @EntityGraph(attributePaths = { "role" })
    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = { "role" })
    Optional<User> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = { "role" })
    List<User> findAllByOrderByIdAsc();

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);
    // Optional<User> findByUsername(String username); // nếu sau này cần
}
