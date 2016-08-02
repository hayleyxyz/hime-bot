
exports.up = function(knex, Promise) {
    return knex.schema.createTable('message_revisions', function (table) {
        table.charset('utf8mb4');

        table.increments();
        table.bigInteger('message_id').index();
        table.text('content');
        table.datetime('timestamp');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('message_revisions');
};

