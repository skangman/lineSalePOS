-- ปรับเงื่อนไขแพ็คเกจ Free/Pro ตามที่ธุรกิจต้องการ
UPDATE plans SET max_products = 10, max_orders_per_day = 25 WHERE slug = 'free';
UPDATE plans SET max_products = 30, max_orders_per_day = 99 WHERE slug = 'pro';
