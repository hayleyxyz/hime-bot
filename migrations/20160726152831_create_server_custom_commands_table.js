
exports.up = function(knex, Promise) {
    return knex.schema.createTable('custom_commands', function (table) {
        table.increments();
        table.string('server_id');
        table.string('name');
        table.text('content');
        table.timestamps();

        table.unique([ 'server_id', 'name' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('custom_commands');
};
