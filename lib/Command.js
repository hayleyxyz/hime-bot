/**
 * Created by oscar on 28/07/2016.
 */

const CommandArgumentBuilder = require('./CommandArgumentBuilder');

class Command {

    constructor() {
        this.guards = new Set();
        this.arguments = null;
        this.description = null;
    }

    args(fn) {
        var builder = new CommandArgumentBuilder();
        fn(builder);
        this.arguments = builder;
    }

}

module.exports = Command;