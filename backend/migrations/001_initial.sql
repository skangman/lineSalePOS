-- LINE Sale POS - Initial Schema
-- ==============================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Plans (subscription tiers)
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_products INT DEFAULT 30,
  max_orders_per_day INT DEFAULT 50,
  max_staff INT DEFAULT 0,
  has_reports BOOLEAN DEFAULT FALSE,
  has_profit_report BOOLEAN DEFAULT FALSE,
  has_stock BOOLEAN DEFAULT FALSE,
  has_daily_summary_line BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (name, slug, price, max_products, max_orders_per_day, max_staff, has_reports, has_profit_report, has_stock, has_daily_summary_line)
VALUES
  ('Free', 'free', 0, 30, 50, 0, FALSE, FALSE, FALSE, FALSE),
  ('Pro', 'pro', 99, -1, -1, 1, TRUE, FALSE, FALSE, FALSE),
  ('Premium', 'premium', 199, -1, -1, -1, TRUE, TRUE, TRUE, TRUE);

-- Users (LINE users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200),
  picture_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shops
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id),
  shop_name VARCHAR(200) NOT NULL,
  owner_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  product_type VARCHAR(100),
  market_area VARCHAR(200),
  logo_url TEXT,
  promptpay_number VARCHAR(20),
  receipt_footer TEXT DEFAULT 'ขอบคุณที่ใช้บริการ',
  voice_enabled BOOLEAN DEFAULT TRUE,
  line_notify_enabled BOOLEAN DEFAULT TRUE,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  service_charge_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  plan_id INT DEFAULT 1 REFERENCES plans(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  plan_id INT NOT NULL REFERENCES plans(id),
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Staff
CREATE TABLE shop_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(20) NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner','manager','cashier')),
  invite_code VARCHAR(20),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(shop_id, user_id)
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  category_id UUID REFERENCES categories(id),
  product_name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  image_url TEXT,
  stock_quantity INT DEFAULT 0,
  is_unlimited_stock BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers (for debt tracking)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  total_debt DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  user_id UUID REFERENCES users(id),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','transfer','promptpay','debt')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid','unpaid','cancelled')),
  cash_received DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(200),
  note TEXT,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_shop_id ON orders(shop_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_no ON orders(order_no);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (additional payment records)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  shop_id UUID NOT NULL REFERENCES shops(id),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(20) NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
  shop_id UUID NOT NULL REFERENCES shops(id),
  receipt_no VARCHAR(50) UNIQUE NOT NULL,
  receipt_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  product_id UUID NOT NULL REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('sale','restock','adjustment','cancel_return')),
  quantity INT NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debts
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINE Messages Log
CREATE TABLE line_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id),
  user_id UUID REFERENCES users(id),
  line_user_id VARCHAR(100),
  message_type VARCHAR(50),
  content TEXT,
  direction VARCHAR(10) DEFAULT 'outbound' CHECK (direction IN ('inbound','outbound')),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES shops(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Settings (extended)
CREATE TABLE shop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID UNIQUE NOT NULL REFERENCES shops(id),
  voice_template_cash TEXT DEFAULT 'รับเงิน {cash_received} บาท ทอน {change} บาทค่ะ',
  voice_template_transfer TEXT DEFAULT 'รับยอดโอน {total} บาทแล้วค่ะ',
  voice_template_promptpay TEXT DEFAULT 'รับยอดโอน {total} บาทแล้วค่ะ',
  voice_template_debt TEXT DEFAULT 'บันทึกรายการค้างจ่าย {total} บาทแล้วค่ะ',
  voice_template_close TEXT DEFAULT 'วันนี้ขายได้ทั้งหมด {total_sales} บาทค่ะ',
  low_stock_threshold INT DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate order_no
CREATE OR REPLACE FUNCTION generate_order_no(p_shop_id UUID, p_date DATE)
RETURNS VARCHAR AS $$
DECLARE
  v_count INT;
  v_date_str VARCHAR;
BEGIN
  v_date_str := TO_CHAR(p_date, 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_count
  FROM orders
  WHERE shop_id = p_shop_id
    AND DATE(created_at) = p_date;
  RETURN 'ORD-' || v_date_str || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
