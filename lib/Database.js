/**
 * Created by oscar on 03/08/2016.
 */

const moment = require('moment');
const constants = require('../constants');

class Database {

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

        if(isNaN(message.editedTimestamp)) {
            message.editedTimestamp = null;
        }

        this.knex(constants.TABLE_MESSAGES)
            .count('message_id as count')
            .where('message_id', message.id)
            .first()
            .then((row) => {
                var saveRelations = row.count === 0;

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
                    if(saveRelations) {
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
                    }
                });
            });
    }

    updateMessageDeleted(messageId) {
        var attributes = {
            deleted_at: this.knex.fn.now()
        };

        this.knex(constants.TABLE_MESSAGES)
            .where('message_id', messageId)
            .update(attributes).then((result) => {

            });
    }

    insertUpdateCustomCommand(name, content) {
        this.knex(constants.TABLE_CUSTOM_COMMANDS)
            .where('name', name)
            .first()
            .then((row) => {
                var attributes = {
                    name: name,
                    content: content,
                    updated_at: this.knex.fn.now()
                };

                if(!row) {
                    attributes.created_at = this.knex.fn.now();
                    this.knex(constants.TABLE_CUSTOM_COMMANDS).insert(attributes).then((result) => {

                    });
                }
                else {
                    this.knex(constants.TABLE_CUSTOM_COMMANDS)
                        .where('custom_command_id', row.custom_command_id)
                        .update(attributes).then((result) => {

                        });
                }
            });
    }

    getCustomCommand(name) {
        return this.knex(constants.TABLE_CUSTOM_COMMANDS)
            .where('name', name)
            .first();
    }

    getCustomCommandNames() {
        return this.knex(constants.TABLE_CUSTOM_COMMANDS)
            .select('name');
    }

}

module.exports = Database;