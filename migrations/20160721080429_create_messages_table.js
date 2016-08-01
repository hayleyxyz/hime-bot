
exports.up = function(knex, Promise) {
    return knex.schema.createTable('messages', function (table) {
        table.charset('utf8mb4');

        table.increments();
        table.bigInteger('discord_id');
        table.bigInteger('channel_id');
        table.bigInteger('server_id');
        table.bigInteger('member_id');
        table.string('member_username');
        table.string('member_nickname');
        table.text('content');
        table.datetime('timestamp');
        table.timestamps();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('messages');
};
