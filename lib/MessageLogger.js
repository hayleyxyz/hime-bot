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

    batchInsertChannels(channels) {
        this.knex(constants.TABLE_CHANNELS)
            .select('channel_id')
            .then((rows) => {
                var existingChannelIds = rows.map(r => r.channel_id);

                channels.forEach((channel) => {
                    if(existingChannelIds.indexOf(channel.id) === -1) {
                        this.insertChannel(channel);
                    }
                });
            });
    }

    insertChannel(channel) {
        this.knex(constants.TABLE_CHANNELS)
            .insert({
                channel_id: channel.id,
                guild_id: channel.guild ? channel.guild.id : null,
                type: channel.type === 0 ? 'text' : 'voice',
                name: channel.name,
                created_at: channel.createdAt
            })
            .then((result) => {

            });
    }

    insertUpdateUser(user) {
        this.knex(constants.TABLE_USERS)
            .where('user_id', user.id)
            .first()
            .then((row) => {
                var attributes = {
                    user_id: user.id,
                    username: user.username,
                    avatar: user.avatar,
                    bot: user.bot ? 1 : 0,
                    created_at: Math.floor(user.createdAt),
                    discriminator: user.discriminator
                };

                if(!row) {
                    attributes.updated_at = this.knex.fn.now();
                    this.knex(constants.TABLE_USERS).insert(attributes).then((result) => {

                    });
                }
                else {
                    for(var attribute in attributes) {
                        if(attributes[attribute] !== row[attribute]) {
                            attributes.updated_at = this.knex.fn.now();
                            this.knex(constants.TABLE_USERS)
                                .where('user_id', user.id)
                                .update(attributes).then((result) => {

                                });

                            return;
                        }
                    }
                }
            });
    }

    insertMessage(message) {
        /*
         * Save the message in the db
         */
        if(typeof message.editedTimestamp === 'string') {
            message.editedTimestamp = moment(message.editedTimestamp).valueOf();
        }

        this.knex(constants.TABLE_MESSAGES).insert({
            message_id: message.id,
            channel_id: message.channel.id,
            server_id: message.channel.guild ? message.channel.guild.id : null,
            user_id: message.author.id,
            user_username: message.author.username,
            user_nick: message.member ? message.member.nick : null,
            mentions_everyone: message.mentionEveryone,
            content: message.content,
            clean_content: message.cleanContent,
            timestamp: message.timestamp,
            edited_timestamp: message.editedTimestamp
        }).then(() => {
            /*
             * Message attachments
             */
             message.attachments.forEach((attachment) => {
                 this.knex(constants.TABLE_MESSAGE_ATTACHMENTS).insert({
                     message_id: message.id,
                     filename: attachment.filename,
                     size: attachment.size,
                     url: attachment.url
                }).then(() => {

                 });
             });

            /*
             * User mentions
             */
            message.mentions.forEach((user) => {
                this.knex(constants.TABLE_MESSAGE_MENTIONS).insert({
                    message_id: message.id,
                    mention_id: user.id,
                    type: 'user'
                }).then(() => {

                });
            });

            /*
             * Role mentions
             */
            message.roleMentions.forEach((roleId) => {
                this.knex(constants.TABLE_MESSAGE_MENTIONS).insert({
                    message_id: message.id,
                    mention_id: roleId,
                    type: 'role'
                }).then(() => {

                });
            });

            /*
             * channel mentions
             */
            message.channelMentions.forEach((channelId) => {
                this.knex(constants.TABLE_MESSAGE_MENTIONS).insert({
                    message_id: message.id,
                    mention_id: channelId,
                    type: 'channel'
                }).then(() => {

                });
            });
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

        var prefix = '';

        if(message.editedTimestamp) {
            prefix = 'EDITED: ';
        }

        console.log(util.format('%s%s [%s] %s: %s %s', prefix, channelDesc,
            moment(message.timestamp).format('YYYY-MM-DD HH:mm'), message.author.username, message.cleanContent, urls.join('\n')));

        this.insertMessage(message);
    }

}

module.exports = MessageLogger;