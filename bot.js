/**
 * Created by oscar on 19/07/2016.
 */

"use strict";

const Eris = require('eris');
const CommandHandler = require('./lib/CommandHandler');
const MessageLogger = require('./lib/MessageLogger');
const config = require('./config');
const util = require('util');
const Utils = require('./lib/Utils');
const request = require('request');
const knex = require('knex')(config.knexOptions);
const fs = require('fs');
const moment = require('moment');
const numeral = require('numeral');
const constants = require('./constants');
const ChannelWhitelistGuard = require('./lib/Guards/ChannelWhitelistGuard');
const UserWhitelistGuard = require('./lib/Guards/UserWhitelistGuard');
const CustomCommandHandler = require('./lib/CustomCommandHandler');
const VoiceSession = require('./lib/VoiceSession');
const querystring = require('querystring');

var voiceSessions = new Map();

var bot = new Eris(config.token, config.erisOptions);

bot.on('ready', () => {
    console.log('Username: ' + bot.user.username);

    console.log('Servers:');

    bot.guilds.forEach((server) => {
        console.log('\t' + server.name);

        server.channels.forEach((channel) => {
            knex(constants.TABLE_CHANNELS).insert({
                channel_id: channel.id,
                server_id: server.id,
                name: channel.name,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now()
            });
        });
    });

    console.log();
});

bot.on('error', (e) => {
    console.log(e);
});

var logger = new MessageLogger(knex);
bot.on('messageCreate', (message) => {
    logger.handle(bot, message);
});

bot.on('messageUpdate', (message, oldMessage) => {
    logger.handleUpdate(bot, message);
});

var commands = new CommandHandler();
bot.on('messageCreate', (message) => {
    commands.handle(bot, message);
});

commands.command('enable', (command) => {
    command.description = 'Enable the bot on this channel.';

    command.args((args) => {
        args.channel().optional();
    });

    command.handler = (bot, message) => {
        knex(constants.TABLE_CHANNEL_WHITELIST).insert({
            channel_id: message.channel.id,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
        }).then(() => {
            bot.createMessage(message.channel.id,
                util.format('Self-bot enabled on **%s**', Utils.formatChannelMention(message.channel.id)));
        });
    };
});

commands.command('disable', (command) => {
    command.description = 'Disable the bot on this channel.';

    command.args((args) => {
        args.channel().optional();
    });

    command.handler = (bot, message) => {
        knex(constants.TABLE_CHANNEL_WHITELIST)
            .where('channel_id', message.channel.id)
            .del()
            .then(() => {
                bot.createMessage(message.channel.id,
                    util.format('Self-bot disabled on **%s**', Utils.formatChannelMention(message.channel.id)));
            });
    };
});

commands.command('stats', (command) => {

    command.args((args) => {
        args.user().optional();
    });

    command.handler = (bot, message, userId) => {
        if(!userId) {
            userId = message.author.id;
        }

        knex(constants.TABLE_MESSAGES)
            .count('id as count')
            .min('timestamp as first_posted')
            .where('server_id', message.channel.guild.id)
            .where('member_id', userId)
            .then((result) => {
                var count = 0;
                var firstPosted = 'Never';

                if(result.length > 0) {
                    count = result[0].count;
                    firstPosted = moment(result[0].first_posted).format('YYYY-MM-DD HH:mm');
                }

                bot.createMessage(message.channel.id,
                    util.format('%s: %s total messages since %s',
                        Utils.formatUserMention(userId),
                        numeral(count).format('0,0'),
                        firstPosted));
            });
    };

});

commands.command('logs', (command) => {

    command.handler = (bot, message) => {
        var url = util.format('%s/logs/%s?%s',
            config.webUrl,
            message.channel.guild.id,
            querystring.stringify({ channel: message.channel.id }));

        bot.createMessage(message.channel.id, url);
    };

});

commands.command('shrug', (command) => {

    command.handler = (bot, message) => {
        bot.createMessage(message.channel.id, '¯\\_(ツ)_/¯');
    };

});

bot.connect();