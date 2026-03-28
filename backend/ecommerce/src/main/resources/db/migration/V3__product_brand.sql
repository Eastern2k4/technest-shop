ALTER TABLE product
    ADD COLUMN brand VARCHAR(120) NULL AFTER name;

UPDATE product
SET brand = CASE
    WHEN LOWER(name) LIKE '%iphone%'
        OR LOWER(name) LIKE '%ipad%'
        OR LOWER(name) LIKE '%macbook%'
        OR LOWER(name) LIKE '%airpods%'
        OR LOWER(name) LIKE '%apple watch%'
        OR LOWER(name) LIKE '%imac%'
        OR LOWER(name) LIKE '%mac mini%'
        OR LOWER(name) LIKE '%mac pro%' THEN 'Apple'
    WHEN LOWER(name) LIKE '%samsung%'
        OR LOWER(name) LIKE '%galaxy%' THEN 'Samsung'
    WHEN LOWER(name) LIKE '%xiaomi%'
        OR LOWER(name) LIKE '%redmi%' THEN 'Xiaomi'
    WHEN LOWER(name) LIKE '%oppo%' THEN 'Oppo'
    WHEN LOWER(name) LIKE '%vivo%' THEN 'Vivo'
    WHEN LOWER(name) LIKE '%realme%' THEN 'Realme'
    WHEN LOWER(name) LIKE '%huawei%' THEN 'Huawei'
    WHEN LOWER(name) LIKE '%sony%' THEN 'Sony'
    WHEN LOWER(name) LIKE '%lg%' THEN 'LG'
    WHEN LOWER(name) LIKE '%asus%'
        OR LOWER(name) LIKE '%rog%'
        OR LOWER(name) LIKE '%tuf%' THEN 'Asus'
    WHEN LOWER(name) LIKE '%acer%' THEN 'Acer'
    WHEN LOWER(name) LIKE '%dell%' THEN 'Dell'
    WHEN LOWER(name) LIKE '%hp%' THEN 'HP'
    WHEN LOWER(name) LIKE '%lenovo%'
        OR LOWER(name) LIKE '%thinkpad%' THEN 'Lenovo'
    WHEN LOWER(name) LIKE '%msi%' THEN 'MSI'
    WHEN LOWER(name) LIKE '%razer%' THEN 'Razer'
    WHEN LOWER(name) LIKE '%logitech%' THEN 'Logitech'
    WHEN LOWER(name) LIKE '%jbl%' THEN 'JBL'
    WHEN LOWER(name) LIKE '%bose%' THEN 'Bose'
    ELSE brand
END
WHERE brand IS NULL OR TRIM(brand) = '';

CREATE INDEX idx_product_brand ON product (brand);
CREATE INDEX idx_product_category_brand_price ON product (category_id, brand, price);
