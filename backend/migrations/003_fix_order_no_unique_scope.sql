-- order_no/receipt_no รันเลขใหม่แยกตามร้าน+วัน (เริ่ม 0001 ทุกร้านทุกวัน) แต่ constraint เดิม unique ทั้งระบบ
-- ทำให้ 2 ร้านที่สร้างออเดอร์แรกของวันเดียวกันพร้อมกัน ได้เลขชนกัน ("duplicate key value violates
-- unique constraint orders_order_no_key") แก้ให้ unique แค่ภายในร้านเดียวกันแทน

ALTER TABLE orders DROP CONSTRAINT orders_order_no_key;
ALTER TABLE orders ADD CONSTRAINT orders_shop_id_order_no_key UNIQUE (shop_id, order_no);

ALTER TABLE receipts DROP CONSTRAINT receipts_receipt_no_key;
ALTER TABLE receipts ADD CONSTRAINT receipts_shop_id_receipt_no_key UNIQUE (shop_id, receipt_no);
