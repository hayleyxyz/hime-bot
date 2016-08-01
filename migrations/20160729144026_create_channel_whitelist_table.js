
exports.up = function(knex, Promise) {
    return knex.schema.createTable('channel_whitelist', function (table) {
        table.charset('utf8mb4');

        table.increments();
        table.bigInteger('channel_id');
        table.timestamps();

        table.unique([ 'channel_id' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('channel_whitelist');
};

