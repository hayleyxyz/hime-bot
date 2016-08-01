/**
 * Created by oscar on 01/08/2016.
 */

class SelfGuard {

    run(bot, message) {
        return new Promise((resolve, reject) => {
            if(message.author.id === bot.user.id) {
                resolve();
            }
            else {
                reject('User not self');
            }
        });
    }
}

module.exports = SelfGuard;