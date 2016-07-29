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
const bookshelf = require('./bookshelf')(config);
const models = require('./models')(bookshelf);
const SC = require('node-soundcloud');
const fs = require('fs');
const moment = require('moment');
const numeral = require('numeral');
const ChannelWhitelistGuard = require('./lib/Guards/ChannelWhitelistGuard');
const OwnerGuard = require('./lib/Guards/OwnerGuard');
const CustomCommandHandler = require('./lib/CustomCommandHandler');
const VoiceSession = require('./lib/VoiceSession');

//SC.init(config.soundcloud);

var voiceSessions = new Map();

var bot = new Eris(config.token, config.erisOptions);

bot.on('ready', () => {
    console.log('Username: ' + bot.user.username);

    console.log('Servers:');

    bot.guilds.forEach(function(server) {
        console.log('\t' + server.name);
    });

    console.log();
});

bot.on('error', (e) => {
    console.log(e);
});

var logger = new MessageLogger(models);
bot.on('messageCreate', (message) => {
    logger.handle(bot, message);
});

var channelWhitelistGuard = new ChannelWhitelistGuard(models);
var ownerGuard = new OwnerGuard(config.ownerUserIds);

var commands = new CommandHandler();
bot.on('messageCreate', (message) => {
    commands.handle(bot, message);
});

var customCommands = new CustomCommandHandler(models);
customCommands.guards.add(channelWhitelistGuard);
bot.on('messageCreate', (message) => {
    customCommands.handle(bot, message);
});

commands.command('play', (command) => {

    command.guards.add(channelWhitelistGuard);

    command.args((args) => {
        args.argument('fileOrUrl');
    });

    command.handler = (bot, message, fileOrUrl) => {
        var serverId = message.channel.guild.id;
        var session = null;


        new Promise((resolve, reject) => {
            if(!voiceSessions.has(serverId)) {
                models.ServerSettings
                    .where('name', 'voiceChannelId')
                    .where('server_id', serverId)
                    .fetch().then(function(record) {
                        if(record) {
                            var voiceChannels = bot.guilds.get(serverId).channels.filter(function(item) {
                                return item.id === record.get('value');
                            });
                        }
                        else {
                            var voiceChannels = bot.guilds.get(serverId).channels.filter(function(item) {
                                return item.type === 2;
                            });
                        }

                        if(voiceChannels.length > 0) {
                            session = new VoiceSession(bot, voiceChannels[0].id);
                            voiceSessions.set(serverId, voiceSessions);
                        }
                        else {
                            throw new Error('No voice channels in server!');
                        }

                        resolve(session);
                    });
            }
            else {
                session = voiceSessions.get(serverId);
                resolve(session);
            }
        }).then((session) => {
            session.getConnection().then((vc) => {
                if(fs.existsSync(fileOrUrl)) {
                    vc.playFile(fileOrUrl);
                }
                else {
                    console.error('File does not exist: ', fileOrUrl);
                }
            }).catch(function(e) {
                console.log(e);
            });
        });
    };
});

commands.command('enable', (command) => {
    command.description = 'Enable the bot on this channel.';

    command.guards.add(ownerGuard);

    command.args((args) => {
        args.channel().optional();
    });

    command.handler = (bot, message) => {
        var model = new models.ChannelWhitelist().save({
            channel_id: message.channel.id
        }).then(function() {
            bot.createMessage(message.channel.id,
                util.format('Self-bot enabled on **%s**', Utils.formatChannelMention(message.channel.id)));
        });
    };
});

commands.command('disable', (command) => {
    command.description = 'Disable the bot on this channel.';

    command.guards.add(ownerGuard);
    command.guards.add(channelWhitelistGuard);

    command.handler = (bot, message) => {
        var model = models.ChannelWhitelist
            .where('channel_id', message.channel.id).destroy().then(function() {
                bot.createMessage(message.channel.id,
                    util.format('Self-bot disabled on **%s**', Utils.formatChannelMention(message.channel.id)));
            });
    };
});

