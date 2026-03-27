package com.example.ecommerce;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.ecommerce.dto.OrderDtos.OrderItemRequest;
import com.example.ecommerce.dto.OrderDtos.OrderRequest;
import com.example.ecommerce.order.Order;
import com.example.ecommerce.order.OrderItem;
import com.example.ecommerce.order.OrderRepository;
import com.example.ecommerce.product.Product;
import com.example.ecommerce.product.ProductRepository;
import com.example.ecommerce.review.Review;
import com.example.ecommerce.review.ReviewReplyRepository;
import com.example.ecommerce.review.ReviewRepository;
import com.example.ecommerce.security.JwtService;
import com.example.ecommerce.service.AuthRateLimitService;
import com.example.ecommerce.service.OrderService;
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

	@Autowired
	private OrderService orderService;

	@Autowired
	private AuthRateLimitService authRateLimitService;

	private Role customerRole;
	private Role staffRole;
	private Role adminRole;

	@BeforeEach
	void setUp() {
		authRateLimitService.clear();
		reviewReplyRepository.deleteAllInBatch();
		reviewRepository.deleteAllInBatch();
		orderRepository.deleteAll(orderRepository.findAll());
		orderRepository.flush();
		productRepository.deleteAllInBatch();
		userRepository.deleteAllInBatch();
		roleRepository.deleteAllInBatch();
		roleRepository.flush();

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
	void authNormalizesEmailCaseAcrossRegisterAndLogin() throws Exception {
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"email", "CustomerCaps@Example.COM",
						"password", "secret123",
						"fullName", "Customer Caps"))))
				.andExpect(status().isOk());

		String loginBody = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"email", "CUSTOMERCAPS@example.com",
						"password", "secret123"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").exists())
				.andReturn()
				.getResponse()
				.getContentAsString();

		String token = objectMapper.readTree(loginBody).get("token").asText();

		mockMvc.perform(get("/api/auth/me")
				.header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email", is("customercaps@example.com")))
				.andExpect(jsonPath("$.fullName", is("Customer Caps")));
	}

	@Test
	void loginRateLimitingBlocksRepeatedInvalidAttempts() throws Exception {
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"email", "ratelimit@example.com",
						"password", "secret123",
						"fullName", "Rate Limited User"))))
				.andExpect(status().isOk());

		for (int i = 0; i < 2; i++) {
			mockMvc.perform(post("/api/auth/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(Map.of(
							"email", "ratelimit@example.com",
							"password", "wrong-password"))))
					.andExpect(status().isUnauthorized())
					.andExpect(jsonPath("$.message", is("Invalid email or password")));
		}

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"email", "ratelimit@example.com",
						"password", "wrong-password"))))
				.andExpect(status().isTooManyRequests())
				.andExpect(jsonPath("$.message", is("Too many login attempts. Please try again later.")))
				.andExpect(jsonPath("$.status", is(429)))
				.andExpect(jsonPath("$.error", is("Too Many Requests")));
	}

	@Test
	void registerRejectsInvalidPayloadWithStructuredValidationErrors() throws Exception {
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"email", "not-an-email",
						"password", "123",
						"fullName", ""))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.validationErrors.email", is("Email must be a valid email address")))
				.andExpect(jsonPath("$.validationErrors.password", is("Password must be between 6 and 100 characters")))
				.andExpect(jsonPath("$.validationErrors.fullName", is("Full name is required")));
	}

	@Test
	void adminCanCreateListAndUpdateUsersThroughTypedContract() throws Exception {
		User admin = createUser("admin-users@example.com", adminRole);

		String createdBody = mockMvc.perform(post("/api/admin/users")
				.header("Authorization", bearer(tokenFor(admin)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"email", "Managed-User@Example.com",
						"username", "managed-user",
						"password", "secret123",
						"fullName", "Managed User",
						"phone", "0911222333",
						"addressText", "1 Admin Street",
						"role", "staff"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.email", is("managed-user@example.com")))
				.andExpect(jsonPath("$.username", is("managed-user")))
				.andExpect(jsonPath("$.role", is("STAFF")))
				.andReturn()
				.getResponse()
				.getContentAsString();

		Long createdUserId = objectMapper.readTree(createdBody).get("id").asLong();

		mockMvc.perform(get("/api/admin/users")
				.header("Authorization", bearer(tokenFor(admin))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.id==" + createdUserId + ")].email")
						.value(org.hamcrest.Matchers.hasItem("managed-user@example.com")));

		mockMvc.perform(put("/api/admin/users/{id}", createdUserId)
				.header("Authorization", bearer(tokenFor(admin)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"fullName", "Managed User Updated",
						"phone", "0988777666",
						"role", "customer"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.fullName", is("Managed User Updated")))
				.andExpect(jsonPath("$.phone", is("0988777666")))
				.andExpect(jsonPath("$.role", is("CUSTOMER")));
	}

	@Test
	void customerCannotAccessAdminUsersEndpoint() throws Exception {
		User customer = createUser("customer-no-admin@example.com", customerRole);

		mockMvc.perform(get("/api/admin/users")
				.header("Authorization", bearer(tokenFor(customer))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")))
				.andExpect(jsonPath("$.status", is(403)))
				.andExpect(jsonPath("$.error", is("Forbidden")));
	}

	@Test
	void unauthenticatedOrdersEndpointReturnsStructuredUnauthorizedResponse() throws Exception {
		mockMvc.perform(get("/api/orders/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", is("Authentication required. Please log in again.")))
				.andExpect(jsonPath("$.status", is(401)))
				.andExpect(jsonPath("$.error", is("Unauthorized")))
				.andExpect(header().string("X-Content-Type-Options", "nosniff"))
				.andExpect(header().string("Referrer-Policy", "no-referrer"))
				.andExpect(header().string("Permissions-Policy", containsString("camera=()")))
				.andExpect(header().string("Cache-Control", containsString("no-store")));
	}

	@Test
	void authenticatedUserCanUpdateProfile() throws Exception {
		User customer = createUser("profile@example.com", customerRole);

		mockMvc.perform(put("/api/auth/me")
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"fullName", "Updated Name",
						"username", "updated-profile",
						"phone", "0909123456",
						"addressText", "123 Updated Street",
						"avatarUrl", "https://example.com/avatar.png",
						"newPassword", "newsecret123"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.fullName", is("Updated Name")))
				.andExpect(jsonPath("$.username", is("updated-profile")))
				.andExpect(jsonPath("$.phone", is("0909123456")))
				.andExpect(jsonPath("$.addressText", is("123 Updated Street")))
				.andExpect(jsonPath("$.avatarUrl", is("https://example.com/avatar.png")))
				.andExpect(jsonPath("$.message", is("Profile updated successfully")));

		User updated = userRepository.findById(customer.getId()).orElseThrow();
		org.junit.jupiter.api.Assertions.assertEquals("updated-profile", updated.getUserNameColumn());
		org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches("newsecret123", updated.getPassword()));
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
	void productSearchAppliesBrandAndPriceFiltersAtApiLevel() throws Exception {
		createProduct("MacBook Air M3", 3, "25000000");
		createProduct("Dell Inspiron", 4, "18000000");
		createProduct("iPhone 15", 5, "30000000");

		mockMvc.perform(get("/api/products")
				.param("brand", "apple")
				.param("minPrice", "24000000")
				.param("maxPrice", "26000000"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()", is(1)))
				.andExpect(jsonPath("$[0].name", is("MacBook Air M3")));
	}

	@Test
	void adminProductCreateRejectsInvalidPayloadWithValidationErrors() throws Exception {
		User admin = createUser("admin-product-validation@example.com", adminRole);

		mockMvc.perform(post("/api/products")
				.header("Authorization", bearer(tokenFor(admin)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"name", "",
						"price", -1,
						"quantity", -5))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.validationErrors.name", is("Product name is required")))
				.andExpect(jsonPath("$.validationErrors.price", is("Price must be greater than or equal to 0")))
				.andExpect(jsonPath("$.validationErrors.quantity", is("Quantity must be greater than or equal to 0")));
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
	@Transactional(propagation = Propagation.NOT_SUPPORTED)
	void concurrentOrderCreationAllowsOnlyOneSuccessForLastItem() throws Exception {
		User customerOne = createUser("concurrent-one@example.com", customerRole);
		User customerTwo = createUser("concurrent-two@example.com", customerRole);
		Product product = createProduct("Concurrent Product", 1, "750000");
		OrderRequest request = new OrderRequest(
				List.of(new OrderItemRequest(product.getId(), 1)),
				List.of("Buyer", "0909", "123 Street", "Da Nang", "Hai Chau"),
				"cod");

		ExecutorService executor = Executors.newFixedThreadPool(2);
		CountDownLatch ready = new CountDownLatch(2);
		CountDownLatch start = new CountDownLatch(1);

		Callable<String> placeOrder = () -> {
			ready.countDown();
			start.await(5, TimeUnit.SECONDS);
			try {
				orderService.createOrder(Thread.currentThread().getName().contains("1") ? customerOne : customerTwo, request);
				return "SUCCESS";
			} catch (ResponseStatusException ex) {
				return ex.getStatusCode().value() + ":" + ex.getReason();
			}
		};

		Future<String> first = executor.submit(() -> {
			Thread.currentThread().setName("order-thread-1");
			return placeOrder.call();
		});
		Future<String> second = executor.submit(() -> {
			Thread.currentThread().setName("order-thread-2");
			return placeOrder.call();
		});

		ready.await(5, TimeUnit.SECONDS);
		start.countDown();

		String firstResult = first.get(10, TimeUnit.SECONDS);
		String secondResult = second.get(10, TimeUnit.SECONDS);
		executor.shutdownNow();

		long successCount = List.of(firstResult, secondResult).stream().filter("SUCCESS"::equals).count();
		long failureCount = List.of(firstResult, secondResult).stream()
				.filter(result -> result.startsWith("400:Insufficient stock"))
				.count();

		org.junit.jupiter.api.Assertions.assertEquals(1, successCount);
		org.junit.jupiter.api.Assertions.assertEquals(1, failureCount);
		org.junit.jupiter.api.Assertions.assertEquals(1, orderRepository.count());
		org.junit.jupiter.api.Assertions.assertEquals(0,
				productRepository.findById(product.getId()).orElseThrow().getQuantity());
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
	void customerCannotReviewProductWithoutDeliveredPaidOrder() throws Exception {
		User customer = createUser("review-forbidden@example.com", customerRole);
		Product product = createProduct("Unreviewable Product", 4, "1500000");

		mockMvc.perform(post("/api/reviews/product/{productId}", product.getId())
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"rating", 5,
						"title", "Nice",
						"body", "I want to review this"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("Only delivered and paid orders can be reviewed")))
				.andExpect(jsonPath("$.status", is(403)))
				.andExpect(jsonPath("$.error", is("Forbidden")));
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
				.andExpect(jsonPath("$.pendingReviews", is(0)));

		org.junit.jupiter.api.Assertions.assertEquals(1, reviewReplyRepository.count());
	}

	@Test
	void newReviewsStayPendingAndHiddenUntilApproved() throws Exception {
		User customer = createUser("review-pending@example.com", customerRole);
		User staff = createUser("review-pending-staff@example.com", staffRole);
		Product product = createProduct("Pending Review Product", 5, "1800000");
		createOrder(customer, product, 1, Order.OrderStatus.DELIVERED, Order.PaymentStatus.PAID);

		mockMvc.perform(post("/api/reviews/product/{productId}", product.getId())
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"rating", 4,
						"title", "Pending title",
						"body", "This review should wait for moderation"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message", is("Review submitted successfully and is pending approval.")));

		mockMvc.perform(get("/api/reviews/product/{productId}", product.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()", is(0)));

		mockMvc.perform(get("/api/reviews/pending-count")
				.header("Authorization", bearer(tokenFor(staff))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pendingReviews", is(1)));

		mockMvc.perform(get("/api/reviews/pending-by-product")
				.header("Authorization", bearer(tokenFor(staff))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].productId", is(product.getId().intValue())))
				.andExpect(jsonPath("$[0].pendingReviews", is(1)));

		mockMvc.perform(get("/api/reviews/manage/product/{productId}", product.getId())
				.header("Authorization", bearer(tokenFor(staff))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()", is(1)))
				.andExpect(jsonPath("$[0].isApproved", is(false)));
	}

	@Test
	void staffCannotReplyToPendingReview() throws Exception {
		User customer = createUser("review-no-reply-pending@example.com", customerRole);
		User staff = createUser("review-no-reply-pending-staff@example.com", staffRole);
		Product product = createProduct("Pending Reply Product", 4, "2100000");
		createOrder(customer, product, 1, Order.OrderStatus.DELIVERED, Order.PaymentStatus.PAID);

		String responseBody = mockMvc.perform(post("/api/reviews/product/{productId}", product.getId())
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"rating", 5,
						"title", "Pending review",
						"body", "Reply should be blocked until approval"))))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		Long reviewId = objectMapper.readTree(responseBody).get("id").asLong();

		mockMvc.perform(post("/api/reviews/{reviewId}/reply", reviewId)
				.header("Authorization", bearer(tokenFor(staff)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("body", "Cannot reply yet"))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Review must be approved before replying")))
				.andExpect(jsonPath("$.status", is(400)))
				.andExpect(jsonPath("$.error", is("Bad Request")));
	}

	@Test
	void staffCanApprovePendingReviewAndMakeItPublic() throws Exception {
		User customer = createUser("review-approve@example.com", customerRole);
		User staff = createUser("review-approve-staff@example.com", staffRole);
		Product product = createProduct("Approval Product", 6, "2400000");
		createOrder(customer, product, 1, Order.OrderStatus.DELIVERED, Order.PaymentStatus.PAID);

		String responseBody = mockMvc.perform(post("/api/reviews/product/{productId}", product.getId())
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"rating", 5,
						"title", "Need approval",
						"body", "Approve this review"))))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		Long reviewId = objectMapper.readTree(responseBody).get("id").asLong();

		mockMvc.perform(put("/api/reviews/{reviewId}/moderation", reviewId)
				.header("Authorization", bearer(tokenFor(staff)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("approved", true))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message", is("Review approved successfully")));

		mockMvc.perform(get("/api/reviews/product/{productId}", product.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()", is(1)))
				.andExpect(jsonPath("$[0].id", is(reviewId.intValue())))
				.andExpect(jsonPath("$[0].isApproved", is(true)))
				.andExpect(jsonPath("$[0].title", is("Need approval")));

		mockMvc.perform(get("/api/reviews/pending-count")
				.header("Authorization", bearer(tokenFor(staff))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pendingReviews", is(0)));
	}

	@Test
	void staffCanDeletePendingReview() throws Exception {
		User customer = createUser("review-delete@example.com", customerRole);
		User staff = createUser("review-delete-staff@example.com", staffRole);
		Product product = createProduct("Delete Review Product", 3, "990000");
		createOrder(customer, product, 1, Order.OrderStatus.DELIVERED, Order.PaymentStatus.PAID);

		String responseBody = mockMvc.perform(post("/api/reviews/product/{productId}", product.getId())
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"rating", 3,
						"title", "Delete me",
						"body", "This pending review will be removed"))))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();

		Long reviewId = objectMapper.readTree(responseBody).get("id").asLong();

		mockMvc.perform(delete("/api/reviews/{reviewId}", reviewId)
				.header("Authorization", bearer(tokenFor(staff))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message", is("Review deleted successfully")));

		mockMvc.perform(get("/api/reviews/pending-count")
				.header("Authorization", bearer(tokenFor(staff))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pendingReviews", is(0)));

		mockMvc.perform(get("/api/reviews/manage/product/{productId}", product.getId())
				.header("Authorization", bearer(tokenFor(staff))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()", is(0)));

		org.junit.jupiter.api.Assertions.assertFalse(reviewRepository.existsById(reviewId));
	}

	@Test
	void staffReplyRejectsInvalidPayloadWithValidationErrors() throws Exception {
		User customer = createUser("reviewer-invalid-reply@example.com", customerRole);
		User staff = createUser("staff-invalid-reply@example.com", staffRole);
		Product product = createProduct("Reply Validation Product", 2, "1300000");

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
				.content(objectMapper.writeValueAsString(Map.of("body", ""))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.validationErrors.body", is("Reply body is required")));
	}

	@Test
	void customerCannotReplyToReview() throws Exception {
		User reviewer = createUser("reviewer-no-reply@example.com", customerRole);
		User customer = createUser("customer-no-reply@example.com", customerRole);
		Product product = createProduct("Reply Locked Product", 2, "900000");

		Review review = new Review();
		review.setProductId(product.getId());
		review.setUserId(reviewer.getId());
		review.setRating(5);
		review.setTitle("Great");
		review.setBody("Works well");
		review.setIsApproved(true);
		review = reviewRepository.save(review);

		mockMvc.perform(post("/api/reviews/{reviewId}/reply", review.getId())
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("body", "I should not be allowed"))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", is("You do not have permission to perform this action.")))
				.andExpect(jsonPath("$.status", is(403)))
				.andExpect(jsonPath("$.error", is("Forbidden")));
	}

	@Test
	void adminCategoryCreateRejectsBlankName() throws Exception {
		User admin = createUser("admin-category-validation@example.com", adminRole);

		mockMvc.perform(post("/api/categories")
				.header("Authorization", bearer(tokenFor(admin)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("name", ""))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.validationErrors.name", is("Category name is required")));
	}

	@Test
	void reviewCreationRejectsInvalidPayloadWithValidationErrors() throws Exception {
		User customer = createUser("review-invalid@example.com", customerRole);
		Product product = createProduct("Reviewable Product", 3, "1200000");
		createOrder(customer, product, 1, Order.OrderStatus.DELIVERED, Order.PaymentStatus.PAID);

		mockMvc.perform(post("/api/reviews/product/{productId}", product.getId())
				.header("Authorization", bearer(tokenFor(customer)))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of(
						"rating", 6,
						"title", "Bad payload",
						"body", ""))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", is("Validation failed")))
				.andExpect(jsonPath("$.validationErrors.rating", is("Rating must be between 1 and 5")))
				.andExpect(jsonPath("$.validationErrors.body", is("Review body is required")));
	}

	@Test
	void actuatorHealthEndpointRemainsPublic() throws Exception {
		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status", is("UP")));
	}

	@Test
	void adminCanDeleteUserWhoAlreadyHasOrders() throws Exception {
		User admin = createUser("admin-delete@example.com", adminRole);
		User customer = createUser("customer-delete@example.com", customerRole);
		Product product = createProduct("SSD", 12, "1500000");
		createOrder(customer, product, 2, Order.OrderStatus.PENDING, Order.PaymentStatus.UNPAID);

		mockMvc.perform(delete("/api/admin/users/{id}", customer.getId())
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
