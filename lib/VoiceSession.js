/**
 * Created by oscar on 29/07/2016.
 */

class VoiceSession {

    constructor(bot, channelId) {
        this.bot = bot;
        this.channelId = channelId;
        this.connection = null;
    }

    getConnection() {
        if(this.connection === null) {
            return new Promise((resolve, reject) => {
                this.bot.joinVoiceChannel(this.channelId).then((vc) => {
                    this.connection = vc;
                    resolve(vc);
                }, reject);
            });
        }
        else {
            return new Promise((resolve, reject) => {
                resolve(this.connection);
            });
        }
    }
}

module.exports = VoiceSession;