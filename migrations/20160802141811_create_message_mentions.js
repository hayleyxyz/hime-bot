
exports.up = function(knex, Promise) {
    return knex.schema.createTable('message_mentions', function(table) {
        table.charset('utf8mb4');
        
        table.string('message_id', 20).index();
        table.string('mention_id', 20);
        table.enum('type', [ 'user', 'role', 'channel' ]);

        table.unique([ 'message_id', 'mention_id', 'type' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('message_mentions');
};

