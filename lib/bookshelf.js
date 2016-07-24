/**
 * Created by oscar on 19/07/2016.
 */

var config = require('../config');

var knex = require('knex')(config.knexOptions);

var bookshelf = require('bookshelf')(knex);

module.exports = bookshelf;