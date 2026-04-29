CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'FREE',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER',
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompt_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash VARCHAR(64),
  prompt_text TEXT,
  response TEXT,
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE request_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  prompt TEXT,
  provider VARCHAR(50),
  latency_ms BIGINT,
  token_count INT,
  cost_usd DECIMAL(10,6),
  cache_hit BOOLEAN DEFAULT false,
  key_source VARCHAR(10) DEFAULT 'SYSTEM',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_request_logs_tenant_created ON request_logs(tenant_id, created_at DESC);
CREATE INDEX idx_prompt_cache_tenant ON prompt_cache(tenant_id);
CREATE INDEX idx_prompt_cache_hash ON prompt_cache(prompt_hash);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_users_email ON users(email);
