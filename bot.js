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

    handle(bot, message, next) {
        next();
    }

}

class SelfGuard extends CommandMiddleware {



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

commands.command('play', (command) => {

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

bot.connect();