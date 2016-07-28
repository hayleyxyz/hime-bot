/**
 * Created by oscar on 19/07/2016.
 */

var util = require('util');
var Eris = require('eris');
var moment = require('moment');
var bookshelf = require('./lib/bookshelf');
var models = require('./lib/models')(bookshelf);
var config = require('./config');
var request = require('request').defaults({ encoding: null });
var SC = require('node-soundcloud');
var stream = require('stream');
var fs = require('fs');
var ytdl = require('ytdl-core');
var URL = require('url');

function VoiceSession(bot, channelId) {
    (function(scope) {

        scope.channelId = channelId;
        scope.bot = bot;
        scope.connection = null;

        scope.getConnection = function(callback) {
            if(!scope.connection) {
                return scope.bot.client.joinVoiceChannel(scope.channelId);
            }
            else {
                return new Promise(function (resolve, reject) {
                    resolve(scope.connection);
                });
            }
        };

    })(this);
}

function Command(trigger) {
    this.trigger = trigger;
    this.params = [ ];
    this.handler = null;
    this.requiresAdmin = false;
    this.requiresOwner = false;
    this.descriptionText = '';

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
        this.requiresAdmin = true;

        return this;
    };

    this.owner = function() {
        this.requiresOwner = true;

        return this;
    };

    this.description = function(value) {
        this.descriptionText = value;

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

        scope.prefix = '.';

        scope.commands = [ ];

        scope.voiceSessions = [ ];

        scope.getVoiceSession = function(serverId) {
            if(!(serverId in scope.voiceSessions)) {
                var channelId = null;

                var voiceChannels = scope.client.guilds.get(serverId).channels.filter(function(item) {
                    return item.type === 2;
                });

                // TODO: Error handling when no voice channels in server
                if(voiceChannels.length > 0) {
                    scope.voiceSessions[serverId] = new VoiceSession(scope, voiceChannels[0].id);
                }
            }

            return scope.voiceSessions[serverId];
        };

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
                scope.commands.forEach(function(command) {
                    var args = [ message ];
                    var parts = message.content.split(' ');
                    var trigger = parts.shift().substr(1);

                    if(trigger === command.trigger) {
                        if(command.requiresAdmin) {
                            models.ServerAdminRole.where('server_id', message.channel.guild.id).fetchAll().then(function(rows) {
                                for(var i in rows.models) {
                                    var model = rows.models[i];
                                    var roleId = null;

                                    // Resolve role ID via name
                                    message.channel.guild.roles.map(function(role) {
                                        if(role.name === model.attributes.role_name) {
                                            roleId = role.id;
                                        }
                                    });

                                    if(roleId) {
                                        if(message.member.roles.indexOf(roleId) >= 0) {
                                            continueCommand(command);
                                            break;
                                        }
                                    }
                                }
                            });
                        }
                        else if(command.requiresOwner) {
                            // Hardcoded for now
                            var ownerIds = [
                                '159592526498496512', // Luna/Summer/Rose/whatever
                                '175044949744680970' // yui
                            ];

                            if(ownerIds.indexOf(message.author.id) >= 0) {
                                continueCommand(command);
                            }
                        }
                        else {
                            continueCommand(command);
                        }

                        function continueCommand(command) {
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
                });
            }
        };

        scope.dispatchCustomCommand = function(message) {
            if(message.content.charAt(0) === scope.prefix) {
                var parts = message.content.split(' ');
                var trigger = parts.shift().substr(1);

                models.CustomCommand.where('server_id', message.channel.guild.id).fetchAll().then(function(rows) {
                    for (var i in rows.models) {
                        var model = rows.models[i];

                        if(model.attributes.name === trigger) {
                            scope.client.createMessage(message.channel.id, model.attributes.content);
                            return;
                        }
                    }
                });

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
                var isDm = (message.channel instanceof Eris.PrivateChannel);

                /*
                 * Save the message in the db
                 */
                var messageRecord = new models.Message({
                    discord_id: message.id,
                    channel_id: message.channel.id,
                    server_id: message.channel.guild ? message.channel.guild.id : null,
                    member_id: message.author.id,
                    member_username: message.author.username,
                    member_nickname: message.member ? message.member.nick : null,
                    content: message.content,
                    timestamp: moment(message.timestamp).format('Y-MM-DD HH:mm:ss')
                }).save();

                /*
                 * Print message to console
                 */
                var channelDesc = null;

                if(!isDm) {
                    channelDesc = util.format('%s - #%s', message.channel.guild.name, message.channel.name);
                }
                else {
                    channelDesc = util.format('@%s', message.channel.recipient.username);
                }

                console.log(util.format('%s [%s] %s: %s', channelDesc,
                    moment(message.timestamp).format('YYYY-MM-DD HH:mm'), message.author.username, message.content));

                /*
                 * Handle command in message
                 */
                if(!isDm && message.author.id !== scope.client.user.id) {
                    scope.dispatchMessageCommand(message);
                    scope.dispatchCustomCommand(message);
                }
            }

        };

        scope.client.on('ready', scope.events.ready);
        scope.client.on('messageCreate', scope.events.messageCreate);

        scope.client.connect();

    })(this);
}

