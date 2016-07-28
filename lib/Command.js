/**
 * Created by oscar on 28/07/2016.
 */

const CommandArgumentBuilder = require('./CommandArgumentBuilder');

class Command {
    
    args(fn) {
        var builder = new CommandArgumentBuilder();
        fn(builder);
        this.args = builder;
    }

}

module.exports = Command;