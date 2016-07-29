/**
 * Created by oscar on 29/07/2016.
 */

class CustomCommandHandler {

    constructor(models) {
        this.models = models;
        this.guards = new Set();
    }

    handle(bot, message) {
        if(message.content.substr(0, 1) !== '.') {
            return;
        }

        var parts = message.content.split(' ');
        var trigger = parts[0].substr(1).toLowerCase();

        this.models.CustomCommand.where('name', trigger).fetch().then((result) => {
            if(result) {
                var guards = [ ];

                this.guards.forEach((g) => { guards.push(g.run(bot, message)) });

                Promise.all(guards).then(() => {
                    bot.createMessage(message.channel.id, result.get('content'));
                });
            }
        });
    }

}

module.exports = CustomCommandHandler;