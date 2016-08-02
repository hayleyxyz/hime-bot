
exports.up = function(knex, Promise) {
    return knex.schema.createTable('channel_whitelist', function(table) {
        table.charset('utf8mb4');

        table.string('channel_id', 20).primary();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('channel_whitelist');
};

