/**
 * Created by oscar on 28/07/2016.
 */

class Utils {

    static formatUserMention(userId) {
        return '<@' + userId + '>';
    }

    static formatChannelMention(channelId) {
        return '<#' + channelId + '>';
    }

    static parseUserMention(input) {
        var matches = input.match(/(<@!?([0-9]+)>)/);

        if(matches === null) {
            return null;
        }
        else {
            return matches[2];
        }
    }

    static parseChannelMention(input) {
        var matches = input.match(/(<#([0-9]+)>)/);

        if(matches === null) {
            return null;
        }
        else {
            return matches[2];
        }
    }

}

module.exports = Utils;