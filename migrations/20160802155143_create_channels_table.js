
exports.up = function(knex, Promise) {
    return knex.schema.createTable('channels', function(table) {
        table.charset('utf8mb4');

        table.string('channel_id', 20).primary();
        table.string('guild_id', 20).index();
        table.enum('type', [ 'text', 'voice' ]);
        table.string('name');
        table.bigInteger('created_at');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('channels');
};
