/**
 * Created by oscar on 29/07/2016.
 */

class ChannelWhitelistGuard {

    constructor(models) {
        this.models = models;
    }

    run(bot, message) {
        return new Promise((resolve, reject) => {
            this.models.ChannelWhitelist.where('channel_id', message.channel.id).count('id').then(function(result) {
                if(result === 0) {
                    reject('Channel not in whitelist');
                }
                else {
                    resolve();
                }
            }, reject);
        });
    }
}

module.exports = ChannelWhitelistGuard;