var bot = new HimeBot(config.token);

SC.init(config.soundcloud);

bot.addCommand(
    new Command('help')
        .description('Show this help text')
        .do(function(message) {
            var response = [ ];

            for(var i in this.commands) {
                var command = this.commands[i];
                var paramInfo = [ ];

                for(var x in command.params) {
                    var opt = command.params[x].name;

                    if(command.params[x].values) {
                        opt = command.params[x].values.join('|');
                    }

                    if(command.params[x].optional) {
                        opt = '[' + opt + ']';
                    }

                    paramInfo.push(opt);
                }

                response.push(util.format('`%s%s %s` - %s',  bot.prefix, command.trigger, paramInfo.join(' '), command.descriptionText));
            }

            bot.client.createMessage(message.channel.id, response.join('\n'));
        })
);

bot.addCommand(
    new Command('nick')
        .param('user', { mention: true })
        .param('nick', { optional: true })
        .admin()
        .description('Change or clear the nickname for a user')
        .do(function(message, userId, nick) {
            this.client.editGuildMember(message.channel.guild.id, userId, { nick: nick });
        })
);

bot.addCommand(
    new Command('game')
        .param('game')
        .owner()
        .description('Change the bot\'s currently displayed playing game')
        .do(function(message, game) {
            this.client.editGame({ name: game });
        })
);

bot.addCommand(
    new Command('mute')
        .param('user', { mention: true })
        .param('channel', { channel: true, optional: true })
        .admin()
        .description('Text-mute a user')
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
        .description('Text-unmute a user')
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
    new Command('vdisallow')
        .param('user', { mention: true })
        .admin()
        .description('Disallow a user from entering all voice channels')
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

            denyMask |= Eris.Constants.Permissions.voiceConnect;
            allowMask &= ~Eris.Constants.Permissions.voiceConnect;

            var bot = this;

            var voiceChannels = message.channel.guild.channels.filter(function(item) {
                return item.type === 'voice';
            });

            var promises = [ ];

            voiceChannels.map(function(channel) {
                promises.push(bot.client.editChannelPermission(channel.id, userId, allowMask, denyMask, 'member'));
            });

            Promise.all(promises).then(function() {
                bot.client.createMessage(message.channel.id, util.format('%s has been muted on all voice channels!',
                    bot.formatUserMention(userId)));
            });
        })
);

bot.addCommand(
    new Command('vallow')
        .param('user', { mention: true })
        .admin()
        .description('Allow a user from entering all voice channels')
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

            denyMask &= ~Eris.Constants.Permissions.voiceConnect;

            var bot = this;

            var voiceChannels = message.channel.guild.channels.filter(function(item) {
                return item.type === 2;
            });

            var promises = [ ];

            voiceChannels.map(function(channel) {
                promises.push(bot.client.editChannelPermission(channel.id, userId, allowMask, denyMask, 'member'));
            });

            Promise.all(promises).then(function() {
                bot.client.createMessage(message.channel.id, util.format('%s has been unmuted on all voice channels!',
                    bot.formatUserMention(userId)));
            });
        })
);

bot.addCommand(
    new Command('avatar')
        .param('avatarUrl')
        .owner()
        .description('Change the bot\'s avatar')
        .do(function(message, avatarUrl) {
            var bot = this;

            request.get(avatarUrl, function (error, response, body) {
                if(!error && response.statusCode == 200) {
                    bot.client.editSelf({
                        avatar: 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64')
                    }).catch(function() {
                        bot.client.createMessage(message.channel.id, 'A Discord API error occurred trying to set that avatar!');
                    });
                }
                else {
                    bot.client.createMessage(message.channel.id, 'An error occurred trying to get that avatar!');
                }
            });
        })
);

bot.addCommand(
    new Command('commands.edit')
        .param('name')
        .param('content')
        .admin()
        .description('Add a custom command')
        .do(function(message, name, content) {
            models.CustomCommand.where('server_id', message.channel.guild.id)
                .where('name', name)
                .fetch().then(function(record) {
                    if(record === null) {
                        record = new models.CustomCommand();
                    }

                    record.save({
                        server_id: message.channel.guild.id,
                        name: name,
                        content: content
                    });
                });
        })
);

