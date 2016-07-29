
exports.up = function(knex, Promise) {
    return knex.schema.createTable('channel_whitelist', function (table) {
        table.increments();
        table.string('channel_id');
        table.timestamps();

        table.unique([ 'channel_id' ]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('channel_whitelist');
};

