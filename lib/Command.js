/**
 * Created by oscar on 28/07/2016.
 */

const CommandArgumentBuilder = require('./CommandArgumentBuilder');

class Command {

    constructor() {
        this.middleware = new Set();
        this.arguments = null;
    }

    args(fn) {
        var builder = new CommandArgumentBuilder();
        fn(builder);
        this.arguments = builder;
    }

}

module.exports = Command;