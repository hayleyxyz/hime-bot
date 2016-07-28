/**
 * Created by oscar on 19/07/2016.
 */

"use strict";

const Eris = require('eris');
const HimeBot = require('./lib/HimeBot');
const CommandHandler = require('./lib/CommandHandler');
const MessageLogger = require('./lib/MessageLogger');
const config = require('./config');
const util = require('util');
const Utils = require('./lib/Utils');
const request = require('request');
const bookshelf = require('./lib/bookshelf');
const models = require('./lib/models')(bookshelf);

var bot = new HimeBot(config.token);

var logger = new MessageLogger(models);
bot.on('messageCreate', (message) => {
    logger.handle(bot, message);
});

var commands = new CommandHandler();
bot.on('messageCreate', (message) => {
    commands.handle(bot, message);
});

commands.command('echo', (command) => {
    command.description = 'Echo something back to the user';

    command.args((args) => {
        args.argument('phrase');
    });

    command.handler = (bot, message, phrase) => {
        bot.createMessage(message.channel.id, phrase);
    };
});

commands.command('nick', (command) => {
    command.description = 'Change a user\'s nickname on the server.';

    command.args((args) => {
        args.user();
        args.argument('nick').optional();
    });

    command.handler = (bot, message, userId, nick) => {
        bot.editGuildMember(message.channel.guild.id, userId, { nick: nick });
    };
});

commands.command('mute', (command) => {
    command.description = 'Text-mute a user';

    command.args((args) => {
        args.user();
        args.channel().optional();
    });

    command.handler = (bot, message, userId, channelId) => {
        var allowMask = 0;
        var denyMask = 0;

        if(!channelId) {
            channelId = message.channel.id;
        }

        var existingPermissions = message.channel.guild.channels.get(channelId).permissionOverwrites.find(function(perm) {
            return perm.type === 'member' && perm.id === userId;
        });

        if(existingPermissions) {
            allowMask = existingPermissions.allow;
            denyMask = existingPermissions.deny;
        }

        denyMask |= Eris.Constants.Permissions.sendMessages;
        allowMask &= ~Eris.Constants.Permissions.sendMessages;

        bot.editChannelPermission(channelId, userId, allowMask, denyMask, 'member').then(() => {
            bot.createMessage(message.channel.id, util.format('%s has been muted on %s',
                Utils.formatUserMention(userId),
                Utils.formatChannelMention(channelId)));
        });
    };
});

commands.command('unmute', (command) => {
    command.description = 'Text-unmute a user';

    command.args((args) => {
        args.user();
        args.channel().optional();
    });

    command.handler = (bot, message, userId, channelId) => {
        var allowMask = 0;
        var denyMask = 0;

        if(!channelId) {
            channelId = message.channel.id;
        }

        var existingPermissions = message.channel.guild.channels.get(channelId).permissionOverwrites.find(function(perm) {
            return perm.type === 'member' && perm.id === userId;
        });

        if(existingPermissions) {
            allowMask = existingPermissions.allow;
            denyMask = existingPermissions.deny;
        }

        denyMask &= ~Eris.Constants.Permissions.sendMessages;

        bot.editChannelPermission(channelId, userId, allowMask, denyMask, 'member').then(() => {
            bot.createMessage(message.channel.id, util.format('%s has been unmuted on %s',
                Utils.formatUserMention(userId),
                Utils.formatChannelMention(channelId)));
        });
    };
});

commands.command('avatar', (command) => {
    command.description = 'Change the bot\'s avatar';

    command.args((args) => {
        args.argument('url');
    });

    command.handler = (bot, message, url) => {
        request.get(url, function (error, response, body) {
            if(!error && response.statusCode == 200) {
                bot.editSelf({
                    avatar: 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64')
                }).catch(function() {
                    console.log(arguments);
                    bot.createMessage(message.channel.id, 'A Discord API error occurred trying to set that avatar!');
                });
            }
            else {
                bot.createMessage(message.channel.id, 'An error occurred trying to get that avatar!');
            }
        });
    };
});

bot.connect();