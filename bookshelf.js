/**
 * Created by oscar on 19/07/2016.
 */

module.exports = function(config) {
    var knex = require('knex')(config.knexOptions);

    return require('bookshelf')(knex);
};