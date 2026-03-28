SET @brand_table_exists = (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'brand'
);

SET @legacy_brand_fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'product'
      AND column_name = 'brand_id'
);

SET @sql = IF(
    @brand_table_exists > 0 AND @legacy_brand_fk_exists > 0,
    'UPDATE product p JOIN brand b ON p.brand_id = b.id SET p.brand = b.name WHERE b.name IS NOT NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
