/**
 * Created by oscar on 29/07/2016.
 */

const Eris = require('eris');
const config = require('./config');
const moment = require('moment');
const util = require('util');
const fs = require('fs');
const knex = require('knex')(config.knexOptions);
const MessageLogger = require('./lib/MessageLogger');

var logger = new MessageLogger(knex);
var bot = new Eris(config.token, config.erisOptions);

bot.on('ready', () => {
    console.log('Username: ' + bot.user.username);

    console.log('Servers:');

    bot.guilds.forEach(function(server) {
        console.log('\t' + server.name);
    });

    console.log();

    function getMessages(before) {
        "use strict";

        bot.getMessages('179986759067762688', 100, before).then((messages) => {
            "use strict";

            var lastId = null;

            for(var i in messages) {
                var message = messages[i];

                logger.handle(bot, message);

                lastId = message.id;
            }

            getMessages(lastId);
        });
    }

    getMessages();
});

bot.on('error', () => {
    console.log(arguments);
});

bot.connect();