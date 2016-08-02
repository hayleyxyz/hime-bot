
exports.up = function(knex, Promise) {
    return knex.schema.table('messages', function(table) {
        table.text('clean_content').after('content');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('messages', function(table) {
        table.dropColumn('clean_content');
    });
};
