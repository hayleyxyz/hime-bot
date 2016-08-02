var express = require('express');
var router = express.Router();

const moment = require('moment');
const config = require('../config');
const knex = require('knex')(config.knexOptions);
const constants = require('../constants');
const util = require('util');

router.get('/logs/:serverId', function(req, res, next) {
    var parsedDate = moment(req.query.date, 'D MMMM, YYYY');

    if(!parsedDate.isValid()) {
        parsedDate = moment();
    }

    var selectedDate = parsedDate.format('D MMMM, YYYY');

    var selectedChannelId = req.query.channel;
    if(!selectedChannelId) {
        selectedChannelId = req.params.serverId;
    }

    var serverId = req.params.serverId;

    var searchTerm = req.query.search;

    var messagesQuery = knex(constants.TABLE_MESSAGES)
        .select('messages.*', knex.raw('COUNT(messages.message_id) as copies_count'))
        .where('channel_id', selectedChannelId)
        .orderBy('timestamp', 'desc')
        .orderBy('message_id', 'desc')
        .groupBy('message_id');

    if(searchTerm) {
        messagesQuery = messagesQuery.where('content', 'LIKE', '%' + searchTerm + '%');
    }
    else {
        messagesQuery = messagesQuery.whereRaw('DATE(FROM_UNIXTIME(messages.timestamp / 1000)) = ?', parsedDate.format('Y-MM-DD'));
    }

    var datesQuery = knex(constants.TABLE_MESSAGES)
        .select(knex.raw('DATE(FROM_UNIXTIME(messages.timestamp / 1000)) as date'))
        .where('channel_id', selectedChannelId)
        .groupByRaw('DATE(timestamp)');

    var channelsQuery = knex(constants.TABLE_MESSAGES)
        .select('channels.name', knex.raw('messages.channel_id'))
        .leftJoin('channels', 'channels.channel_id', '=', 'messages.channel_id')
        .where('messages.server_id', serverId)
        .groupBy('messages.channel_id');


    Promise.all([ messagesQuery, datesQuery, channelsQuery ]).then((values) => {
        var messages = values[0].map(row => {
            var username_nick = row.user_nick ? util.format('%s (%s)', row.user_nick, row.user_username) :
                row.user_username;

            return {
                username_nick,
                datetime: moment(row.timestamp).format(),
                formatted_time: moment(row.timestamp).format(searchTerm ? 'D MMMM, YYYY, H:mm' : 'H:mm'),
                content: row.content
            };
        });

        var dates = values[1].map(row => row.date);

        var channels = values[2].map(row => {
            return { id: row.channel_id,
                display: '#' + row.name || row.channel_id
            };
        });

        console.log(messages);

        res.render('index', { serverId, messages, dates, selectedDate, channels, selectedChannelId, searchTerm });
    })
    .catch((e) => {
        throw e;
    })
});

module.exports = router;
