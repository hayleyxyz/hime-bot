
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('messages', function (table) {
        table.unique('discord_id');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('messages', function (table) {
        table.dropUnique('discord_id');
    });
};