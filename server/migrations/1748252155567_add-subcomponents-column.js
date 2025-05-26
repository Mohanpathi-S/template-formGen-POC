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
  // Add subcomponents column to component_schemas table
  pgm.addColumn('component_schemas', {
    subcomponents: {
      type: 'jsonb',
      notNull: false,
      comment: 'Array of subcomponents with their own schemas, stored as JSONB'
    }
  });

  // Create index for subcomponents JSONB column for better performance
  pgm.createIndex('component_schemas', 'subcomponents', {
    method: 'gin'
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop the index first
  pgm.dropIndex('component_schemas', 'subcomponents');
  
  // Drop the subcomponents column
  pgm.dropColumn('component_schemas', 'subcomponents');
};
