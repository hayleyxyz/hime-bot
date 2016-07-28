
exports.up = function(knex, Promise) {
    return knex.schema.createTable('server_whitelist', function (table) {
        table.increments();
        table.string('server_id').unique();
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('server_whitelist');
};
