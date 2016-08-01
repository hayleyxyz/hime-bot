/**
 * Created by oscar on 29/07/2016.
 */

class UserWhitelistGuard {

    constructor(userIds) {
        this.userIds = userIds;
    }

    run(bot, message) {
        return new Promise((resolve, reject) => {
            if(this.userIds.indexOf(message.author.id) >= 0) {
                resolve();
            }
            else {
                reject('User not in whitelist');
            }
        });
    }
}

module.exports = UserWhitelistGuard;