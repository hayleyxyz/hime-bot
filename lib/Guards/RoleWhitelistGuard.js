/**
 * Created by yuikitty on 14/08/2016.
 */

class RoleWhitelistGuard {

    constructor(roleIds) {
        this.roleIds = roleIds;
    }

    run(bot, message) {
        return new Promise((resolve, reject) => {
            var hasId = false;

            message.member.roles.forEach(roleId => {
                if(this.roleIds.indexOf(roleId) >= 0) {
                    hasId = true;
                    return false;
                }
            });

            if(hasId) {
                resolve();
            }
            else {
                reject('User doesn\'t have a role in the whitelist');
            }
        });
    }
}

module.exports = RoleWhitelistGuard;