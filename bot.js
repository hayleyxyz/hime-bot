/**
 * Created by oscar on 19/07/2016.
 */

"use strict";

const Eris = require('eris');
const CommandHandler = require('./lib/CommandHandler');
var CustomCommandHandler = require('./lib/CustomCommandHandler');
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
const RoleWhitelistGuard = require('./lib/Guards/RoleWhitelistGuard');
const Database = require('./lib/Database');
const querystring = require('querystring');
const CommandArgument = require('./lib/CommandArgument');

var db = new Database(knex);
var logger = new MessageLogger(db);

var userGuard = new UserWhitelistGuard([
    '175044949744680970',
    '163017409521909760'
]);

var roleGuard = new RoleWhitelistGuard([
    '176844097292599297', // >>Admins
    '198862394468990977', // Kneesocks
    '210039704836374529' // test (SC)
]);

var bot = new Eris(process.env.DISCORD_TOKEN || config.token, config.erisOptions);

bot.on('ready', () => {
    console.log('Username: ' + bot.user.username);

    console.log('Servers:');

    bot.guilds.forEach((server) => {
        console.log('\t' + server.name);

        console.log(server.roles);

        db.batchInsertChannels(server.channels);
    });

    bot.users.forEach((user) => {
        db.insertUpdateUser(user);
    });

    console.log();
});

bot.on('error', (e) => {
    console.log(e);
});

bot.on('messageCreate', (message) => {
    logger.handle(bot, message);
});

bot.on('messageUpdate', (message, oldMessage) => {
    logger.handle(bot, message);
});

var commands = new CommandHandler();
bot.on('messageCreate', (message) => {
    commands.handle(bot, message);
});

var customCommands = new CustomCommandHandler(db);
bot.on('messageCreate', (message) => {
    customCommands.handle(bot, message);
});


bot.on('userUpdate', (user) => {
    if(user.discriminator) {
        db.insertUpdateUser(user);
    }
    else {
        console.log(user);
    }
});

bot.on('guildMemberAdd', (user) => {
    if(user.discriminator) {
        db.insertUpdateUser(user);
    }
    else {
        console.log(user);
    }
});

commands.command('game', (command) => {
    command.description = 'Change the bots\'s currently playing game';

    command.guards.add(roleGuard);

    command.args((args) => {
        args.argument('game').optional();
    });

    command.handler = (bot, message, game) => {
        bot.editGame({ name: game });
    };
});

commands.command('help', (command) => {
    command.description = 'Show this help text';

    command.handler = (bot, message) => {
        var msg = [ ];

        msg.push('Commands:');

        commands.commands.forEach((command, name) => {
            var args = [ ];

            if(command.arguments) {
                command.arguments.forEach(arg => {
                    var str = null;

                    if (arg.options.has(CommandArgument.OPTIONAL)) {
                        str = '[' + arg.name + ']';
                    }
                    else {
                        str = '<' + arg.name + '>';
                    }

                    args.push(str);
                });
            }

            msg.push(util.format('.%s %s - %s', name, args.join(' '), command.description));
        });

        msg.push('');

        db.getCustomCommandNames().then(rows => {
            var names = [ ];

            rows.forEach(row => {
               names.push('.' + row.name);
            });

            if(names.length > 0) {
                msg.push('Custom commands: ' + names.join(', '));
            }

            bot.createMessage(message.channel.id, msg.join('\n'));
        });
    };

});

commands.command('logs', (command) => {
    command.description = 'Get the URL for the server message logs';

    command.handler = (bot, message) => {
        var url = util.format('%s/logs/%s?%s',
            config.webUrl,
            message.channel.guild.id,
            querystring.stringify({ channel: message.channel.id }));

        bot.createMessage(message.channel.id, url);
    };

});

commands.command('commands.edit', (command) => {
    command.description = 'Edit a custom command';

    command.guards.add(roleGuard);

    command.args((args) => {
        args.argument('name');
        args.argument('content');
    });

    command.handler = (bot, message, name, content) => {
        db.insertUpdateCustomCommand(name, content);
    };

});

commands.command('mute', (command) => {
    command.description = 'Mute a user on the current channel';

    command.guards.add(roleGuard);

    command.args((args) => {
        args.user();
    });

    command.handler = (bot, message, userId) => {
        console.log(userId);

        var allowMask = 0;
        var denyMask = 0;

        var channelId = message.channel.id;

        var existingPermissions = message.channel.guild.channels.get(channelId).permissionOverwrites.find(function(perm) {
            return perm.type === 'member' && perm.id === userId;
        });

        if(existingPermissions) {
            allowMask = existingPermissions.allow;
            denyMask = existingPermissions.deny;
        }

        denyMask |= Eris.Constants.Permissions.sendMessages;
        allowMask &= ~Eris.Constants.Permissions.sendMessages;

        bot.editChannelPermission(channelId, userId, allowMask, denyMask, 'member').then(function() {
            bot.createMessage(message.channel.id, util.format('%s has been muted on %s',
                Utils.formatUserMention(userId),
                Utils.formatChannelMention(channelId)));
        });
    };

});

commands.command('unmute', (command) => {
    command.description = 'Unmute a user on the current channel';

    command.guards.add(roleGuard);

    command.args((args) => {
        args.user();
    });

    command.handler = (bot, message, userId) => {
        var allowMask = 0;
        var denyMask = 0;

        var channelId = message.channel.id;

        var existingPermissions = message.channel.guild.channels.get(channelId).permissionOverwrites.find(function(perm) {
            return perm.type === 'member' && perm.id === userId;
        });

        if(existingPermissions) {
            allowMask = existingPermissions.allow;
            denyMask = existingPermissions.deny;
        }

        denyMask &= ~Eris.Constants.Permissions.sendMessages;

        bot.editChannelPermission(channelId, userId, allowMask, denyMask, 'member').then(function() {
            bot.createMessage(message.channel.id, util.format('%s has been unmuted on %s',
                Utils.formatUserMention(userId),
                Utils.formatChannelMention(channelId)));
        }).catch(e => console.log(e));
    };

});

bot.connect();