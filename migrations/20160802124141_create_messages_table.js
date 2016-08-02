
exports.up = function(knex, Promise) {
    return knex.schema.createTable('messages', function(table) {
        table.charset('utf8mb4');
        
        table.string('message_id', 20).index();
        table.string('channel_id', 20).index();
        table.string('server_id', 20).index();
        table.string('user_id', 20).index();
        table.string('user_username');
        table.string('user_nick');
        table.boolean('mentions_everyone');
        table.text('content');
        table.bigInteger('timestamp');
        table.bigInteger('edited_timestamp');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('messages');
};
