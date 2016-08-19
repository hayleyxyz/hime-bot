
exports.up = function(knex, Promise) {
    return knex.schema.createTable('guild_settings', function(table) {
        table.charset('utf8mb4');

        table.string('guild_id');
        table.string('name');
        table.string('value');
        table.datetime('created_at');
        table.datetime('updated_at');

        table.index([ 'guild_id', 'name' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('guild_settings');
};
