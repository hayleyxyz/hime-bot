
exports.up = function(knex, Promise) {
    return knex.schema.createTable('messages', function (table) {
        table.increments();
        table.string('discord_id');
        table.string('channel_id');
        table.string('server_id');
        table.string('member_id');
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
