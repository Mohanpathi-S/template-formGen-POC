-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(255) NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create component_schemas table
CREATE TABLE IF NOT EXISTS component_schemas (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  schema_json JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create template_audit_logs table
CREATE TABLE IF NOT EXISTS template_audit_logs (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  diff_json JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_component_schemas_template_id ON component_schemas(template_id);
CREATE INDEX IF NOT EXISTS idx_template_audit_logs_template_id ON template_audit_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_deleted ON templates(is_deleted);
CREATE INDEX IF NOT EXISTS idx_component_schemas_is_deleted ON component_schemas(is_deleted); 