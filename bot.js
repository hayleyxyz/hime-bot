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
const fs = require('fs');
const moment = require('moment');
const numeral = require('numeral');
const constants = require('./constants');
const ChannelWhitelistGuard = require('./lib/Guards/ChannelWhitelistGuard');
const UserWhitelistGuard = require('./lib/Guards/UserWhitelistGuard');
const CustomCommandHandler = require('./lib/CustomCommandHandler');
const VoiceSession = require('./lib/VoiceSession');
const querystring = require('querystring');

var bot = new Eris(config.token, config.erisOptions);

bot.on('ready', () => {
    console.log('Username: ' + bot.user.username);

    console.log('Servers:');

    console.log();
});

bot.on('error', (e) => {
    console.log(e);
});

var commands = new CommandHandler();
bot.on('messageCreate', (message) => {
    commands.handle(bot, message);
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

commands.command('hug', (command) => {

    command.args((args) => {
        args.user().optional();
    });

    command.handler = (bot, message, userId) => {
        if(!userId) {
            userId = message.author.id;
        }

        bot.createMessage(message.channel.id, util.format('*hugs %s*', Utils.formatUserMention(userId)));
    };

});

commands.command('shrug', (command) => {

    command.handler = (bot, message) => {
        bot.createMessage(message.channel.id, '¯\\_(ツ)_/¯');
    };

});

bot.connect();