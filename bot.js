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
const Database = require('./lib/Database');
const querystring = require('querystring');


var db = new Database(knex);
var logger = new MessageLogger(db);

var userGuard = new UserWhitelistGuard([
    '175044949744680970',
    '163017409521909760'
]);

var bot = new Eris(process.env.DISCORD_TOKEN || config.token, config.erisOptions);

bot.on('ready', () => {
    console.log('Username: ' + bot.user.username);

    console.log('Servers:');

    bot.guilds.forEach((server) => {
        console.log('\t' + server.name);

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

commands.command('logs', (command) => {

    command.handler = (bot, message) => {
        var url = util.format('%s/logs/%s?%s',
            config.webUrl,
            message.channel.guild.id,
            querystring.stringify({ channel: message.channel.id }));

        bot.createMessage(message.channel.id, url);
    };

});

commands.command('commands.edit', (command) => {

    command.guards.add(userGuard);

    command.args((args) => {
        args.argument('name');
        args.argument('content');
    });

    command.handler = (bot, message, name, content) => {
        db.insertUpdateCustomCommand(name, content);
    };

});

bot.connect();