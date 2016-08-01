
exports.up = function(knex, Promise) {
    return knex.schema.createTable('message_attachments', function (table) {
        table.charset('utf8mb4');
        
        table.increments();
        table.bigInteger('message_id').index();
        table.string('url');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('message_attachments');
};
