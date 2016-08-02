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
        .where('channel_id', selectedChannelId)
        .orderBy('timestamp', 'desc')
        .orderBy('discord_id', 'desc');

    if(searchTerm) {
        messagesQuery = messagesQuery.where('content', 'LIKE', '%' + searchTerm + '%');
    }
    else {
        messagesQuery = messagesQuery.whereRaw('date(timestamp) = ?', parsedDate.format('Y-MM-DD'));
    }

    var datesQuery = knex(constants.TABLE_MESSAGES)
        .select(knex.raw('date(timestamp) as date'))
        .where('channel_id', selectedChannelId)
        .groupByRaw('date(timestamp)');

    var channelsQuery = knex(constants.TABLE_MESSAGES)
        .select('channels.name', knex.raw('cast(messages.channel_id as char(50)) as channel_id'))
        .leftJoin('channels', 'channels.channel_id', '=', 'messages.channel_id')
        .where('messages.server_id', serverId)
        .groupBy('messages.channel_id');


    Promise.all([ messagesQuery, datesQuery, channelsQuery ]).then((values) => {
        var messages = values[0].map(row => {
            var username_nick = row.member_nickname ? util.format('%s (%s)', row.member_nickname, row.member_username) :
                row.member_username;

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

        res.render('index', { serverId, messages, dates, selectedDate, channels, selectedChannelId, searchTerm });
    });
});

module.exports = router;
