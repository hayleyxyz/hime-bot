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

    var ServerAdminRole = bookshelf.Model.extend({
        tableName: 'server_admin_roles',
        hasTimestamps: true
    });

    return {
        CustomCommand: CustomCommand,
        Message: Message,
        ServerAdminRole: ServerAdminRole
    };
};