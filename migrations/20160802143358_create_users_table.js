
exports.up = function(knex, Promise) {
    return knex.schema.createTable('users', function(table) {
        table.charset('utf8mb4');

        table.string('user_id', 20).primary();
        table.string('username');
        table.string('avatar');
        table.boolean('bot');
        table.bigInteger('created_at');
        table.string('discriminator');
        table.datetime('updated_at');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('users');
};