bot.addCommand(
    new Command('commands.delete')
        .param('name')
        .admin()
        .description('Delete a custom command')
        .do(function(message, name, content) {
            models.CustomCommand.where('server_id', message.channel.guild.id)
                .where('name', name)
                .fetch().then(function(record) {

                if(record) {
                    record.destroy();
                }
            });
        })
);

bot.addCommand(
    new Command('commands.delete')
        .param('name')
        .admin()
        .description('Delete a custom command')
        .do(function(message, name, content) {
            models.CustomCommand.where('server_id', message.channel.guild.id)
                .where('name', name)
                .fetch().then(function(record) {

                if(record) {
                    record.destroy();
                }
            });
        })
);

bot.addCommand(
    new Command('admins.add')
        .param('role')
        .owner()
        .description('Adds a new admin role for this server')
        .do(function(message, roleName) {
            models.ServerAdminRole.where('server_id', message.channel.guild.id)
                .where('role_name', roleName)
                .fetch().then(function(record) {
                if(record === null) {
                    new models.ServerAdminRole({
                        server_id: message.channel.guild.id,
                        role_name: roleName
                    }).save();
                }
            });


        })
);

bot.addCommand(
    new Command('admins.remove')
        .param('role')
        .owner()
        .description('Removes a admin role for this server')
        .do(function(message, roleName) {
            models.ServerAdminRole.where('server_id', message.channel.guild.id)
                .where('role_name', roleName)
                .fetch().then(function(record) {
                if(record) {
                    record.destroy();
                }
            });
        })
);

bot.addCommand(
    new Command('play')
        .param('url')
        .param('channel', { optional: true, channel: true })
        .admin()
        .do(function(message, fileOrUrl) {
            var bot = this;
            var serverId = message.channel.guild.id;

            var session = bot.getVoiceSession(serverId);

            session.getConnection().then(function(vc) {

                if(!fileOrUrl) {
                    if(!vc.playing) {
                        vc.resume();
                    }
                }
                else {
                    var parsed = URL.parse(fileOrUrl);

                    if(parsed && parsed.host) {
                        // YouTube URL
                        if(parsed.host.match(/(www\.)?youtube.com|(www\.)?youtu.be/i)) {

                            ytdl.getInfo(fileOrUrl, function(err, info) {
                                var filePath = './storage/youtube/' + info.video_id;
                                var tmpFilePath = filePath + '.tmp';

                                if(fs.existsSync(filePath)) {
                                    vc.playFile(filePath);
                                }
                                else {
                                    var stream = ytdl(fileOrUrl);

                                    stream.pipe(fs.createWriteStream(tmpFilePath));

                                    stream.on('end', function() {
                                        if(!fs.existsSync(filePath)) {
                                            fs.rename(tmpFilePath, filePath);
                                        }
                                    });

                                    vc.playStream(stream);
                                }
                            });
                        }
                        else if(parsed.host.match(/(www\.)?soundcloud.com/i)) { // Soundcloud URL
                            SC.get('/resolve', {url: fileOrUrl}, function (err, track) {
                                if (err) {
                                    throw err;
                                } else {
                                    var matches = track.location.match(/\/tracks\/([0-9]+).json/);

                                    if (matches) {
                                        var id = matches[1];
                                        var filePath = './storage/soundcloud/' + id + '.mp3';

                                        if (fs.existsSync(filePath)) {
                                            vc.playFile(filePath);
                                        }
                                        else {
                                            SC.get('/tracks/' + id + '/streams', function (err, track) {
                                                var downloadUrl = track.http_mp3_128_url;

                                                request.get(downloadUrl, function (error, response, body) {
                                                    if (!error && response.statusCode == 200) {
                                                        var bufferStream = new stream.PassThrough();
                                                        bufferStream.end(body);

                                                        vc.playStream(bufferStream);

                                                        // Write file async so we have it for next time
                                                        fs.writeFile(filePath, body);
                                                    }
                                                    else {
                                                        bot.client.createMessage(message.channel.id, 'An error occurred trying to get that track!');
                                                    }
                                                });
                                            });
                                        }

                                    }
                                }
                            });
                        }
                    }
                    else {
                        // File path
                        if(fs.existsSync(fileOrUrl)) {
                            vs.playFile(fileOrUrl);
                        }
                        else {
                            // *shrug*
                        }
                    }
                }
            });
        })
);

bot.addCommand(
    new Command('pause')
        .admin()
        .do(function (message) {
            var bot = this;
            var serverId = message.channel.guild.id;

            var session = bot.getVoiceSession(serverId);

            session.getConnection().then(function(vc) {
                if(vc.playing) {
                    vc.pause();
                }
            });
        })
);