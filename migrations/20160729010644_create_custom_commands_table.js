

exports.up = function(knex, Promise) {
    return knex.schema.createTable('custom_commands', function (table) {
        table.charset('utf8mb4');

        table.increments();
        table.string('name', 50);
        table.text('content');
        table.timestamps();

        table.unique([ 'name' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('custom_commands');
};