commands.command('commands.edit', (command) => {
    command.description = 'Edit a custom command.';

    command.guards.add(channelWhitelistGuard);

    command.args((args) => {
        args.argument('name');
        args.argument('content');
    });

    command.handler = (bot, message, name, content) => {
        models.CustomCommand
            .where('name', name)
            .fetch().then(function(record) {
                if(record === null) {
                    record = new models.CustomCommand();
                }

                record.save({
                    name: name,
                    content: content
                });
            });
    };
});

commands.command('commands.delete', (command) => {
    command.description = 'Delete a custom command.';

    command.guards.add(channelWhitelistGuard);

    command.args((args) => {
        args.argument('name');
    });

    command.handler = (bot, message, name) => {
        models.CustomCommand
            .where('name', name)
            .destroy();
    };
});

commands.command('config.edit', (command) => {
    command.description = 'Edit a server config.';

    command.guards.add(ownerGuard);

    command.args((args) => {
        args.argument('name');
        args.argument('value');
    });

    command.handler = (bot, message, name, value) => {
        var serverId = message.channel.guild.id;

        models.ServerSettings
            .where('name', name)
            .where('server_id', serverId)
            .fetch().then(function(record) {
                if(record === null) {
                    record = new models.ServerSettings();
                }

                record.save({
                    name: name,
                    server_id: serverId,
                    value: value
                });
            });
    };
});

commands.command('config.get', (command) => {
    command.description = 'Get a server config.';

    command.guards.add(ownerGuard);

    command.args((args) => {
        args.argument('name');
    });

    command.handler = (bot, message, name) => {
        var serverId = message.channel.guild.id;

        models.ServerSettings
            .where('name', name)
            .where('server_id', serverId)
            .fetch().then(function(record) {
                if(record) {
                    bot.createMessage(message.channel.id,
                        util.format('Value: %s', record.get('value')));
                }
                else {
                    bot.createMessage(message.channel.id,
                        util.format('No config value found for key: %s', name));
                }
            });
    };
});

commands.command('socks', (command) => {
    command.description = 'Give socks.';

    command.guards.add(channelWhitelistGuard);

    command.handler = (bot, message) => {
        const primaryColours = [
            'white',
            'black'
        ];

        const secondaryColours = [
            'purple',
            'red',
            'yellow',
            'blue',
            'turquoise'
        ];

        const types = [
            'kneesocks',
            'thigh highs'
        ];

        var primaryColour = primaryColours[Math.floor(Math.random() * primaryColours.length)];
        var secondaryColour = secondaryColours[Math.floor(Math.random() * secondaryColours.length)];
        var type = types[Math.floor(Math.random() * types.length)];
        var sockCount = Math.round(Math.random() * 20);

        var userId = message.author.id;

        var model = new models.UserSock().save({
            user_id: userId,
            count: sockCount
        }).then(function() {
            bookshelf.knex('user_socks').sum('count as total').where('user_id', userId).then((result) => {
                var total = 0;

                if(result.length > 0) {
                    total = result[0].total;
                }

                bot.createMessage(message.channel.id,
                    util.format('**<@!%s> received %d %s & %s %s! They have %d socks in total.**',
                    userId, sockCount, primaryColour, secondaryColour, type, total));
            }).catch((reason) => {
                console.log(reason);
            });
        });

    };
});

commands.command('stats', (command) => {
    command.description = 'Get stats for user.';

    command.guards.add(channelWhitelistGuard);

    command.args((args) => {
        args.user().optional();
    });

    command.handler = (bot, message, userId) => {
        if(!userId) {
            userId = message.author.id;
        }

        bookshelf.knex('messages').count('id as count').max('timestamp as last_posted').where('member_id', userId).then((result) => {
            var count = 0;
            var lastPosted = 'never';

            if(result.length > 0) {
                count = result[0].count;
                lastPosted = moment(result[0].last_posted).format('dddd, MMMM Do YYYY, h:mm:ss a');
            }

            bot.createMessage(message.channel.id,
                util.format('<@%s>: Messages: %s, last message: %s', userId, numeral(count).format('0,0'), lastPosted));
        });
    };
});

commands.command('game', (command) => {
    command.description = 'Set current playing game.';

    command.guards.add(channelWhitelistGuard);

    command.args((args) => {
        args.argument('game');
    });

    command.handler = (bot, message, game) => {
        bot.editGame({ name: game });
    };
});

bot.connect();