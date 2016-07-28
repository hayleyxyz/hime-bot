/**
 * Created by oscar on 28/07/2016.
 */

class CommandArgument {

    constructor(name, options = [ ]) {
        this.name = name;
        this.options = new Set(options);
    }

    optional() {
        this.options.add(CommandArgument.OPTIONAL);
    }

}

CommandArgument.USER = 'user';
CommandArgument.OPTIONAL = 'optional';
CommandArgument.CHANNEL = 'channel';

module.exports = CommandArgument;