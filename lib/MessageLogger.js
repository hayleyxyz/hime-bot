/**
 * Created by oscar on 28/07/2016.
 */

const util = require('util');
const moment = require('moment');
const Eris = require('eris');
const constants = require('../constants');

class MessageLogger {

    constructor(db) {
        this.db = db;
    }

    handle(bot, message) {
        var isDm = (message.channel instanceof Eris.PrivateChannel);

        /*
         * Print message to console
         */
        var channelDesc = null;

        if(!isDm) {
            channelDesc = util.format('%s - #%s', message.channel.guild.name, message.channel.name);
        }
        else {
            channelDesc = util.format('@%s', message.channel.recipient.username);
        }

        var urls = [ ];

        if(message.attachments.length > 0) {
            for(var x in message.attachments) {
                urls.push(message.attachments[x].url);
            }
        }

        var prefix = '';

        if(message.editedTimestamp) {
            prefix = 'EDITED: ';
        }

        console.log(util.format('%s%s [%s] %s: %s %s', prefix, channelDesc,
            moment(message.timestamp).format('YYYY-MM-DD HH:mm'), message.author.username, message.cleanContent, urls.join('\n')));

        this.db.insertMessage(message);
    }

}

module.exports = MessageLogger;