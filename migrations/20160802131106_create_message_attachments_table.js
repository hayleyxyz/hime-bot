
exports.up = function(knex, Promise) {
    return knex.schema.createTable('message_attachments', function(table) {
        table.charset('utf8mb4');
        
        table.string('message_id', 20).index();
        table.string('filename');
        table.integer('size');
        table.string('url');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('message_attachments');
};
