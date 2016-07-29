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

//SC.init(config.soundcloud);

class VoiceSession {

    constructor(bot, channelId) {
        this.bot = bot;
        this.channelId = channelId;
        this.connection = null;
    }

    getConnection() {
        if(this.connection === null) {
            return this.bot.joinVoiceChannel(this.channelId);
        }
        else {
            return new Promise((resolve, reject) => {
                resolve(this.connection);
            });
        }
    }
}

class CommandMiddleware {

    static handle(bot, message) {
        return true;
    }

}

class SelfGuard extends CommandMiddleware {

    static handle(bot, message) {
        return (bot.user.id === message.user.id);
    }

}

class CustomCommandHandler {

    handle(bot, message) {
        if(message.content.substr(0, 1) !== '.') {
            return;
        }

        var parts = message.content.split(' ');
        var trigger = parts[0].substr(1).toLowerCase();

        models.CustomCommand.fetchAll().then(function(rows) {
            for (var i in rows.models) {
                var model = rows.models[i];

                if(model.get('name') === trigger) {
                    bot.createMessage(message.channel.id, model.get('content'));
                    return;
                }
            }
        });
    }

}

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

bot.on('error', () => {
    console.log(arguments);
});

var logger = new MessageLogger(models);
bot.on('messageCreate', (message) => {
    logger.handle(bot, message);
});

var commands = new CommandHandler();
bot.on('messageCreate', (message) => {
    commands.handle(bot, message);
});

var customCommands = new CustomCommandHandler();
bot.on('messageCreate', (message) => {
    customCommands.handle(bot, message);
});

commands.command('play', (command) => {

    command.middleware.add(SelfGuard);

    command.args((args) => {
        args.argument('fileOrUrl');
    });

    command.handler = (bot, message, fileOrUrl) => {
        var serverId = message.channel.guild.id;
        var session = null;

        if(!voiceSessions.has(serverId)) {
            var voiceChannels = bot.guilds.get(serverId).channels.filter(function(item) {
                return item.type === 2;
            });

            if(voiceChannels.length > 0) {
                session = new VoiceSession(bot, voiceChannels[0].id);
                voiceSessions.set(serverId, voiceSessions);
            }
            else {
                throw new Error('No voice channels in server!');
            }
        }
        else {
            session = voiceSessions.get(serverId);
        }

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
    };
});

commands.command('enable', (command) => {
    command.description = 'Enable the bot on this server.';

    command.handler = (bot, message) => {
        var model = new models.ServerWhitelist().save({
            server_id: message.channel.guild.id
        }).then(function() {
            bot.createMessage(message.channel.id,
                util.format('Self-bot enabled on **%s**', message.channel.guild.name));
        });
    };
});

commands.command('disable', (command) => {
    command.description = 'Disable the bot on this server.';

    command.handler = (bot, message) => {
        var model = models.ServerWhitelist
            .where('server_id', message.channel.guild.id).destroy().then(function() {
                bot.createMessage(message.channel.id,
                util.format('Self-bot disabled on **%s**', message.channel.guild.name));
            });
    };
});

commands.command('commands.edit', (command) => {
    command.description = 'Edit a custom command.';

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

    command.args((args) => {
        args.argument('name');
    });

    command.handler = (bot, message, name, content) => {
        models.CustomCommand
            .where('name', name)
            .destroy();
    };
});

commands.command('socks', (command) => {
    command.description = 'Give socks.';

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

bot.connect();