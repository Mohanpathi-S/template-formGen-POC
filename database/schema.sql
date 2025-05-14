-- PostgreSQL schema for dynamic form templates and sub-components

-- 1. Templates table: stores each form template (e.g., Detection Log, Repair Log)
CREATE TABLE templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL UNIQUE,
  description      TEXT,
  created_by       UUID NOT NULL,
  updated_by       UUID,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE,
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. Component schemas: each template may have multiple sub-components (Survey Details, Fugitive Emissions, etc.)
CREATE TABLE component_schemas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  key              TEXT NOT NULL,           -- e.g. 'surveyDetails', 'detectionFugitive'
  title            TEXT NOT NULL,           -- human-friendly title
  schema_json      JSONB NOT NULL,          -- full JSONSchema for this component
  order_index      INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE,
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(template_id, key)
);

-- 3. Audit logs: maintain history of schema changes
CREATE TABLE template_audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  template_id   UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  change_type   TEXT NOT NULL,      -- 'CREATE', 'UPDATE', 'DELETE'
  performed_by  UUID NOT NULL,
  performed_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  diff_json     JSONB               -- diff or snapshot of schema
);

-- 4. Create a users table for tracking who creates/updates templates
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username         TEXT NOT NULL UNIQUE,
  email            TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. File storage table for uploaded Excel files
CREATE TABLE uploaded_files (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename         TEXT NOT NULL,
  original_name    TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  file_size        BIGINT NOT NULL,
  mime_type        TEXT NOT NULL,
  uploaded_by      UUID REFERENCES users(id),
  uploaded_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_templates_name ON templates(name);
CREATE INDEX idx_component_schemas_template ON component_schemas(template_id);
CREATE INDEX idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);
CREATE INDEX idx_component_schemas_schema_json ON component_schemas USING GIN (schema_json); 