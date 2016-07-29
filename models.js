/**
 * Created by oscar on 20/07/2016.
 */

module.exports = function (bookshelf) {
    return {
        Message: bookshelf.Model.extend({
            tableName: 'messages',
            hasTimestamps: true
        }),

        UserSock: bookshelf.Model.extend({
            tableName: 'user_socks',
            hasTimestamps: true
        }),

        ServerWhitelist: bookshelf.Model.extend({
            tableName: 'server_whitelist',
            hasTimestamps: true
        }),

        CustomCommand: bookshelf.Model.extend({
            tableName: 'custom_commands',
            hasTimestamps: true
        })
    };
};