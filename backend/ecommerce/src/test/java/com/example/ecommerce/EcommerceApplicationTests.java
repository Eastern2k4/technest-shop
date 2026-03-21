package com.example.ecommerce;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.OrderItem;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.product.Product;
import com.example.ecommerce.product.ProductRepository;
import com.example.ecommerce.review.Review;
import com.example.ecommerce.review.ReviewReplyRepository;
import com.example.ecommerce.review.ReviewRepository;
import com.example.ecommerce.security.JwtService;
import com.example.ecommerce.user.Role;
import com.example.ecommerce.user.RoleRepository;
import com.example.ecommerce.user.User;
import com.example.ecommerce.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class EcommerceApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private OrderRepository orderRepository;

	@Autowired
	private ReviewRepository reviewRepository;

	@Autowired
	private ReviewReplyRepository reviewReplyRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtService jwtService;

	private Role customerRole;
	private Role staffRole;
	private Role adminRole;

	@BeforeEach
	void setUp() {
		reviewReplyRepository.deleteAll();
		reviewRepository.deleteAll();
		orderRepository.deleteAll();
		productRepository.deleteAll();
		userRepository.deleteAll();
		roleRepository.deleteAll();

		customerRole = createRole("customer");
		staffRole = createRole("staff");
		adminRole = createRole("admin");
	}

	@Test
	void contextLoads() {
	}

	@Test
	void registerThenMeReturnsCustomerProfile() throws Exception {
		String body = objectMapper.writeValueAsString(Map.of(
				"email", "customer1@example.com",
				"password", "secret123",
				"fullName", "Customer One"));

		String token = objectMapper.readTree(
				mockMvc.perform(post("/api/auth/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
						.andExpect(status().isOk())
						.andExpect(jsonPath("$.token").exists())
						.andReturn()
						.getResponse()
						.getContentAsString())
				.get("token")
				.asText();

		mockMvc.perform(get("/api/auth/me")
				.header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email", is("customer1@example.com")))
				.andExpect(jsonPath("$.fullName", is("Customer One")))
				.andExpect(jsonPath("$.role", is("customer")));
	}

	@Test
	void createOrderReducesStock() throws Exception {
		User customer = createUser("buyer@example.com", customerRole);
		Product product = createProduct("Mechanical Keyboard", 5, "1200000");

		String body = objectMapper.writeValueAsString(Map.of(
				"items", List.of(Map.of("id", product.getId(), "qty", 2)),
				"address", List.of("Buyer", "0909", "123 Street", "Da Nang", "Hai Chau"),
				"payment", "cod"));

		mockMvc.perform(post("/api/orders")
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(body))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status", is("PENDING")))
				.andExpect(jsonPath("$.paymentStatus", is("UNPAID")))
				.andExpect(jsonPath("$.items[0].qty", is(2)));

		Product updated = productRepository.findById(product.getId()).orElseThrow();
		org.junit.jupiter.api.Assertions.assertEquals(3, updated.getQuantity());
	}

	@Test
	void createOrderFailsWhenStockIsInsufficient() throws Exception {
		User customer = createUser("nostock@example.com", customerRole);
		Product product = createProduct("Gaming Mouse", 1, "500000");

		String body = objectMapper.writeValueAsString(Map.of(
				"items", List.of(Map.of("id", product.getId(), "qty", 2)),
				"address", List.of("Buyer", "0909", "123 Street", "Da Nang", "Hai Chau"),
				"payment", "cod"));

		mockMvc.perform(post("/api/orders")
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(body))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Insufficient stock for product: Gaming Mouse")));

		Product unchanged = productRepository.findById(product.getId()).orElseThrow();
		org.junit.jupiter.api.Assertions.assertEquals(1, unchanged.getQuantity());
	}

	@Test
	void customerCanMarkOwnShippingOrderAsDelivered() throws Exception {
		User customer = createUser("delivered@example.com", customerRole);
		Product product = createProduct("Monitor", 10, "3000000");
		Order order = createOrder(customer, product, 1, Order.OrderStatus.SHIPPING, Order.PaymentStatus.PAID);

		String body = objectMapper.writeValueAsString(Map.of("status", "DELIVERED"));

		mockMvc.perform(put("/api/orders/{id}/status", order.getId())
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(body))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("DELIVERED")))
				.andExpect(jsonPath("$.paymentStatus", is("PAID")));
	}

	@Test
	void staffCanUpdateShippingAndPaymentStatus() throws Exception {
		User customer = createUser("owner@example.com", customerRole);
		User staff = createUser("staff1@example.com", staffRole);
		Product product = createProduct("Laptop", 8, "22000000");
		Order order = createOrder(customer, product, 1, Order.OrderStatus.PENDING, Order.PaymentStatus.UNPAID);

		mockMvc.perform(put("/api/orders/{id}/status", order.getId())
				.header("Authorization", bearer(tokenFor(staff)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("status", "SHIPPING"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("SHIPPING")));

		mockMvc.perform(put("/api/orders/{id}/status", order.getId())
				.header("Authorization", bearer(tokenFor(staff)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("paymentStatus", "PAID"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.paymentStatus", is("PAID")));
	}

	@Test
	void replyingTwiceUpdatesExistingReplyInsteadOfDuplicating() throws Exception {
		User customer = createUser("reviewer@example.com", customerRole);
		User staff = createUser("staff-review@example.com", staffRole);
		Product product = createProduct("Tablet", 4, "9000000");

		Review review = new Review();
		review.setProductId(product.getId());
		review.setUserId(customer.getId());
		review.setRating(5);
		review.setTitle("Great");
		review.setBody("Works well");
		review.setIsApproved(true);
		review = reviewRepository.save(review);

		mockMvc.perform(post("/api/reviews/{reviewId}/reply", review.getId())
				.header("Authorization", bearer(tokenFor(staff)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("body", "First reply"))))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/reviews/{reviewId}/reply", review.getId())
				.header("Authorization", bearer(tokenFor(staff)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("body", "Updated reply"))))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/reviews/product/{productId}", product.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].reply.body", is("Updated reply")));

		mockMvc.perform(get("/api/reviews/pending-count")
				.header("Authorization", bearer(tokenFor(staff))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pendingReplies", is(0)));

		org.junit.jupiter.api.Assertions.assertEquals(1, reviewReplyRepository.count());
	}

	@Test
	void adminCanDeleteUserWhoAlreadyHasOrders() throws Exception {
		User admin = createUser("admin-delete@example.com", adminRole);
		User customer = createUser("customer-delete@example.com", customerRole);
		Product product = createProduct("SSD", 12, "1500000");
		createOrder(customer, product, 2, Order.OrderStatus.PENDING, Order.PaymentStatus.UNPAID);

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
				.delete("/api/admin/users/{id}", customer.getId())
				.header("Authorization", bearer(tokenFor(admin))))
				.andExpect(status().isNoContent());

		org.junit.jupiter.api.Assertions.assertFalse(userRepository.existsById(customer.getId()));
		org.junit.jupiter.api.Assertions.assertTrue(orderRepository.findByUserIdOrderByPlacedAtDesc(customer.getId()).isEmpty());
	}

	private Role createRole(String name) {
		Role role = new Role();
		role.setName(name);
		return roleRepository.save(role);
	}

	private User createUser(String email, Role role) {
		User user = new User();
		user.setEmail(email);
		user.setUserNameColumn(email);
		user.setPassword(passwordEncoder.encode("secret123"));
		user.setFullName(email);
		user.setRole(role);
		return userRepository.save(user);
	}

	private Product createProduct(String name, int quantity, String price) {
		Product product = new Product();
		product.setName(name);
		product.setQuantity(quantity);
		product.setPrice(new BigDecimal(price));
		product.setImageUrl("https://example.com/product.png");
		product.setDescriptionShort(name);
		product.setDescriptionLong(name + " details");
		return productRepository.save(product);
	}

	private Order createOrder(User user, Product product, int quantity, Order.OrderStatus status,
			Order.PaymentStatus paymentStatus) {
		Order order = new Order();
		order.setUser(user);
		order.setStatus(status);
		order.setPaymentStatus(paymentStatus);
		order.setPaymentMethod("cod");
		order.setShippingAddressText("123 Street");
		order.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
		order.setShippingFee(new BigDecimal("30000"));
		order.setGrandTotal(order.getSubtotal().add(order.getShippingFee()));

		OrderItem item = new OrderItem();
		item.setOrder(order);
		item.setProduct(product);
		item.setNameSnapshot(product.getName());
		item.setUnitPrice(product.getPrice());
		item.setQuantity(quantity);
		item.setLineTotal(product.getPrice().multiply(BigDecimal.valueOf(quantity)));

		order.setItems(new java.util.ArrayList<>(List.of(item)));
		return orderRepository.save(order);
	}

	private String tokenFor(User user) {
		return jwtService.generate(user, 3600);
	}

	private String bearer(String token) {
		return "Bearer " + token;
	}

}
