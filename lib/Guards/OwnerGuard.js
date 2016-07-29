/**
 * Created by oscar on 29/07/2016.
 */

class OwnerGuard {

    constructor(ownerUserIds) {
        this.ownerUserIds = ownerUserIds;
    }

    run(bot, message) {
        return new Promise((resolve, reject) => {
            if(this.ownerUserIds.indexOf(message.author.id) >= 0) {
                resolve();
            }
            else {
                reject('User not owner');
            }
        });
    }
}

module.exports = OwnerGuard;