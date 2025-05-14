/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create templates table
  pgm.createTable("templates", {
    id: "id",
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    created_by: { type: "varchar(255)", notNull: true },
    is_deleted: { type: "boolean", notNull: true, default: false },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Create component_schemas table
  pgm.createTable("component_schemas", {
    id: "id",
    template_id: {
      type: "integer",
      notNull: true,
      references: "templates",
      onDelete: "CASCADE",
    },
    key: { type: "varchar(255)", notNull: true },
    title: { type: "varchar(255)", notNull: true },
    schema_json: { type: "jsonb", notNull: true },
    order_index: { type: "integer", notNull: true },
    is_deleted: { type: "boolean", notNull: true, default: false },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Create template_audit_logs table
  pgm.createTable("template_audit_logs", {
    id: "id",
    template_id: {
      type: "integer",
      notNull: true,
      references: "templates",
      onDelete: "CASCADE",
    },
    change_type: {
      type: "varchar(50)",
      notNull: true,
      comment: "CREATE, UPDATE, DELETE",
    },
    performed_by: { type: "varchar(255)", notNull: true },
    diff_json: { type: "jsonb", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Create indexes
  pgm.createIndex("component_schemas", "template_id");
  pgm.createIndex("template_audit_logs", "template_id");
  pgm.createIndex("templates", "is_deleted");
  pgm.createIndex("component_schemas", "is_deleted");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable("template_audit_logs");
  pgm.dropTable("component_schemas");
  pgm.dropTable("templates");
};
