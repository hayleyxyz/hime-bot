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

        ChannelWhitelist: bookshelf.Model.extend({
            tableName: 'channel_whitelist',
            hasTimestamps: true
        }),

        CustomCommand: bookshelf.Model.extend({
            tableName: 'custom_commands',
            hasTimestamps: true
        })
    };
};