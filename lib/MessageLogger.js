/**
 * Created by oscar on 28/07/2016.
 */

const util = require('util');
const moment = require('moment');
const Eris = require('eris');
const constants = require('../constants');

class MessageLogger {

    constructor(knex) {
        this.knex = knex;
    }

    writeMessageToDatabase(message) {
        /*
         * Save the message in the db
         */
        this.knex(constants.TABLE_MESSAGES).insert({
            discord_id: message.id,
            channel_id: message.channel.id,
            server_id: message.channel.guild ? message.channel.guild.id : null,
            member_id: message.author.id,
            member_username: message.author.username,
            member_nickname: message.member ? message.member.nick : null,
            content: message.content,
            timestamp: moment(message.timestamp).format('Y-MM-DD HH:mm:ss'),
            created_at: this.knex.fn.now(),
            updated_at: this.knex.fn.now()
        }).then(() => {
             if(message.attachments.length > 0) {
                 for(var x in message.attachments) {
                     var url = message.attachments[x].url;

                     this.knex(constants.TABLE_MESSAGE_ATTACHMENTS).insert({
                        message_id: message.id,
                         url: url,
                         created_at: this.knex.fn.now(),
                         updated_at: this.knex.fn.now()
                     });
                 }
             }
         });
    }

    writeMessageRevision(message) {
        this.knex(constants.TABLE_MESSAGE_REVISIONS).insert({
            message_id: message.id,
            content: message.content,
            timestamp: moment(message.editedTimestamp).format('Y-MM-DD HH:mm:ss'),
            created_at: this.knex.fn.now(),
            updated_at: this.knex.fn.now()
        }).then((result) => {

        });

        this.knex(constants.TABLE_MESSAGES)
            .where('discord_id', message.id)
            .update({
                edited_timestamp: moment(message.editedTimestamp).format('Y-MM-DD HH:mm:ss')
            }).then((result) => {
                
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

    handleUpdate(bot, message) {

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

        console.log(util.format('EDITED: %s [%s] %s: %s %s', channelDesc,
            moment(message.timestamp).format('YYYY-MM-DD HH:mm'), message.author.username, message.content, urls.join('\n')));

        this.writeMessageRevision(message);
    }

}

module.exports = MessageLogger;