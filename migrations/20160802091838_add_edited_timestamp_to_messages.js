
exports.up = function(knex, Promise) {
    return knex.schema.table('messages', function (table) {
        table.datetime('edited_timestamp').after('timestamp');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('messages', function (table) {
        table.datetime('edited_timestamp').after('timestamp');
    });
};
