
exports.up = function(knex, Promise) {
    return knex.schema.createTable('channels', function (table) {
        table.charset('utf8mb4');

        table.increments();
        table.bigInteger('channel_id').index();
        table.bigInteger('server_id').index();
        table.string('name');
        table.timestamps();

        table.unique([ 'channel_id' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('channels');
};
