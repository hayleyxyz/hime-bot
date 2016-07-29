/**
 * Created by oscar on 28/07/2016.
 */

"use strict";

const Command = require('./Command');
const CommandArgument = require('./CommandArgument');
const Utils = require('./Utils');

class CommandHandler {

    constructor() {
        this.commands = new Map();
    }

    handle(bot, message) {
        if(message.content.substr(0, 1) !== '.') {
            return;
        }

        var parts = message.content.split(' ');
        var trigger = parts[0].substr(1).toLowerCase();
        var fnArgs = [ bot, message ];

        this.commands.forEach(function(command, name) {
            if(trigger === name.toLowerCase()) {
                if(command.arguments) {
                    var index = 1;
                    command.arguments.forEach(function (arg) {
                        var value = parts[index++];

                        if (typeof value === 'undefined') {
                            if (!arg.options.has(CommandArgument.OPTIONAL)) {
                                return;
                            }
                        }
                        else {
                            if (index - 1 === command.arguments.size) {
                                value += ' ' + parts.slice(index).join(' ');
                            }

                            value = value.trim();

                            if (arg.options.has(CommandArgument.USER)) {
                                value = Utils.parseUserMention(value);
                            }
                            else if (arg.options.has(CommandArgument.CHANNEL)) {
                                value = Utils.parseChannelMention(value);
                            }
                        }

                        fnArgs.push(value);
                    });
                }

                var middlewarePassed = true;

                command.middleware.forEach(function(item) {
                    if(!item.handler(bot, message)) {
                        middlewarePassed = false;
                        return false;
                    }
                });

                if(middlewarePassed) {
                    command.handler.apply(bot, fnArgs);
                }
            }
        });
    }

    command(name, fn) {
        var command = new Command();
        fn(command);
        this.commands.set(name, command);
        return command;
    }

}

module.exports = CommandHandler;