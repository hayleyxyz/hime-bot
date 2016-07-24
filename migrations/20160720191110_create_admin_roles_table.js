
exports.up = function(knex, Promise) {
    return knex.schema.createTable('server_admin_roles', function (table) {
        table.increments();
        table.string('server_id').index();
        table.string('role_name');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('server_admin_roles');
};