
exports.up = function(knex, Promise) {
    return knex.schema.table('messages', function(table) {
        table.dateTime('deleted_at').after('edited_timestamp');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('messages', function(table) {
        table.dropColumn('deleted_timestamp');
    });
};