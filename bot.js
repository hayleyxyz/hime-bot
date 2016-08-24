/**
 * Created by oscar on 19/07/2016.
 */

const Eris = require('eris');
const CommandHandler = require('./lib/CommandHandler');
const CustomCommandHandler = require('./lib/CustomCommandHandler');
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
const stream = require('stream');
const vm = require('vm');
const Gist = require('./lib/Gist');
const ytdl = require('ytdl-core');
const URL = require('url');
const SC = require('node-soundcloud');
const http = require('http');
const https = require('https');
const xray = require('x-ray')();

SC.init(config.soundcloud);

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

    console.log('Guilds:');

    bot.guilds.forEach((guild) => {
        console.log('\t' + guild.name);

        db.batchInsertChannels(guild.channels);
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

bot.on('messageDelete', (message) => {
    db.updateMessageDeleted(message.id);
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

commands.command('settings.edit', (command) => {

    command.args((args) => {
        args.argument('name');
        args.argument('value');
    });

    command.handler = (bot, message, name, value) => {
        db.insertUpdateGuildSetting(message.channel.guild.id, name, value);
    };
});

commands.command('js', (command) => {

    command.args((args) => {
        args.argument('code');
    });

    command.handler = (bot, message, input) => {
        var script = vm.createScript(input, {
            displayErrors: false
        });

        var context = vm.createContext({
            Math
        });

        try {
            var result = script.runInContext(context, {
                displayErrors: false,
                timeout: 5000
            });

            var formatted = util.inspect(result);

            if (formatted.length > 1600) {
                Gist.create(options).then(result => {
                    bot.createMessage(message.channel.id, util.format('```> %s```\n%s', input, result.html_url));
                });
            }
            else {
                bot.createMessage(message.channel.id, util.format('```> %s\n%s```', input, formatted));
            }
        }
        catch(error) {
            bot.createMessage(message.channel.id, util.format('```> %s\n%s```', input, error));
        }

    };
});

commands.command('play', (command) => {

    command.args((args) => {
        args.argument('fileOrUrl');
    });

    command.handler = (bot, message, fileOrUrl) => {
        var targetChannelId = message.member.voiceState.channelID;

        if(!targetChannelId) {
            var voiceChannel = message.channel.guild.channels.find(channel => channel.type === 2 && channel.id !== message.afkChannelID);

            if(!voiceChannel) {
                throw 'No voice channel available';
            }

            targetChannelId = voiceChannel.id;
        }

        bot.joinVoiceChannel(targetChannelId).then(connection => {
            if(connection.playing) {
                return;
            }

            var parsedUrl = URL.parse(fileOrUrl);

            if(parsedUrl.hostname.match(/^(www\.)?(youtube\.com)|(youtu\.be)$/)) {
                let stream = ytdl(fileOrUrl, { quality: 'lowest' });

                connection.playStream(stream);
            }
            else if(parsedUrl.hostname.match(/(www\.)?soundcloud.com/i)) { // Soundcloud URL
                SC.get('/resolve', {url: fileOrUrl}, function (err, track) {
                    if (err) {
                        throw err;
                    } else {
                        var matches = track.location.match(/\/tracks\/([0-9]+).json/);

                        if (matches) {
                            var id = matches[1];

                            SC.get('/tracks/' + id + '/streams', function (err, track) {
                                if(!err) {
                                    var downloadUrl = track.http_mp3_128_url;

                                    https.get(downloadUrl, function (response) {
                                        connection.playStream(response);
                                    });
                                }
                            });
                        }
                    }
                });
            }
            else if(parsedUrl.hostname.match(/(www\.)?tmbox.net/i)) {
                xray(fileOrUrl, '.player embed@src')(function(err, src) {
                    let parsedSrc = URL.parse(src, { parseQueryString: true });

                    https.get(parsedSrc.query.mp3, function (response) {
                        connection.playStream(response);
                    });
                })
            }
        });
    };
});


bot.connect();