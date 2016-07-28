
exports.up = function(knex, Promise) {
    return knex.schema.createTable('user_socks', function (table) {
        table.increments();
        table.string('user_id').index();
        table.integer('count');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('user_socks');
};
