/**
 * Created by oscar on 20/07/2016.
 */

module.exports = function (bookshelf) {

    var CustomCommand = bookshelf.Model.extend({
        tableName: 'custom_commands',
        hasTimestamps: true
    });

    var Message = bookshelf.Model.extend({
        tableName: 'messages',
        hasTimestamps: true
    });

    return {
        CustomCommand: CustomCommand,
        Message: Message
    };
};