

exports.up = function(knex, Promise) {
    return knex.schema.createTable('custom_commands', function (table) {
        table.increments();
        table.string('name');
        table.text('content');
        table.timestamps();

        table.unique([ 'name' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('custom_commands');
};
