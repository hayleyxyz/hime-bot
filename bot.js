/**
 * Created by oscar on 19/07/2016.
 */

var util = require('util');
var Eris = require('eris');
var moment = require('moment');
var bookshelf = require('./lib/bookshelf');
var models = require('./lib/models')(bookshelf);
var config = require('./config');
var exec = require('child_process').exec;

function Command(trigger) {
    this.trigger = trigger;
    this.params = [ ];
    this.handler = null;
    this.protected = false;

    this.param = function(name, options) {
        options = options || { };
        options.name = name;

        this.params.push(options);

        return this;
    };

    this.do = function(handler) {
        this.handler = handler;

        return this;
    };

    this.admin = function() {
        this.protected = true;
*
        return this;
    };

}

function HimeBot(token) {
    (function(scope) {

        /**
         *
         * @type {Eris.Client}
         */
        scope.client = new Eris(token);

        scope.prefix = '!';

        scope.commands = [ ];

        scope.addCommand = function(command) {
            scope.commands.push(command);
        };

        scope.formatUserMention = function(userId) {
            return '<@' + userId + '>';
        };

        scope.formatChannelMention = function(channelId) {
            return '<#' + channelId + '>';
        };

        scope.parseUserMention = function(input) {
            var matches = input.match(/(<@!?([0-9]+)>)/);

            if(matches === null) {
                return null;
            }
            else {
                return matches[2];
            }
        };

        scope.parseChannelMention = function(input) {
            var matches = input.match(/(<#([0-9]+)>)/);

            if(matches === null) {
                return null;
            }
            else {
                return matches[2];
            }
        };

        scope.dispatchMessageCommand = function(message) {
            if(message.content.charAt(0) === scope.prefix) {
                for(var i in scope.commands) {
                    var args = [ message ];
                    var parts = message.content.split(' ');
                    var command = scope.commands[i];
                    var trigger = parts.shift().substr(1);

                    if(trigger === command.trigger) {

                        if(command.protected) {
                            // TODO
                        }

                        for(var x in command.params) {
                            var param = command.params[x];
                            var value = parts.shift();

                            if(typeof value === 'undefined') {
                                if(!param.optional) {
                                    return;
                                }
                            }
                            else {
                                if (x == command.params.length - 1) {
                                    value += ' ' + parts.join(' ');
                                }

                                value = value.trim();

                                if(param.mention) {
                                    value = scope.parseUserMention(value);
                                }

                                if(param.channel) {
                                    value = scope.parseChannelMention(value);
                                }
                            }

                            args.push(value);
                        }

                        command.handler.apply(scope, args);
                    }
                }
            }
        };

        scope.events = {

            ready: function() {
                console.log('HimeBot');
                console.log('Bot username: ' + scope.client.user.username);

                console.log('Servers:');

                scope.client.guilds.map(function(server) {
                    console.log('\t' + server.name);
                });

                console.log();
            },

            messageCreate: function(message) {
                /*
                 * Save the message in the db
                 */
                /*
                var messageRecord = new models.Message({
                    discord_id: message.id,
                    channel_id: message.channel.id,
                    server_id: message.channel.guild.id,
                    member_id: message.author.id,
                    member_username: message.author.username,
                    member_nickname: message.member.nick,
                    content: message.content,
                    timestamp: moment(message.timestamp).format('Y-MM-DD HH:mm:ss')
                }).save();
                */


                /*
                 * Print message to console
                 */
                //console.log(util.format('%s - #%s [%s] %s: %s', message.channel.guild.name, message.channel.name,
                //    moment(message.timestamp).format('YYYY-MM-DD HH:mm'), message.author.username, message.content));

                /*
                 * Handle command in message
                 */
                scope.dispatchMessageCommand(message);
            }

        };

        scope.client.on('ready', scope.events.ready);
        scope.client.on('messageCreate', scope.events.messageCreate);

        scope.client.connect();

    })(this);
}

var bot = new HimeBot(config.token);

bot.addCommand(
    new Command('nick')
        .param('user', { mention: true })
        .param('nick', { optional: true })
        .admin()
        .do(function(message, userId, nick) {
            this.client.editGuildMember(message.channel.guild.id, userId, { nick: nick });
        })
);

bot.addCommand(
    new Command('game')
        .param('game')
        .admin()
        .do(function(message, game) {
            this.client.editGame({ name: game });
        })
);

bot.addCommand(
    new Command('mute')
        .param('user', { mention: true })
        .param('channel', { channel: true, optional: true })
        .admin()
        .do(function(message, userId, channelId) {
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

            var bot = this;

            this.client.editChannelPermission(channelId, userId, allowMask, denyMask, 'member').then(function() {
                bot.client.createMessage(message.channel.id, util.format('%s has been muted on %s',
                    bot.formatUserMention(userId),
                    bot.formatChannelMention(channelId)));
            });
        })
);

bot.addCommand(
    new Command('unmute')
        .param('user', { mention: true })
        .param('channel', { channel: true, optional: true })
        .admin()
        .do(function(message, userId, channelId) {
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

            var bot = this;

            this.client.editChannelPermission(channelId, userId, allowMask, denyMask, 'member').then(function() {
                bot.client.createMessage(message.channel.id, util.format('%s has been unmuted on %s',
                    bot.formatUserMention(userId),
                    bot.formatChannelMention(channelId)));
            });
        })
);

bot.addCommand(
    new Command('np')
        .do(function() {
            exec('osascript -e \'tell application "iTunes" to if player state is playing then "Now Playing: " & name of current track & " - " & artist of current track\'', function(error, stdout, stderr) {
                
            });
        })
);