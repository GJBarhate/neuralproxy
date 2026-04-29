ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle_end TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_code VARCHAR(50) NOT NULL,
  amount_inr INT NOT NULL,
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_tenant_created
  ON billing_payments(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_payments_status
  ON billing_payments(status, confirmed_at DESC);
