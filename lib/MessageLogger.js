/**
 * Created by oscar on 28/07/2016.
 */

const util = require('util');
const moment = require('moment');
const Eris = require('eris');

class MessageLogger {

    constructor(models) {
        this.models = models;
    }

    writeMessageToDatabase(message) {
        /*
         * Save the message in the db
         */
         new this.models.Message().save({
            discord_id: message.id,
            channel_id: message.channel.id,
            server_id: message.channel.guild ? message.channel.guild.id : null,
            member_id: message.author.id,
            member_username: message.author.username,
            member_nickname: message.member ? message.member.nick : null,
            content: message.content,
            timestamp: moment(message.timestamp).format('Y-MM-DD HH:mm:ss')
        }).then(() => {
             if(message.attachments.length > 0) {
                 for(var x in message.attachments) {
                     var url = message.attachments[x].url;

                     new this.models.MessageAttachment().save({
                        message_id: message.id,
                         url: url
                     });
                 }
             }
         });
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

        console.log(util.format('%s [%s] %s: %s %s', channelDesc,
            moment(message.timestamp).format('YYYY-MM-DD HH:mm'), message.author.username, message.content, urls.join('\n')));

        this.writeMessageToDatabase(message);
    }

}

module.exports = MessageLogger;