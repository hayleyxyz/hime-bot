/**
 * Created by oscar on 29/07/2016.
 */

const Eris = require('eris');
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
const Database = require('./lib/Database');

var db = new Database(knex);
var logger = new MessageLogger(db);

//var serverId = '117436212867760130';
var channelId = '117436212867760130';

var bot = new Eris(process.env.DISCORD_TOKEN || config.token, config.erisOptions);

bot.on('ready', () => {
    console.log('Username: ' + bot.user.username);

    console.log('Servers:');

    bot.guilds.forEach(function(server) {
        console.log('\t' + server.name);
    });

    console.log();

    knex(constants.TABLE_MESSAGES)
        .select('message_id')
        .where('channel_id', channelId)
        .groupBy('message_id')
        .pluck('message_id')
        .then(existingIds => {

            function getMessages(before) {
                bot.getMessages(channelId, 100, before).then((messages) => {
                    var lastId = null;

                    for(var i in messages) {
                        var message = messages[i];

                        if(existingIds.indexOf(message.id) === -1) {
                            logger.handle(bot, message);
                        }

                        lastId = message.id;
                    }

                    getMessages(lastId);
                });
            }

            getMessages();

        });
}).catch(e => {
    console.log(e);
});

bot.on('error', () => {
    console.log(arguments);
});

bot.connect();