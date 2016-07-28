/**
 * Created by oscar on 28/07/2016.
 */

const CommandArgument = require('./CommandArgument');

class CommandArgumentBuilder extends Set {

    optional(name) {
        return this.argument(name, [ CommandArgument.OPTIONAL ]);
    }

    user(name = 'user') {
        return this.argument(name, [ CommandArgument.USER ]);
    }

    channel(name = 'channel') {
        return this.argument(name, [ CommandArgument.CHANNEL ]);
    }

    argument(name, attributes = [ ]) {
        var arg = new CommandArgument(name, attributes);

        this.add(arg);

        return arg;
    }

}

module.exports = CommandArgumentBuilder;