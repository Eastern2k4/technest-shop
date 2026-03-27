CREATE INDEX idx_orders_user_placed_at ON orders (user_id, placed_at);
CREATE INDEX idx_orders_status_payment_placed_at ON orders (status, payment_status, placed_at);
CREATE INDEX idx_order_items_order_product ON order_items (order_id, product_id);

CREATE INDEX idx_product_category_price ON product (category_id, price);
CREATE INDEX idx_product_price ON product (price);

CREATE INDEX idx_reviews_product_created_at ON reviews (product_id, created_at);
CREATE INDEX idx_reviews_approved_created_at ON reviews (is_approved, created_at);
