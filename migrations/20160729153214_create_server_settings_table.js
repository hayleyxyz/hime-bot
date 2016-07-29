
exports.up = function(knex, Promise) {
    return knex.schema.createTable('server_settings', function (table) {
        table.increments();
        table.string('server_id');
        table.string('name');
        table.string('value');
        table.timestamps();

        table.index([ 'channel_id', 'name' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('server_settings');
};
