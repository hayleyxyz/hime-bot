/**
 * Created by oscar on 28/07/2016.
 */

const Eris = require('eris');

class HimeBot extends Eris.Client {

    constructor(token, options) {
        super(token, options);

        this.on('ready', (token) => {
            console.log(arguments);
        });

        this.on('messageCreate', (message) => {
            //
        });
    }
}

module.exports = HimeBot;