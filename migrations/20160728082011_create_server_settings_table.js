
exports.up = function(knex, Promise) {
    return knex.schema.createTable('server_settings', function (table) {
        table.increments();
        table.string('server_id');
        table.string('key');
        table.string('value_string');
        table.timestamps();

        table.unique([ 'server_id', 'key' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('server_settings');
};
