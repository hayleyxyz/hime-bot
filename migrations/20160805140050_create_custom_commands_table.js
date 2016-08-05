
exports.up = function(knex, Promise) {
    return knex.schema.createTable('custom_commands', function(table) {
        table.charset('utf8mb4');

        table.increments('custom_command_id');
        table.string('name').index();
        table.text('content');
        table.datetime('created_at');
        table.datetime('updated_at');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('custom_commands');
};
